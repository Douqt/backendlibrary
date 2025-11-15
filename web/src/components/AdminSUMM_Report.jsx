import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from './ui/card';
import { UserCog } from 'lucide-react';

import { API_BASE_URL } from '../config';

// Blue, orange, yellow
const COLORS = ['#1d4ed8', '#f97316', '#facc15'];

const AdminSUMM_Report = () => {
  const [reportType, setReportType] = useState('overdueLoans'); // default report
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
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
        case 'overdueLoans':
          endpoint = `${API_BASE_URL}/admin/report/overdue-loans`;
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            return {
              data: json.data || [],
              tableData: json.data || [],
              xKey: 'member_name',
              series: [
                { key: 'days_overdue', label: 'Days Overdue' },
                { key: 'fine_amount', label: 'Fine Amount ($)' }
              ],
            };
          };
          break;

        case 'mostBorrowed':
          endpoint = `${API_BASE_URL}/admin/report/most-borrowed`;
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            return {
              data: json.data || [],
              tableData: json.data || [],
              xKey: 'item_title',
              series: [
                { key: 'times_borrowed', label: 'Times Borrowed' },
                { key: 'unique_borrowers', label: 'Unique Borrowers' }
              ],
            };
          };
          break;

        case 'memberActivity':
          endpoint = `${API_BASE_URL}/admin/report/member-activity`;
          transform = (json) => {
            if (!json?.success) throw new Error(json?.message || 'Failed to load report');
            return {
              data: json.data || [],
              tableData: json.data || [],
              xKey: 'member_name',
              series: [
                { key: 'total_loans', label: 'Total Loans' },
                { key: 'active_loans', label: 'Active Loans' },
                { key: 'total_fines_owed', label: 'Fines Owed ($)' }
              ],
            };
          };
          break;

        default:
          throw new Error('Unknown report type');
      }

      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const res = await fetch(endpoint, { headers });
      const json = await res.json();
      const { data, xKey, series, tableData: rawTableData } = transform(json);

      // decorate each series with a consistent name for <Bar dataKey="...">
      setChartData({ rows: data, xKey, series });
      setTableData(rawTableData || data);
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
                  className="px-3 py-2 rounded-xl border border-input bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Select report type"
                >
                  <option value="overdueLoans">Overdue Loans with Member Info & Fines</option>
                  <option value="mostBorrowed">Most Borrowed Items by Type</option>
                  <option value="memberActivity">Member Loan & Fine Summary</option>
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
                    {chartData.series.map((s, i) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        fill={COLORS[i % COLORS.length]}
                        radius={[6, 6, 0, 0]}   // rounded top corners
                        barSize={24}            // bar thickness
                      />
                     ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Data Table */}
            {tableData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Detailed Data</h3>
                <div className="bg-card rounded-xl border border-border shadow overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {Object.keys(tableData[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-3 text-left font-medium text-muted-foreground border-b border-border">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => (
                        <tr key={index} className="border-b border-border hover:bg-muted/25">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 text-foreground">
                              {value === null || value === undefined ? '-' : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminSUMM_Report;
