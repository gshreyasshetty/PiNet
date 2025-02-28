import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function AnalysisResult({ result }) {
  const insightsText = result.geminiInsights || '';

  // Robust parsing aligned with VirusTotal and Gemini
  const sections = {
    title: result.input || 'Unknown Input',
    threats: insightsText.match(/Threats & Vulnerabilities:\*\*([\s\S]*?)(?=\*\*|$)/i)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*|-|\s*\*/g, '').trim()).filter(line => line.length > 0) || ['No specific threats detected'],
    reputation: insightsText.match(/Reputation:\*\*([\s\S]*?)(?=\*\*|$)/i)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*|-|\s*\*/g, '').trim()).filter(line => line.length > 0) || ['No data available'],
    context: insightsText.match(/Context:\*\*([\s\S]*?)(?=\*\*|$)/i)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*|-|\s*\*/g, '').trim()).filter(line => line.length > 0) || ['No data available'],
    safetyTips: insightsText.match(/Safety Tips:\*\*([\s\S]*?)(?=\*\*|$)/i)?.[1]?.trim().split('\n').map(line => line.replace(/^\d+\.\s*|\*\s*|-|\s*\*/g, '').trim()).filter(line => line.length > 0) || ['No specific tips available'],
    pieChart: insightsText.match(/```json\s*([\s\S]*?)\s*```/) ? JSON.parse(insightsText.match(/```json\s*([\s\S]*?)\s*```/)[1].replace(/\s/g, '')) : {
      Safe: Math.round(((result.vtStats?.harmless || 0) + (result.vtStats?.undetected || 0)) / ((result.vtStats?.harmless || 0) + (result.vtStats?.undetected || 0) + (result.vtStats?.malicious || 0) + (result.vtStats?.suspicious || 0) + (result.vtStats?.timeout || 0)) * 100),
      Malicious: result.vtStats?.malicious || 0,
      Suspicious: result.vtStats?.suspicious || 0
    },
  };

  const total = ((result.vtStats?.harmless || 0) + (result.vtStats?.undetected || 0) + (result.vtStats?.malicious || 0) + (result.vtStats?.suspicious || 0) + (result.vtStats?.timeout || 0)) || 1;
  const chartData = {
    labels: ['Safe', 'Malicious', 'Suspicious'],
    datasets: [{
      data: [sections.pieChart.Safe, sections.pieChart.Malicious, sections.pieChart.Suspicious],
      backgroundColor: ['#00c4b4', '#ef4444', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  const getStatus = (score) => {
    if (score >= 75) return 'Safe';
    if (score >= 50) return 'Caution';
    return 'Unsafe';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 w-full"
    >
      <div className="card bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-[#1f2a44] mb-4">Analysis Result for: {sections.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-[#f5f7fa] rounded-md border-l-4 border-[#00c4b4]">
            <p className="text-lg">
              <strong className="text-[#1f2a44]">Status:</strong>{' '}
              <span className={result.safetyScore >= 75 ? 'text-[#00c4b4]' : result.safetyScore >= 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>
                {getStatus(result.safetyScore)}
              </span>
            </p>
            <p className="mt-2 text-lg">
              <strong className="text-[#1f2a44]">Safety Score:</strong>{' '}
              <span className="text-[#00c4b4]">{result.safetyScore}/100</span>
            </p>
            {result.vtStats && (
              <p className="text-sm text-[#6b7280] mt-2">
                <strong>VirusTotal Stats:</strong> Malicious: {result.vtStats.malicious || 0} | Suspicious: {result.vtStats.suspicious || 0} | Harmless: {result.vtStats.harmless || 0} | Undetected: {result.vtStats.undetected || 0}
              </p>
            )}
            {result.vtFullData?.threat_names?.length > 0 && (
              <p className="mt-2 text-sm text-[#6b7280]">
                <strong>Known Threats:</strong> {result.vtFullData.threat_names.join(', ')}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center">
            <div style={{ width: '200px', height: '200px' }}>
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { font: { size: 12 }, color: '#1f2a44', padding: 10 } },
                    tooltip: {
                      backgroundColor: '#e5e7eb',
                      titleFont: { size: 12 },
                      bodyFont: { size: 10 },
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          return `${label}: ${value}%`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Threats & Vulnerabilities</h3>
            <ul className="list-disc pl-5 text-sm text-[#6b7280] space-y-1">
              {sections.threats.map((threat, idx) => <li key={idx}>{threat}</li>)}
            </ul>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Reputation</h3>
            <ul className="list-disc pl-5 text-sm text-[#6b7280] space-y-1">
              {sections.reputation.map((rep, idx) => <li key={idx}>{rep}</li>)}
            </ul>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Context</h3>
            <ul className="list-disc pl-5 text-sm text-[#6b7280] space-y-1">
              {sections.context.map((ctx, idx) => <li key={idx}>{ctx}</li>)}
            </ul>
          </div>
          <div className="p-4 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Safety Tips</h3>
            <ul className="list-disc pl-5 text-sm text-[#6b7280] space-y-1">
              {sections.safetyTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          </div>
          <div className="col-span-2 p-4 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Risk Distribution</h3>
            <p className="text-sm text-[#6b7280]">
              Safe: {sections.pieChart.Safe}% | Malicious: {sections.pieChart.Malicious}% | Suspicious: {sections.pieChart.Suspicious}%
            </p>
            <p className="text-sm text-[#6b7280] mt-1">
              <strong>Explanation:</strong> Percentages are derived directly from VirusTotal scan results. "Safe" reflects harmless and undetected engines, while "Malicious" and "Suspicious" match detected threats. Additional risks noted in the analysis are contextual and not reflected in these scores.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AnalysisResult;