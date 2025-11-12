import { useState } from 'react';

const AdminSUMM_Report = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-report/summary', {
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

      setReportData(Object.values(byPeriod));
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

      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Loan Activity by Bi-Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Bi-Week Period</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Loans</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{row.biweek_label}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{row.loans_in_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Summary Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.reduce((sum, row) => sum + row.loans_in_period, 0)}
                </div>
                <div className="text-sm text-blue-800">Total Loans</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.length}
                </div>
                <div className="text-sm text-green-800">Periods</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...reportData.map(row => row.loans_in_period))}
                </div>
                <div className="text-sm text-purple-800">Peak Period</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(reportData.reduce((sum, row) => sum + row.loans_in_period, 0) / reportData.length).toFixed(1)}
                </div>
                <div className="text-sm text-orange-800">Average</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportData.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Click "Generate Report" to load bi-weekly loan data.</p>
        </div>
      )}
    </div>
  );
};

export default AdminSUMM_Report;
