import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  Calendar,
  Filter,
  User,
  Building2,
  Sparkles,
  Download,
  Printer,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  FileSpreadsheet,
  Check,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Attendance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timesheets'); // 'timesheets' or 'reports'

  // Timesheets state
  const [logs, setLogs] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [filterView, setFilterView] = useState('mine'); // 'mine' or 'team'
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Month & Year Filter for Timesheets
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Reports state
  const [reportData, setReportData] = useState(null);
  const [reportTimeframe, setReportTimeframe] = useState('month'); // 'today', 'week', 'month'
  const [reportDept, setReportDept] = useState('All');
  const [reportLoading, setReportLoading] = useState(false);

  const canAudit =
    user?.role === 'HR Admin' ||
    user?.permissions?.canViewAllAttendance ||
    user?.role === 'Manager';

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (canAudit) {
      setFilterView('team');
    }
  }, [canAudit]);

  // Fetch timesheets
  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterView === 'mine') params.append('filter', 'mine');
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);

      const [todayRes, logsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/logs?${params.toString()}`),
      ]);

      if (todayRes.data.success) {
        setTodayStatus(todayRes.data);
      }
      if (logsRes.data.success) {
        setLogs(logsRes.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports
  const fetchReports = async () => {
    if (!canAudit) return;
    try {
      setReportLoading(true);
      const params = new URLSearchParams();
      params.append('timeframe', reportTimeframe);
      if (reportDept !== 'All') params.append('department', reportDept);

      const res = await api.get(`/attendance/reports?${params.toString()}`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance reports:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'timesheets') {
      fetchTimesheets();
    } else {
      fetchReports();
    }
  }, [activeTab, filterView, selectedDept, selectedStatus, selectedMonth, selectedYear, reportTimeframe, reportDept]);

  const handleClockAction = async (type) => {
    try {
      setActionLoading(true);
      const endpoint = type === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint);
      setFeedback({ type: 'success', message: res.data.message });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      fetchTimesheets();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Attendance action failed',
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Export attendance records to CSV
  const exportAttendanceCSV = () => {
    const records = activeTab === 'reports' ? (reportData?.logs || []) : logs;
    if (records.length === 0) return;

    const headers = ['Employee ID', 'Employee Name', 'Department', 'Date', 'Check-In', 'Check-Out', 'Work Hours', 'Status'];
    const rows = records.map((l) => [
      `"${l.employee?.employeeId || ''}"`,
      `"${l.employee?.name || ''}"`,
      `"${l.employee?.department || ''}"`,
      `"${new Date(l.date).toLocaleDateString()}"`,
      `"${l.checkIn ? new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}"`,
      `"${l.checkOut ? new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}"`,
      `"${l.workHours || 0}"`,
      `"${l.status || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Attendance Management System
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              Module 1.2
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Digital check-in/out tracking, daily & monthly history logs, and organizational attendance patterns & reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportAttendanceCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canAudit && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Report</span>
            </button>
          )}
        </div>
      </div>

      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Real-time Clocking Station (Always accessible to employees & managers) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
            Digital Attendance Station
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Current status display */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs space-y-1">
            <p className="text-slate-300">
              Check-In:{' '}
              <span className="font-bold text-white">
                {todayStatus?.record?.checkIn
                  ? new Date(todayStatus.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Not logged yet'}
              </span>
            </p>
            <p className="text-slate-300">
              Check-Out:{' '}
              <span className="font-bold text-white">
                {todayStatus?.record?.checkOut
                  ? new Date(todayStatus.record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'In Progress'}
              </span>
            </p>
            {todayStatus?.record?.workHours > 0 && (
              <p className="text-emerald-300 font-bold">
                Hours Recorded: {todayStatus.record.workHours} hrs
              </p>
            )}
          </div>

          <div>
            {!todayStatus?.hasCheckedIn ? (
              <button
                onClick={() => handleClockAction('check-in')}
                disabled={actionLoading}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Clock In Now</span>
              </button>
            ) : !todayStatus?.hasCheckedOut ? (
              <button
                onClick={() => handleClockAction('check-out')}
                disabled={actionLoading}
                className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                <span>Clock Out</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold text-center">
                ✓ Today's Shift Recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs: Timesheet History vs Attendance Reports */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'timesheets'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Daily & Monthly Timesheet Records
        </button>

        {canAudit && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Attendance Summaries & Workforce Reports
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY & MONTHLY TIMESHEET LOGS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'timesheets' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Scope Toggle */}
            <div className="flex items-center gap-2">
              {canAudit ? (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterView('team')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterView === 'team'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {user?.role === 'HR Admin' ? 'All Organization' : 'My Team'} Records
                  </button>
                  <button
                    onClick={() => setFilterView('mine')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterView === 'mine'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    My Personal Timesheet
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-700">My Attendance History</span>
              )}
            </div>

            {/* Month, Year, Department & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late Arrivals</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>

              {/* Department Filter (HR Admin) */}
              {canAudit && filterView === 'team' && user?.role === 'HR Admin' && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                </select>
              )}
            </div>
          </div>

          {/* Timesheet Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading timesheet records...</div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No attendance logs found for {months[selectedMonth - 1]} {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Check-Out Time</th>
                      <th className="py-3 px-4">Logged Work Hours</th>
                      <th className="py-3 px-4">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {log.employee?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{log.employee?.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {log.employee?.department} • {log.employee?.designation}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">{log.employee?.employeeId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {new Date(log.date).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {log.checkIn
                            ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {log.checkOut
                            ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'In progress'}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-800">
                          {log.workHours ? `${log.workHours} hrs` : '-'}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={log.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE SUMMARIES & REPORTS FOR HR & MANAGERS                   */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && canAudit && (
        <div className="space-y-6">
          {/* Report Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Reporting Timeframe:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setReportTimeframe(tf.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      reportTimeframe === tf.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {user?.role === 'HR Admin' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Department:</span>
                <select
                  value={reportDept}
                  onChange={(e) => setReportDept(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="All">All Organization</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            )}
          </div>

          {reportLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Computing workforce attendance analytics...</div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Analytics KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Shifts Logged</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{reportData.summary?.totalRecords || 0}</h3>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">
                    {reportData.summary?.totalTrackedEmployees || 0} employees monitored
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Punctuality Rate</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{reportData.summary?.punctualityRate || 0}%</h3>
                  <span className="text-xs text-emerald-600 font-medium mt-1 block">
                    {reportData.summary?.presentCount || 0} on-time check-ins
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">{reportData.summary?.lateCount || 0}</h3>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">
                    Logged after standard start time
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Hours Logged</p>
                  <h3 className="text-2xl font-bold text-sky-600 mt-1">{reportData.summary?.totalHoursLogged || 0}h</h3>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">
                    Avg {reportData.summary?.avgHoursPerShift || 0} hrs/shift
                  </span>
                </div>
              </div>

              {/* Department Breakdown & Attendance Patterns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Department Attendance Comparison</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </h3>

                  {reportData.departmentStats?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No shift logs found in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {reportData.departmentStats?.map((dept) => (
                        <div key={dept.department} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-800">{dept.department}</span>
                            <span className="font-bold text-xs text-emerald-600">{dept.rate}% On-Time</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full"
                              style={{ width: `${dept.rate}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{dept.total} total shifts</span>
                            <span>{dept.late} late</span>
                            <span>{dept.hours} total hrs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Individual Employee Attendance Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Workforce Timesheet Summaries</span>
                    <User className="w-4 h-4 text-slate-400" />
                  </h3>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {reportData.employeeSummaries?.map((item) => (
                      <div key={item.employee?._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{item.employee?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.employee?.department} • {item.employee?.designation}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-800 block">{item.hours} hrs</span>
                          <span className="text-[10px] text-slate-500">
                            {item.shifts} shifts ({item.late} late)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Attendance;
