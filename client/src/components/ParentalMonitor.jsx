import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, BarChart2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function ParentalMonitor() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [safetyFilter, setSafetyFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/insights');
        setHistory(response.data);
        setFilteredHistory(response.data);
      } catch (err) {
        setError('Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...history];
      if (typeFilter !== 'all') {
        filtered = filtered.filter(item => item.type && item.type.toLowerCase() === typeFilter);
      }
      if (safetyFilter !== 'all') {
        filtered = filtered.filter(item => safetyFilter === 'safe' ? item.is_safe : !item.is_safe);
      }
      setFilteredHistory(filtered);
    };
    applyFilters();
  }, [typeFilter, safetyFilter, history]);

  const exportToCSV = () => {
    const csvRows = [
      ['Type', 'Safety', 'Safety Score', 'Date'],
      ...filteredHistory.map(item => [
        item.type || 'Unknown',
        item.is_safe ? 'Safe' : 'At Risk',
        item.safety_score || 'N/A',
        new Date(item.created_at).toLocaleString() || 'N/A',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parental_monitor_history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalScans = filteredHistory.length;
  const safeScans = filteredHistory.filter(item => item.is_safe).length;
  const unsafeScans = totalScans - safeScans;
  const riskRate = totalScans > 0 ? Math.round((unsafeScans / totalScans) * 100) : 0;

  const typeSafetyData = filteredHistory.reduce((acc, item) => {
    const type = item.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { safe: 0, atRisk: 0 };
    }
    if (item.is_safe) {
      acc[type].safe += 1;
    } else {
      acc[type].atRisk += 1;
    }
    return acc;
  }, {});

  const barData = {
    labels: Object.keys(typeSafetyData),
    datasets: [
      {
        label: 'Safe',
        data: Object.values(typeSafetyData).map(data => data.safe),
        backgroundColor: '#00c4b4',
        borderColor: '#00c4b4',
        borderWidth: 1,
      },
      {
        label: 'At Risk',
        data: Object.values(typeSafetyData).map(data => data.atRisk),
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Activity Type' } },
      y: { title: { display: true, text: 'Count' }, beginAtZero: true },
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-[#e2e8f0]"
    >
      <div className="bg-gradient-to-r from-[#00c4b4] to-[#00a89a] p-4 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Lock size={28} className="text-white" />
          <h2 className="text-xl font-bold text-white">Parental Monitor</h2>
        </div>
        <p className="text-xs text-white/80 mt-1">Track your child's online safety.</p>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <p className="text-center text-[#6b7280] animate-pulse">Loading activity...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : totalScans === 0 ? (
          <p className="text-center text-[#6b7280]">No activity recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-[#f5f7fa] rounded-md border border-[#e2e8f0]"
            >
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-2 flex items-center">
                <ShieldAlert size={20} className="mr-2 text-[#00c4b4]" /> Safety Overview
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-[#6b7280]">Total Activity</p>
                  <p className="text-lg font-bold text-[#1f2a44]">{totalScans}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7280]">Safe</p>
                  <p className="text-lg font-bold text-[#00c4b4]">{safeScans}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7280]">At Risk</p>
                  <p className="text-lg font-bold text-[#ef4444]">{unsafeScans} ({riskRate}%)</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-[#f5f7fa] rounded-md border border-[#e2e8f0]"
            >
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Filters</h3>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="p-2 text-sm border border-[#e2e8f0] rounded-md bg-white text-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#00c4b4] hover:bg-[#f5f7fa] transition-colors w-full sm:w-auto"
                >
                  <option value="all">All Types</option>
                  <option value="url">URL</option>
                  <option value="hash">Hash</option>
                  <option value="domain">Domain</option>
                  <option value="ip address">IP Address</option>
                </select>
                <select
                  value={safetyFilter}
                  onChange={(e) => setSafetyFilter(e.target.value)}
                  className="p-2 text-sm border border-[#e2e8f0] rounded-md bg-white text-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#00c4b4] hover:bg-[#f5f7fa] transition-colors w-full sm:w-auto"
                >
                  <option value="all">All Safety</option>
                  <option value="safe">Safe</option>
                  <option value="unsafe">At Risk</option>
                </select>
                <button
                  onClick={exportToCSV}
                  className="btn btn-primary bg-[#00c4b4] hover:bg-[#00a89a] text-white transition-colors w-full sm:w-auto"
                >
                  Export CSV
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-[#f5f7fa] rounded-md border border-[#e2e8f0]"
            >
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-2 flex items-center">
                <BarChart2 size={20} className="mr-2 text-[#00c4b4]" /> Type Distribution
              </h3>
              <div className="h-48">
                <Bar data={barData} options={barOptions} />
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-[#f5f7fa] rounded-md border border-[#e2e8f0]"
            >
              <h3 className="text-lg font-semibold text-[#1f2a44] mb-2">Recent Activity</h3>
              <div className="max-h-48 overflow-y-auto">
                {filteredHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 bg-white rounded-md border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${item.is_safe ? 'bg-[#00c4b4]' : 'bg-[#ef4444]'}`}
                          />
                          <div>
                            <p className="text-sm font-medium text-[#1f2a44]">{item.type || 'Unknown'}</p>
                            <p className="text-xs text-[#6b7280]">
                              {item.is_safe ? 'Safe' : 'At Risk'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#1f2a44]">
                            {item.safety_score || 'N/A'}
                          </p>
                          <p className="text-xs text-[#6b7280]">
                            {new Date(item.created_at).toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6b7280] text-center">No matching activity found.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default ParentalMonitor;