import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Sparkles,
  Download,
  Printer,
  BarChart3,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import RoleBadge from '../components/RoleBadge';

const leaveTypes = ['Annual', 'Sick', 'Casual', 'Maternity/Paternity', 'Unpaid'];

const LeaveManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'reports'

  // Applications state
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [filterView, setFilterView] = useState('mine'); // 'mine' or 'team'
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Apply form state
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    daysCount: 1,
    reason: '',
  });

  // Review modal state
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewComment, setReviewComment] = useState('');

  // Reports state
  const [reportData, setReportData] = useState(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportDept, setReportDept] = useState('All');
  const [reportLoading, setReportLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const canApprove =
    user?.role === 'HR Admin' ||
    user?.permissions?.canApproveLeave ||
    user?.role === 'Manager';

  // Set default view to 'team' for approvers
  useEffect(() => {
    if (canApprove) {
      setFilterView('team');
    }
  }, [canApprove]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterView === 'mine') params.append('filter', 'mine');
      if (statusFilter !== 'all') params.append('status', statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1));
      if (leaveTypeFilter !== 'All') params.append('leaveType', leaveTypeFilter);

      const res = await api.get(`/leaves?${params.toString()}`);
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!canApprove) return;
    try {
      setReportLoading(true);
      const params = new URLSearchParams();
      params.append('year', reportYear);
      if (reportDept !== 'All') params.append('department', reportDept);

      const res = await api.get(`/leaves/reports?${params.toString()}`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch leave reports:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchLeaves();
    } else {
      fetchReports();
    }
  }, [activeTab, statusFilter, filterView, leaveTypeFilter, reportYear, reportDept]);

  // Calculate days when dates change
  const handleDateChange = (start, end) => {
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setApplyForm((prev) => ({
        ...prev,
        startDate: start,
        endDate: end,
        daysCount: diffDays > 0 ? diffDays : 1,
      }));
    } else {
      setApplyForm((prev) => ({ ...prev, startDate: start, endDate: end }));
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/leaves', applyForm);
      setFeedback({ type: 'success', message: 'Leave request submitted successfully for approval!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      setShowApplyModal(false);
      setApplyForm({
        leaveType: 'Annual',
        startDate: '',
        endDate: '',
        daysCount: 1,
        reason: '',
      });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/leaves/${reviewingLeave._id}/review`, {
        status: reviewStatus,
        reviewComment,
      });
      setFeedback({
        type: 'success',
        message: `Leave application successfully ${reviewStatus.toLowerCase()}!`,
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      setReviewingLeave(null);
      setReviewComment('');
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review leave application');
    } finally {
      setSaving(false);
    }
  };

  // Export leave records to CSV
  const exportLeaveCSV = () => {
    const records = leaves;
    if (records.length === 0) return;

    const headers = ['Applicant Name', 'Employee ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Reviewed By'];
    const rows = records.map((l) => [
      `"${l.employee?.name || ''}"`,
      `"${l.employee?.employeeId || ''}"`,
      `"${l.employee?.department || ''}"`,
      `"${l.leaveType || ''}"`,
      `"${new Date(l.startDate).toLocaleDateString()}"`,
      `"${new Date(l.endDate).toLocaleDateString()}"`,
      `"${l.daysCount || 0}"`,
      `"${l.status || ''}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.reviewedBy?.name || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leave_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Leave Management System
            </h1>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
              Module 1.3
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Automated leave application, balance tracking, manager approvals, and organization-wide leave reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportLeaveCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Available Leave Balances Cards (Personal) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Annual Leave Balance</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
              {user?.leaveBalance?.annual ?? 14} <span className="text-xs text-slate-400 font-normal">days</span>
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">Vacation & personal time off</span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🌴
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Sick Leave Balance</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
              {user?.leaveBalance?.sick ?? 10} <span className="text-xs text-slate-400 font-normal">days</span>
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">Medical & health recovery</span>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🩺
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Casual Leave Balance</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
              {user?.leaveBalance?.casual ?? 8} <span className="text-xs text-slate-400 font-normal">days</span>
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">Short personal engagements</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
            ☕
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Leave Applications & Approval Queue
        </button>

        {canApprove && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Workforce Leave Reports & Balance Analytics
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LEAVE APPLICATIONS & APPROVAL QUEUE                                */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {canApprove && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterView('team')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterView === 'team'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Approval Queue ({user?.role === 'HR Admin' ? 'All Organization' : 'My Team'})
                </button>
                <button
                  onClick={() => setFilterView('mine')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterView === 'mine'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  My Leave Requests
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Tabs */}
              <div className="flex items-center gap-1">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                      statusFilter === tab
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Leave Type Filter */}
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="All">All Types</option>
                {leaveTypes.map((t) => (
                  <option key={t} value={t}>
                    {t} Leave
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading leave applications...</div>
            ) : leaves.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No leave records found under this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Time Period</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Decision & Remarks</th>
                      {canApprove && filterView === 'team' && (
                        <th className="py-3 px-4 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {leave.employee?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{leave.employee?.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {leave.employee?.designation} • {leave.employee?.department}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">{leave.employee?.employeeId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {leave.leaveType}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(leave.startDate).toLocaleDateString()} -{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {leave.daysCount} d
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <StatusBadge status={leave.status} />
                            {leave.reviewedBy && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Reviewed by {leave.reviewedBy.name}
                                {leave.reviewComment && ` • "${leave.reviewComment}"`}
                              </p>
                            )}
                          </div>
                        </td>

                        {canApprove && filterView === 'team' && (
                          <td className="py-3.5 px-4 text-right">
                            {leave.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setReviewingLeave(leave);
                                    setReviewStatus('Approved');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1 transition"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingLeave(leave);
                                    setReviewStatus('Rejected');
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-1 transition"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Processed</span>
                            )}
                          </td>
                        )}
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
      {/* TAB 2: LEAVE REPORTS & BALANCE ANALYTICS (HR & MANAGERS)                  */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && canApprove && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Reporting Year:</span>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            {user?.role === 'HR Admin' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Department:</span>
                <select
                  value={reportDept}
                  onChange={(e) => setReportDept(e.target.value)}
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
              </div>
            )}
          </div>

          {reportLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Compiling leave analytics & reports...</div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Analytics KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leave Requests</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{reportData.summary?.totalRequests || 0}</h3>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">
                    Approval rate: {reportData.summary?.approvalRate || 0}%
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Requests</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{reportData.summary?.approvedCount || 0}</h3>
                  <span className="text-xs text-emerald-600 font-medium mt-1 block">
                    {reportData.summary?.totalDaysApproved || 0} days granted
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">{reportData.summary?.pendingCount || 0}</h3>
                  <span className="text-xs text-amber-600 font-medium mt-1 block">
                    Awaiting manager review
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected Requests</p>
                  <h3 className="text-2xl font-bold text-rose-600 mt-1">{reportData.summary?.rejectedCount || 0}</h3>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">
                    Turned down with comments
                  </span>
                </div>
              </div>

              {/* Leave Type Breakdown & Department Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave Types Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Usage by Leave Classification</span>
                    <Layers className="w-4 h-4 text-slate-400" />
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(reportData.typeBreakdown || {}).map(([type, stats]) => (
                      <div key={type} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{type} Leave</p>
                          <p className="text-[11px] text-slate-400">{stats.count} applications submitted</p>
                        </div>
                        <span className="font-bold text-xs text-sky-700 bg-sky-50 px-2 py-1 rounded-lg">
                          {stats.days} days approved
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workforce Remaining Balance Audit Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Employee Remaining Balances</span>
                    <User className="w-4 h-4 text-slate-400" />
                  </h3>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {reportData.workforceBalances?.map((item) => (
                      <div key={item._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.department} • {item.designation}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-700 block">
                            Annual: {item.leaveBalance?.annual ?? 14}d | Sick: {item.leaveBalance?.sick ?? 10}d
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Casual: {item.leaveBalance?.casual ?? 8}d ({item.totalApprovedDays}d used)
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

      {/* ========================================================================= */}
      {/* APPLY FOR LEAVE MODAL                                                     */}
      {/* ========================================================================= */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Online Leave Application</h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Select Leave Type
                </label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {leaveTypes.map((t) => (
                    <option key={t} value={t}>
                      {t} Leave
                    </option>
                  ))}
                </select>
              </div>

              {/* Available balance indicator for selected type */}
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <span className="text-sky-800 font-medium">Available {applyForm.leaveType} balance:</span>
                <span className="font-bold text-sky-900 font-mono">
                  {user?.leaveBalance?.[applyForm.leaveType.toLowerCase()] ?? 'Unlimited'} days
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => handleDateChange(e.target.value, applyForm.endDate)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => handleDateChange(applyForm.startDate, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-500">
                  Calculated Duration:{' '}
                  <span className="font-bold text-sky-700">{applyForm.daysCount} working days</span>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain the reason for taking time off..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW LEAVE MODAL                                                        */}
      {/* ========================================================================= */}
      {reviewingLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Review {reviewingLeave.leaveType} Leave for {reviewingLeave.employee?.name}
              </h3>
              <button
                onClick={() => setReviewingLeave(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p>
                  <span className="font-semibold text-slate-500">Duration:</span>{' '}
                  {new Date(reviewingLeave.startDate).toLocaleDateString()} to{' '}
                  {new Date(reviewingLeave.endDate).toLocaleDateString()} ({reviewingLeave.daysCount} days)
                </p>
                <p>
                  <span className="font-semibold text-slate-500">Applicant Reason:</span> "{reviewingLeave.reason}"
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Approved')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      reviewStatus === 'Approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Rejected')}
                    className={`py-2 px-3 rounded-xl font-bold border transition ${
                      reviewStatus === 'Rejected'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Reject Request
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Manager Review Note / Comments
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Approved, please hand over pending tickets before departure..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingLeave(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2 text-white rounded-xl font-bold transition shadow-md disabled:opacity-50 ${
                    reviewStatus === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {saving ? 'Saving...' : `Confirm ${reviewStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
