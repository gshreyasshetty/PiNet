import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function AnalysisResult({ result }) {
  const insightsText = result.geminiInsights || '';
  const sections = {
    title: insightsText.match(/^\*\*Cybersecurity Report for (.+?)\*\*/)?.[1] || 'Unknown Input',
    threats: insightsText.match(/\*\*Threats & Vulnerabilities:\*\*([\s\S]*?)(?=\*\*|$)/)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*/g, '').replace(/^\s*-/, '').trim()).filter(line => line.length > 0) || ['No specific threats detected'],
    reputation: insightsText.match(/\*\*Reputation:\*\*([\s\S]*?)(?=\*\*|$)/)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*/g, '').replace(/^\s*-/, '').trim()).filter(line => line.length > 0) || ['No data available'],
    context: insightsText.match(/\*\*Context:\*\*([\s\S]*?)(?=\*\*|$)/)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*/g, '').replace(/^\s*-/, '').trim()).filter(line => line.length > 0) || ['No data available'],
    safetyTips: insightsText.match(/\*\*Safety Tips:\*\*([\s\S]*?)(?=\*\*|$)/)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*/g, '').replace(/^\s*-/, '').trim()).filter(line => line.length > 0) || ['No specific tips available'],
    darkWeb: insightsText.match(/\*\*Dark Web Detection:\*\*([\s\S]*?)(?=\*\*|$)/)?.[1]?.trim().split('\n').map(line => line.replace(/^\*\s*/g, '').replace(/^\s*-/, '').trim()).filter(line => line.length > 0) || ['No dark web activity detected'],
    pieChart: insightsText.match(/```json\n([\s\S]*?)\n```/) ? JSON.parse(insightsText.match(/```json\n([\s\S]*?)\n```/)[1]) : { Safe: result.isSafe ? 100 : 0, Malicious: result.vtStats?.malicious || 0, Suspicious: result.vtStats?.suspicious || 0 },
  };

  const total = Object.values(sections.pieChart).reduce((sum, val) => sum + val, 0) || 1;
  const chartData = {
    labels: Object.keys(sections.pieChart),
    datasets: [{
      data: Object.values(sections.pieChart),
      backgroundColor: ['#00c4b4', '#ef4444', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 w-full"
    >
      <div className="card bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-[#1f2a44]">{sections.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="highlight-box p-6 border-l-4 border-[#00c4b4] bg-[#f5f7fa] rounded-md">
            <p>
              <strong className="text-[#1f2a44]">Status:</strong>{' '}
              <span className={result.isSafe ? 'text-[#00c4b4]' : 'text-[#ef4444]'}>
                {result.isSafe ? 'Safe' : 'Unsafe'}
              </span>
            </p>
            <p className="mt-2">
              <strong className="text-[#1f2a44]">Safety Score:</strong>{' '}
              <span className="text-[#00c4b4]">{result.safetyScore}/100</span>
            </p>
            {result.vtStats && (
              <p className="text-sm text-[#6b7280] mt-2">
                Malicious: {result.vtStats.malicious || 0} | Suspicious: {result.vtStats.suspicious || 0} | Harmless: {result.vtStats.harmless || 0} | Undetected: {result.vtStats.undetected || 0}
              </p>
            )}
            {result.vtFullData?.threat_names?.length > 0 && (
              <p className="mt-2 text-sm">
                <strong className="text-[#1f2a44]">Threats:</strong> {result.vtFullData.threat_names.join(', ')}
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
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="output-box p-6 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Threats & Vulnerabilities</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-[#6b7280]">
              {sections.threats.map((threat, idx) => <li key={idx}>{threat}</li>)}
            </ul>
          </div>
          <div className="output-box p-6 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Reputation</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-[#6b7280]">
              {sections.reputation.map((rep, idx) => <li key={idx}>{rep}</li>)}
            </ul>
          </div>
          <div className="output-box p-6 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Context</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-[#6b7280]">
              {sections.context.map((ctx, idx) => <li key={idx}>{ctx}</li>)}
            </ul>
          </div>
          <div className="output-box p-6 bg-[#f5f7fa] rounded-md">
            <h3 className="text-lg font-semibold text-[#1f2a44]">Safety Tips</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-[#6b7280]">
              {sections.safetyTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          </div>
          {result.inputType === 'darkweb' && (
            <div className="output-box p-6 bg-[#f5f7fa] rounded-md">
              <h3 className="text-lg font-semibold text-[#1f2a44]">Dark Web Detection</h3>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-[#6b7280]">
                {sections.darkWeb.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AnalysisResult;