import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import FormData from 'form-data';
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});
const PORT = process.env.PORT || 5000;

app.use(express.json());
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fetchGeminiData(type, input, vtStats, vtFullData, isDarkWeb = false) {
  console.log(`Fetching Gemini data for ${type}: ${input}`);
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const prompt = isDarkWeb
    ? `
      Analyze ${type}: ${input} for potential dark web activity with detailed insights.
      VirusTotal stats: ${JSON.stringify(vtStats)}.
      Threat names: ${vtFullData.threat_names?.join(', ') || 'None'}.
      Categories: ${Object.values(vtFullData.categories || {}).join(', ') || 'Unknown'}.
      Reputation: ${vtFullData.reputation || 'N/A'}.
      Provide a comprehensive cybersecurity report with:
      - **Threats & Vulnerabilities:** List specific threats (e.g., malware, phishing, ransomware) based on VirusTotal data.
      - **Reputation:** Assess trustworthiness or known dark web associations.
      - **Context:** Describe potential dark web usage (e.g., illicit markets, data leaks).
      - **Safety Tips:** Provide 4+ actionable tips.
      - **Dark Web Detection:** Assess likelihood of dark web presence (e.g., based on threat names, reputation).
      - **JSON Pie Chart:** {"Safe": X, "Malicious": Y, "Suspicious": Z}, X + Y + Z = 100.
    `
    : `
      Analyze ${type}: ${input} for cybersecurity purposes with detailed insights.
      VirusTotal stats: ${JSON.stringify(vtStats)}.
      Threat names: ${vtFullData.threat_names?.join(', ') || 'None'}.
      Categories: ${Object.values(vtFullData.categories || {}).join(', ') || 'Unknown'}.
      Reputation: ${vtFullData.reputation || 'N/A'}.
      Provide a comprehensive cybersecurity report with:
      - **Threats & Vulnerabilities:** List specific threats (e.g., malware, phishing, ransomware) based on VirusTotal data.
      - **Reputation:** Assess domain trustworthiness or historical data.
      - **Context:** Describe the input’s purpose and risks.
      - **Safety Tips:** Provide 4+ actionable tips.
      - **JSON Pie Chart:** {"Safe": X, "Malicious": Y, "Suspicious": Z}, X + Y + Z = 100.
    `;

  try {
    const response = await axios.post(geminiUrl, { contents: [{ parts: [{ text: prompt }] }] });
    const text = response.data.candidates[0].content.parts[0].text;
    console.log(`Gemini Response for ${type}:`, text);
    return text;
  } catch (error) {
    console.error(`Gemini Error for ${type}:`, error.message);
    const isSafe = vtStats.malicious === 0 && vtStats.suspicious === 0;
    const total = vtStats.harmless + vtStats.undetected + vtStats.malicious + vtStats.suspicious || 1;
    const safePercentage = Math.round(((vtStats.harmless + vtStats.undetected) / total) * 100);
    const maliciousPercentage = Math.round((vtStats.malicious / total) * 100);
    const suspiciousPercentage = Math.round((vtStats.suspicious / total) * 100);

    const fallback = isDarkWeb
      ? `
        **Cybersecurity Report for ${input}**
        - **Threats & Vulnerabilities:** ${vtStats.malicious > 0 ? 'Potential dark web threats detected.' : 'No specific threats detected.'}
        - **Reputation:** ${vtFullData.reputation ? `Score: ${vtFullData.reputation}` : 'No data.'}
        - **Context:** Possibly linked to dark web if malicious flags present.
        - **Safety Tips:** Avoid sharing sensitive data, use VPNs, monitor accounts, verify sources.
        - **Dark Web Detection:** ${vtStats.malicious > 0 ? 'Possible dark web activity.' : 'No clear evidence.'}
        - **JSON Pie Chart:** {"Safe": ${safePercentage}, "Malicious": ${maliciousPercentage}, "Suspicious": ${suspiciousPercentage}}
      `
      : `
        **Cybersecurity Report for ${input}**
        - **Threats & Vulnerabilities:** ${vtStats.malicious > 0 ? 'Detected threats.' : 'No specific threats.'}
        - **Reputation:** ${vtFullData.reputation ? `Score: ${vtFullData.reputation}` : 'No data.'}
        - **Context:** General cybersecurity context.
        - **Safety Tips:** Use HTTPS, antivirus, 2FA, verify sources.
        - **JSON Pie Chart:** {"Safe": ${safePercentage}, "Malicious": ${maliciousPercentage}, "Suspicious": ${suspiciousPercentage}}
      `;
    return fallback;
  }
}

