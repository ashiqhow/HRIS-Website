import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  Printer,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  FileText,
  Building2,
  User,
  Plus,
  X,
  Edit,
  Eye,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Payroll = () => {
  const { user } = useAuth();
  const isHRAdmin = user?.role === 'HR Admin' || user?.permissions?.canManageUsers;

  const [activeTab, setActiveTab] = useState(isHRAdmin ? 'workforce' : 'my-payslips');

  // Workforce Payroll state (HR Admin)
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');

  // My Payslips state (Employee)
  const [myPayslips, setMyPayslips] = useState([]);

  // Generate Payroll Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    defaultBonusPercent: 0,
    defaultDeductionPercent: 5,
  });

  // View Payslip Modal state
  const [viewingPayslip, setViewingPayslip] = useState(null);

  // Edit / Adjust record state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    allowances: 0,
    bonuses: 0,
    deductions: 0,
    paymentStatus: 'Processed',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch workforce payroll (HR Admin)
  const fetchWorkforcePayroll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedStatus !== 'All') params.append('paymentStatus', selectedStatus);
      if (search) params.append('search', search);

      const res = await api.get(`/payroll?${params.toString()}`);
      if (res.data.success) {
        setPayrollRecords(res.data.records);
        setPayrollSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch workforce payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch my payslips (Employee)
  const fetchMyPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/my-payslips');
      if (res.data.success) {
        setMyPayslips(res.data.payslips);
      }
    } catch (err) {
      console.error('Failed to fetch my payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workforce' && isHRAdmin) {
      fetchWorkforcePayroll();
    } else {
      fetchMyPayslips();
    }
  }, [activeTab, selectedMonth, selectedYear, selectedDept, selectedStatus, search]);

  // Run Monthly Payroll
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/payroll/generate', generateForm);
      setFeedback({ type: 'success', text: res.data.message });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
      setShowGenerateModal(false);
      fetchWorkforcePayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setSaving(false);
    }
  };

  // Adjust Payroll Record
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/payroll/${editingRecord._id}`, editForm);
      setFeedback({ type: 'success', text: 'Payroll record updated and recalculated!' });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
      setEditingRecord(null);
      fetchWorkforcePayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportPayrollCSV = () => {
    const records = activeTab === 'workforce' ? payrollRecords : myPayslips;
    if (records.length === 0) return;

    const headers = ['Payslip ID', 'Employee Name', 'Employee ID', 'Department', 'Month/Year', 'Basic Salary', 'Allowances', 'Bonuses', 'Deductions', 'Net Salary', 'Currency', 'Status'];
    const rows = records.map((r) => [
      `"${r.payslipId || ''}"`,
      `"${r.employee?.name || ''}"`,
      `"${r.employee?.employeeId || ''}"`,
      `"${r.employee?.department || ''}"`,
      `"${months[r.month - 1]} ${r.year}"`,
      `"${r.basicSalary}"`,
      `"${r.allowances}"`,
      `"${r.bonuses}"`,
      `"${r.deductions}"`,
      `"${r.netSalary}"`,
      `"${r.currency}"`,
      `"${r.paymentStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.csv`);
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
              Payroll Management System
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              Module 2.2
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Automated net salary calculations: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-700 font-semibold">Net = Basic + Allowances + Bonuses − Deductions</code>, salary history, and digital payslips.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportPayrollCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isHRAdmin && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Generate Monthly Payroll</span>
            </button>
          )}
        </div>
      </div>

      {feedback.text && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {isHRAdmin && (
          <button
            onClick={() => setActiveTab('workforce')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'workforce'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Workforce Payroll Records & Processing
          </button>
        )}

        <button
          onClick={() => setActiveTab('my-payslips')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'my-payslips'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Digital Payslips ({myPayslips.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFORCE PAYROLL RECORDS (HR ADMIN)                               */}
      {/* ========================================================================= */}
      {activeTab === 'workforce' && isHRAdmin && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          {payrollSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Net Disbursed</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  ${payrollSummary.totalDisbursed?.toLocaleString() || 0}
                </h3>
                <span className="text-xs text-emerald-600 font-medium mt-1 block">
                  Net take-home payout
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Allowances</span>
                <h3 className="text-2xl font-black text-sky-600 mt-1 font-mono">
                  ${payrollSummary.totalAllowances?.toLocaleString() || 0}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 block">
                  Housing, transport, medical
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Bonuses</span>
                <h3 className="text-2xl font-black text-amber-600 mt-1 font-mono">
                  ${payrollSummary.totalBonuses?.toLocaleString() || 0}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 block">
                  Incentives & performance
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Deductions</span>
                <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">
                  ${payrollSummary.totalDeductions?.toLocaleString() || 0}
                </h3>
                <span className="text-xs text-slate-500 font-medium mt-1 block">
                  Tax, insurance, provident fund
                </span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee, ID, payslip..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Processed">Processed</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading payroll history...</div>
            ) : payrollRecords.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No payroll records found for {months[selectedMonth - 1]} {selectedYear}. Click "Generate Monthly Payroll" to run calculations.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Period & ID</th>
                      <th className="py-3 px-4">Basic Salary</th>
                      <th className="py-3 px-4">+ Allowances</th>
                      <th className="py-3 px-4">+ Bonuses</th>
                      <th className="py-3 px-4">− Deductions</th>
                      <th className="py-3 px-4">Net Salary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {payrollRecords.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-sans">
                          <p className="font-bold text-slate-900">{item.employee?.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.employee?.designation} • {item.employee?.department}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">{item.employee?.employeeId}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 font-sans block">{months[item.month - 1]} {item.year}</span>
                          <span className="text-[10px] text-slate-400">{item.payslipId}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700">
                          ${item.basicSalary?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-emerald-600">
                          +${item.allowances?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-amber-600">
                          +${item.bonuses?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-rose-600">
                          -${item.deductions?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-sm text-slate-900">
                          ${item.netSalary?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-sans">
                          <StatusBadge status={item.paymentStatus} />
                        </td>

                        <td className="py-3.5 px-4 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingPayslip(item)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="View & Print Digital Payslip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRecord(item);
                                setEditForm({
                                  basicSalary: item.basicSalary,
                                  allowances: item.allowances,
                                  bonuses: item.bonuses,
                                  deductions: item.deductions,
                                  paymentStatus: item.paymentStatus,
                                });
                              }}
                              className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Adjust Compensation"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
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
      {/* TAB 2: MY DIGITAL PAYSLIPS (EMPLOYEE)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'my-payslips' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading your salary payslips...</div>
            ) : myPayslips.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No digital payslips generated for your account yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myPayslips.map((ps) => (
                  <div key={ps._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Payslip for {months[ps.month - 1]} {ps.year}
                          </h3>
                          <StatusBadge status={ps.paymentStatus} />
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {ps.payslipId}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                          <span>Basic: ${ps.basicSalary.toLocaleString()}</span>
                          <span>+ Allowances: ${ps.allowances.toLocaleString()}</span>
                          <span>+ Bonuses: ${ps.bonuses.toLocaleString()}</span>
                          <span className="text-rose-600">− Deductions: ${ps.deductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Take-Home Pay</span>
                        <span className="text-xl font-black text-slate-900 font-mono">
                          {ps.currency} ${ps.netSalary.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => setViewingPayslip(ps)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-4 h-4" /> View Payslip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GENERATE MONTHLY PAYROLL MODAL                                            */}
      {/* ========================================================================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Generate Monthly Workforce Payroll</h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 space-y-1">
                <p className="font-bold">Automated Calculation Formula:</p>
                <p className="font-mono text-[11px]">Net Salary = Basic Salary + Allowances + Bonuses − Deductions</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payroll Month</label>
                  <select
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {months.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payroll Year</label>
                  <select
                    value={generateForm.year}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">General Bonus (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={generateForm.defaultBonusPercent}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, defaultBonusPercent: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tax / Deductions (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={generateForm.defaultDeductionPercent}
                    onChange={(e) => setGenerateForm((prev) => ({ ...prev, defaultDeductionPercent: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {saving ? 'Processing Payroll...' : 'Run Payroll Calculation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL PAYSLIP MODAL / PRINTABLE VIEW                                    */}
      {/* ========================================================================= */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn max-h-[92vh] overflow-y-auto">
            {/* Payslip Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">HRIS Enterprise Portal</h2>
                <p className="text-xs text-slate-500">Official Monthly Employee Payslip</p>
                <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                  Reference: {viewingPayslip.payslipId}
                </p>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Details Summary */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Employee Name</span>
                <span className="font-bold text-slate-900 text-sm">{viewingPayslip.employee?.name}</span>
                <span className="text-slate-500 block">{viewingPayslip.employee?.designation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Employee ID</span>
                <span className="font-mono font-bold text-slate-900">{viewingPayslip.employee?.employeeId}</span>
                <span className="text-slate-500 block">Department: {viewingPayslip.employee?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pay Period</span>
                <span className="font-semibold text-slate-800">{months[viewingPayslip.month - 1]} {viewingPayslip.year}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Disbursement Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(viewingPayslip.paymentDate || viewingPayslip.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-6 py-4 text-xs font-mono">
              {/* Earnings */}
              <div>
                <h4 className="font-sans font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
                  Earnings Breakdown
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary:</span>
                    <span className="font-bold text-slate-900">${viewingPayslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Allowances (Housing/Trans):</span>
                    <span className="font-bold text-emerald-600">+${viewingPayslip.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Performance Bonuses:</span>
                    <span className="font-bold text-amber-600">+${viewingPayslip.bonuses.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold">
                    <span className="text-slate-900">Total Gross:</span>
                    <span>${(viewingPayslip.basicSalary + viewingPayslip.allowances + viewingPayslip.bonuses).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-sans font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
                  Deductions Breakdown
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Income Tax & Social:</span>
                    <span className="font-bold text-rose-600">-${viewingPayslip.deductions.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold">
                    <span className="text-slate-900">Total Deductions:</span>
                    <span className="text-rose-600">-${viewingPayslip.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="bg-slate-900 text-white rounded-xl p-4 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-sans">
                  Total Net Salary (Take-Home)
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {viewingPayslip.currency} ${viewingPayslip.netSalary.toLocaleString()}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-sans">
                Status: <span className="font-bold text-white">{viewingPayslip.paymentStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Payslip
              </button>
              <button
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADJUST PAYROLL RECORD MODAL                                               */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Adjust Compensation: {editingRecord.employee?.name}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block font-sans font-bold text-slate-700 uppercase mb-1">Basic Salary ($)</label>
                <input
                  type="number"
                  required
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, basicSalary: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-sans font-bold text-slate-700 uppercase mb-1">Allowances ($)</label>
                <input
                  type="number"
                  value={editForm.allowances}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, allowances: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-sans font-bold text-slate-700 uppercase mb-1">Bonuses ($)</label>
                <input
                  type="number"
                  value={editForm.bonuses}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bonuses: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-sans font-bold text-slate-700 uppercase mb-1">Deductions ($)</label>
                <input
                  type="number"
                  value={editForm.deductions}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, deductions: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl font-sans flex items-center justify-between">
                <span className="font-bold text-slate-700">Calculated Net Pay:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  ${(editForm.basicSalary + editForm.allowances + editForm.bonuses - editForm.deductions).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
