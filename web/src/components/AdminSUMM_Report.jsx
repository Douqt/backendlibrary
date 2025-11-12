import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AdminSUMM_Report = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/report/summary', {
        credentials: 'include', // or Authorization header
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load report');

      // Aggregate total loans per bi-week (all members combined)
      const byPeriod = {};
      json.data.biweekly.forEach((row) => {
        const key = row.biweek_label;
        if (!byPeriod[key]) {
          byPeriod[key] = {
            biweek_label: key,
            loans_in_period: 0,
          };
        }
        byPeriod[key].loans_in_period += row.loans_in_period;
      });

      setChartData(Object.values(byPeriod));
    } catch (err) {
      console.error('Error loading admin report:', err);
      alert('Could not load report, check console/logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Bi-weekly Loan Report</h2>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="h-80 bg-white rounded-xl shadow p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="biweek_label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="loans_in_period" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AdminSUMM_Report;