async function scanInput(input, type, isDarkWeb = false) {
  let vtStats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  let vtFullData = { reputation: 0, threat_names: [], categories: {} };
  const vtHeaders = { 'x-apikey': process.env.VIRUSTOTAL_API_KEY, 'Accept': 'application/json' };

  try {
    if (type === 'URL') {
      const encodedUrl = encodeURIComponent(input);
      const urlId = Buffer.from(encodedUrl).toString('base64').replace(/=/g, '');
      try {
        const vtResponse = await axios.get(`https://www.virustotal.com/api/v3/urls/${urlId}`, { headers: vtHeaders });
        vtStats = vtResponse.data.data.attributes.last_analysis_stats;
        vtFullData = vtResponse.data.data.attributes;
      } catch (getError) {
        const vtPostResponse = await axios.post('https://www.virustotal.com/api/v3/urls', `url=${encodedUrl}`, {
          headers: { ...vtHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const analysisId = vtPostResponse.data.data.id;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const analysis = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, { headers: vtHeaders });
          if (analysis.data.data.attributes.status === 'completed') {
            vtStats = analysis.data.data.attributes.stats;
            vtFullData = analysis.data.data.attributes;
            break;
          }
          if (i === 4) throw new Error('URL analysis timed out');
        }
      }
    } else if (type === 'Hash') {
      const vtResponse = await axios.get(`https://www.virustotal.com/api/v3/files/${input}`, { headers: vtHeaders });
      vtStats = vtResponse.data.data.attributes.last_analysis_stats;
      vtFullData = vtResponse.data.data.attributes;
    }

    const isSafe = vtStats.malicious === 0 && vtStats.suspicious === 0;
    const safetyScore = vtFullData.reputation !== undefined
      ? Math.round((vtFullData.reputation + 100) / 2)
      : Math.round(((vtStats.harmless + vtStats.undetected) / (vtStats.harmless + vtStats.undetected + vtStats.malicious + vtStats.suspicious)) * 100) || 0;

    const geminiData = await fetchGeminiData(type, input, vtStats, vtFullData, isDarkWeb);

    return { isSafe, safetyScore, vtStats, vtFullData, geminiInsights: geminiData, inputType: isDarkWeb ? 'darkweb' : type.toLowerCase() };
  } catch (error) {
    console.error('Scan Error:', error.message);
    throw error;
  }
}

// Existing /api/scan endpoint (unchanged)
app.get('/api/scan', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: 'Input is required' });

  let type;
  if (input.includes('://') || input.startsWith('www.')) type = 'URL';
  else if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(input)) type = 'Hash';
  else return res.status(400).json({ error: 'Invalid input type (URL or hash required)' });

  try {
    const result = await scanInput(input, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Scan failed: ${error.message}`, isSafe: true, safetyScore: 0, vtStats: {}, vtFullData: {}, geminiInsights: '' });
  }
});

// Existing /api/scan-file endpoint (unchanged)
app.post('/api/scan-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file || file.size === 0) return res.status(400).json({ error: 'Valid file is required' });

  let vtStats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
  let vtFullData = { reputation: 0, threat_names: [], categories: {} };

  try {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    const vtHeaders = {
      'x-apikey': process.env.VIRUSTOTAL_API_KEY,
      ...formData.getHeaders(),
    };
    const vtResponse = await axios.post('https://www.virustotal.com/api/v3/files', formData, { headers: vtHeaders });
    const analysisId = vtResponse.data.data.id;

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const analysis = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY } });
      if (analysis.data.data.attributes.status === 'completed') {
        vtStats = analysis.data.data.attributes.stats;
        vtFullData = analysis.data.data.attributes;
        break;
      }
      if (i === 14) return res.status(202).json({ message: 'File scan queued, analysis still in progress', analysisId });
    }

    const isSafe = vtStats.malicious === 0 && vtStats.suspicious === 0;
    const safetyScore = vtFullData.reputation !== undefined
      ? Math.round((vtFullData.reputation + 100) / 2)
      : Math.round(((vtStats.harmless + vtStats.undetected) / (vtStats.harmless + vtStats.undetected + vtStats.malicious + vtStats.suspicious)) * 100) || 0;

    const geminiData = await fetchGeminiData('File', file.originalname, vtStats, vtFullData);
    res.json({ isSafe, safetyScore, vtStats, vtFullData, geminiInsights: geminiData, inputType: 'file' });
  } catch (error) {
    res.status(500).json({ error: `File scan failed: ${error.message}` });
  }
});

// New /api/darkweb endpoint
app.get('/api/darkweb', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: 'Input is required' });

  let type;
  if (input.includes('://') || input.startsWith('www.')) type = 'URL';
  else if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(input)) type = 'Hash';
  else return res.status(400).json({ error: 'Invalid input type (URL or hash required)' });

  try {
    const result = await scanInput(input, type, true); // isDarkWeb = true
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: `Dark web scan failed: ${error.message}`, 
      isSafe: true, 
      safetyScore: 0, 
      vtStats: {}, 
      vtFullData: {}, 
      geminiInsights: '', 
      inputType: 'darkweb' 
    });
  }
});

// Existing /api/insights endpoint (unchanged)
app.get('/api/insights', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scan_insights')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch insights: ${error.message}` });
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));