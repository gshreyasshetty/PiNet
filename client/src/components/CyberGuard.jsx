import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../supabase';
import AnalysisResult from './AnalysisResult';

function CyberGuard() {
  const [inputType, setInputType] = useState('scan');
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let response;
      if (inputType === 'scan') {
        response = await axios.get('http://localhost:5000/api/scan', {
          params: { input },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        response = await axios.post('http://localhost:5000/api/scan-file', formData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
      setResult({ ...response.data, input: input || file?.name });
    } catch (err) {
      setError(err.response?.data?.error || `Failed to analyze ${inputType}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card flex flex-col gap-8 items-center w-full bg-white p-8 rounded-lg shadow-md"
    >
      <ShieldCheck size={40} className="text-[#00c4b4]" />
      <h2 className="text-3xl font-bold text-[#1f2a44]">CyberGuard Scanner</h2>
      <p className="text-center text-[#6b7280] max-w-md">Scan URLs, files, or more with advanced AI for ultimate protection.</p>
      <div className="flex space-x-4">
        <button
          onClick={() => setInputType('scan')}
          className={`btn ${inputType === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Scan Input
        </button>
        <button
          onClick={() => setInputType('file')}
          className={`btn ${inputType === 'file' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={16} className="mr-2 inline" /> Scan File
        </button>
      </div>
      <form onSubmit={handleAnalyze} className="w-full max-w-md space-y-6">
        {inputType === 'scan' ? (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL, domain, hash, or IP"
            className="input w-full p-3 border border-[#e2e8f0] rounded-md text-[#1f2a44] placeholder-[#6b7280] focus:border-[#00c4b4] focus:ring-2 focus:ring-[#00c4b4]/50"
            disabled={loading}
          />
        ) : (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="input w-full p-3 border border-[#e2e8f0] rounded-md text-[#1f2a44] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00c4b4] file:text-white hover:file:bg-[#00a89a]"
            disabled={loading}
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className={`btn btn-primary w-full ${loading ? 'bg-[#d1d5db] cursor-not-allowed' : 'bg-[#00c4b4] hover:bg-[#00a89a]'} text-white`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze'
          )}
        </button>
      </form>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-red-500 font-medium text-center"
        >
          {error}
        </motion.p>
      )}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full mt-8"
        >
          <AnalysisResult result={result} />
        </motion.div>
      )}
    </motion.section>
  );
}

export default CyberGuard;