import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { UserCog } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// import { API_URL } from '../config/api';
// const API_BASE_URL = API_URL;
const API_BASE_URL = '';

const AdminSUMM_Report = () => {
  const [reportType, setReportType] = useState('biweekly'); // default report
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setChartData([]);

    try {
      // Map each drop-down choice to an API route and a post-processor
      // Keep your existing summary route for biweekly (from your original file).
      let endpoint = '';
      let transform = (json) => ({ data: [], xKey: '', series: [] });

      switch (reportType) {
        case 'biweekly':
          endpoint = `${API_BASE_URL}/api/admin/report/summary`; // your original route
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');

            // Aggregate total loans per bi-week (all members combined), preserving your logic
            const byPeriod = {};
            json.data.biweekly.forEach((row) => {
              const key = row.biweek_label;
              if (!byPeriod[key]) byPeriod[key] = { biweek_label: key, loans_in_period: 0 };
              byPeriod[key].loans_in_period += row.loans_in_period;
            });

            return {
              data: Object.values(byPeriod),
              xKey: 'biweek_label',
              series: [{ key: 'loans_in_period', label: 'Loans' }],
            };
          };
          break;

        case 'topBorrowers':
          endpoint = `${API_BASE_URL}/api/admin/report/top-borrowers`; // e.g., SELECT member_name, total_loans
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            // Expect rows like { member_name, total_loans }
            return {
              data: json.data.rows || [],
              xKey: 'member_name',
              series: [{ key: 'total_loans', label: 'Total Loans' }],
            };
          };
          break;

        case 'finesAccrued':
          endpoint = `${API_BASE_URL}/api/admin/report/fines-accrued`; // e.g., SELECT member_name, total_fines_amount, total_fines_paid
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            // Expect rows like { member_name, total_fines_amount, total_fines_paid }
            return {
              data: json.data.rows || [],
              xKey: 'member_name',
              series: [
                { key: 'total_fines_amount', label: 'Fines Accrued' },
                { key: 'total_fines_paid', label: 'Fines Paid' },
              ],
            };
          };
          break;

        case 'restrictedMembers':
          endpoint = `${API_BASE_URL}/api/admin/report/restricted-members`; // e.g., SELECT member_name, curr_loans, max_loans
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            // Expect rows like { member_name, curr_loans, max_loans }
            return {
              data: json.data.rows || [],
              xKey: 'member_name',
              series: [
                { key: 'curr_loans', label: 'Current Loans' },
                { key: 'max_loans', label: 'Max Loans' },
              ],
            };
          };
          break;

        default:
          throw new Error('Unknown report type');
      }

      const res = await fetch(endpoint, { credentials: 'include' });
      const json = await res.json();
      const { data, xKey, series } = transform(json);

      // decorate each series with a consistent name for <Bar dataKey="...">
      setChartData({ rows: data, xKey, series });
    } catch (err) {
      console.error('Error loading admin report:', err);
      setError(err.message || 'Could not load report. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const hasData = Array.isArray(chartData?.rows) && chartData.rows.length > 0;

  return (
    <section className="py-10 px-4 w-full" id="admin-reports">
      <div className="max-w-5xl mx-auto w-full">
        {/* Consistent card/header style like InfoUpdate */}
        <Card className="bg-gradient-card border-border animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="inline-flex p-3 rounded-xl bg-primary/10">
                  <UserCog className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
                    Admin Summary Reports
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Choose a report from the drop-down and click Generate to visualize results.
                  </p>
                </div>
              </div>

              {/* Drop-down + Generate button (mirrors InfoUpdate button style) */}
              <div className="flex items-center gap-2">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Select report type"
                >
                  <option value="biweekly">Bi-weekly Loans (All Members)</option>
                  <option value="topBorrowers">Top Borrowers</option>
                  <option value="finesAccrued">Fines Accrued vs Paid</option>
                  <option value="restrictedMembers">Restricted Members</option>
                </select>

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 text-sm md:text-base"
                >
                  {loading ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            {/* Chart */}
            {hasData && (
              <div className="mt-6 h-96 bg-card rounded-xl border border-border shadow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.rows}>
                    <XAxis dataKey={chartData.xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {chartData.series.map((s) => (
                      <Bar key={s.key} dataKey={s.key} name={s.label} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminSUMM_Report;
