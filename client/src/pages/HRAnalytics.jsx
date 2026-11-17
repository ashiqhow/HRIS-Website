import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  Building2,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const departments = [
  'All',
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Operations',
  'Sales',
  'Product',
  'General',
];

const HRAnalytics = () => {
  const { user } = useAuth();
  const isHRAdmin = user?.role === 'HR Admin' || user?.permissions?.canManageUsers;
  const isManager = user?.role === 'Manager';

  const [selectedDept, setSelectedDept] = useState(
    !isHRAdmin && isManager ? user?.department : 'All'
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (selectedDept && selectedDept !== 'All') {
        params.append('department', selectedDept);
      }

      const res = await api.get(`/analytics/dashboard?${params.toString()}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load HR analytics:', err);
      setError('Unable to load analytics data. Please ensure you have managerial permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDept]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Aggregating organizational analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              HR Analytics Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workforce intelligence, attendance trends, recruitment velocity, payroll expenses, and performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department Filter */}
          {isHRAdmin && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs shadow-sm">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-medium">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <>
          {/* Top KPI Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Workforce Size
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.summary?.totalEmployees || 0}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                  <CheckCircle className="w-3 h-3" /> {data.summary?.activeEmployees || 0} Active Staff
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Punctuality Rate
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.summary?.punctualityRate || 100}%
                </h3>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                  Avg Shift: {data.attendance?.avgShiftHours || 8.0} hrs
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Payroll Net
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  ${(data.summary?.totalPayrollExpense || 0).toLocaleString()}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                  Disbursed via automated formula
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Avg Performance Score
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.summary?.avgPerformanceScore || 85}{' '}
                  <span className="text-sm font-normal text-slate-400">/ 100</span>
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                  Productivity: {data.summary?.avgProductivityScore || 88}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Workforce Distribution & Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Breakdown */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Employee Distribution by Department
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department headcount allocation across the organization
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                  {data.summary?.totalEmployees || 0} Staff
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {Object.entries(data.distribution?.department || {}).map(([dept, count]) => {
                  const total = data.summary?.totalEmployees || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{dept}</span>
                        <span className="text-slate-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Employment Type & Roles */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Employment Structure
                </h3>
                <p className="text-xs text-slate-500">Contract type and role distribution</p>
              </div>

              {/* Employment Types */}
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Contract Classification
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(data.distribution?.employmentType || {}).map(([type, count]) => (
                    <div
                      key={type}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between"
                    >
                      <span className="text-[11px] text-slate-500">{type}</span>
                      <span className="text-lg font-bold text-slate-900 mt-1">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Role Hierarchy
                </p>
                <div className="space-y-2">
                  {Object.entries(data.distribution?.role || {}).map(([role, count]) => (
                    <div
                      key={role}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700">{role}</span>
                      <span className="font-bold text-indigo-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Attendance & Timesheet Punctuality Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendance Punctuality</h3>
                <p className="text-xs text-slate-500">Historical clock-in compliance status</p>
              </div>

              {/* Radial Punctuality Meter */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${data.attendance?.punctualityRate || 100}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {data.attendance?.punctualityRate || 100}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      On-Time
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-slate-200 text-center">
                  <div>
                    <span className="text-xs text-slate-500 block">Total Logs</span>
                    <span className="text-base font-bold text-slate-800">
                      {data.attendance?.totalLogged || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Avg Shift</span>
                    <span className="text-base font-bold text-slate-800">
                      {data.attendance?.avgShiftHours || 8.0} hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Breakdown Grid */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Timesheet Logs Classification
                </h3>
                <p className="text-xs text-slate-500">
                  Categorization of shifts logged across active workforce members
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <p className="text-xs font-semibold text-emerald-800">Present On-Time</p>
                  <h4 className="text-2xl font-bold text-emerald-900 mt-1">
                    {data.attendance?.presentCount || 0}
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center">
                  <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </span>
                  <p className="text-xs font-semibold text-amber-800">Late Arrivals</p>
                  <h4 className="text-2xl font-bold text-amber-900 mt-1">
                    {data.attendance?.lateCount || 0}
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center text-center">
                  <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </span>
                  <p className="text-xs font-semibold text-sky-800">Half Day</p>
                  <h4 className="text-2xl font-bold text-sky-900 mt-1">
                    {data.attendance?.halfDayCount || 0}
                  </h4>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center text-center">
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-2">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <p className="text-xs font-semibold text-rose-800">Absent</p>
                  <h4 className="text-2xl font-bold text-rose-900 mt-1">
                    {data.attendance?.absentCount || 0}
                  </h4>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>Automatic late cutoff configured at <strong>09:30 AM</strong></span>
                <span className="font-semibold text-indigo-600">Zero Proxy Punches Logged</span>
              </div>
            </div>
          </div>

          {/* Section 3: Recruitment Funnel & Payroll Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruitment Pipeline Funnel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recruitment ATS Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate conversion funnel from application to hire
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                  {data.recruitment?.totalApplicants || 0} Candidates
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {Object.entries(data.recruitment?.pipeline || {}).map(([stage, count]) => {
                  const total = data.recruitment?.totalApplicants || 1;
                  const pct = Math.round((count / total) * 100);

                  let colorClass = 'bg-blue-600';
                  if (stage === 'Interview Scheduled') colorClass = 'bg-indigo-600';
                  if (stage === 'Selected') colorClass = 'bg-emerald-600';
                  if (stage === 'Rejected') colorClass = 'bg-rose-500';

                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{stage}</span>
                        <span className="text-slate-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>Active Job Openings: <strong>{data.recruitment?.activePostings || 0}</strong></span>
                <span>Selection Rate: <strong>{data.summary?.selectionRate || 0}%</strong></span>
              </div>
            </div>

            {/* Payroll Compensation Anatomy */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Payroll & Expense Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formula: Net = Basic + Allowances + Bonuses − Deductions
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  ${(data.payroll?.totalNet || 0).toLocaleString()} Net Payout
                </span>
              </div>

              {/* Formula Bar Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Basic Salaries</span>
                  <span className="text-base font-bold text-slate-900">
                    ${(data.payroll?.totalBasic || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block">+ Allowances</span>
                  <span className="text-base font-bold text-emerald-900">
                    ${(data.payroll?.totalAllowances || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 block">+ Bonuses</span>
                  <span className="text-base font-bold text-blue-900">
                    ${(data.payroll?.totalBonuses || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[11px] text-rose-700 block">− Deductions</span>
                  <span className="text-base font-bold text-rose-900">
                    ${(data.payroll?.totalDeductions || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Department Allocation */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Department Payroll Allocation
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {Object.entries(data.payroll?.departmentAllocation || {}).map(([dept, amt]) => (
                    <div
                      key={dept}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50"
                    >
                      <span className="font-semibold text-slate-700">{dept}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ${amt.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Performance Tiers & Training Participation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Rating Tiers */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Performance Rating Tiers</h3>
                <p className="text-xs text-slate-500">
                  Evaluation results across Excellent, Very Good, Good, and Needs Improvement
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                    <span>Excellent (90+)</span>
                    <span className="font-bold text-lg text-emerald-950">
                      {data.performance?.ratingTiers?.Excellent || 0}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/50 rounded-full h-1.5">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{
                        width: `${
                          data.performance?.totalEvaluated > 0
                            ? ((data.performance?.ratingTiers?.Excellent || 0) /
                                data.performance.totalEvaluated) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                  <div className="flex items-center justify-between text-xs text-sky-800 font-semibold mb-1">
                    <span>Very Good (75-89)</span>
                    <span className="font-bold text-lg text-sky-950">
                      {data.performance?.ratingTiers?.['Very Good'] || 0}
                    </span>
                  </div>
                  <div className="w-full bg-sky-200/50 rounded-full h-1.5">
                    <div
                      className="bg-sky-600 h-1.5 rounded-full"
                      style={{
                        width: `${
                          data.performance?.totalEvaluated > 0
                            ? ((data.performance?.ratingTiers?.['Very Good'] || 0) /
                                data.performance.totalEvaluated) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
                    <span>Good (60-74)</span>
                    <span className="font-bold text-lg text-amber-950">
                      {data.performance?.ratingTiers?.Good || 0}
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/50 rounded-full h-1.5">
                    <div
                      className="bg-amber-600 h-1.5 rounded-full"
                      style={{
                        width: `${
                          data.performance?.totalEvaluated > 0
                            ? ((data.performance?.ratingTiers?.Good || 0) /
                                data.performance.totalEvaluated) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
                    <span>Needs Improvement</span>
                    <span className="font-bold text-lg text-rose-950">
                      {data.performance?.ratingTiers?.['Needs Improvement'] || 0}
                    </span>
                  </div>
                  <div className="w-full bg-rose-200/50 rounded-full h-1.5">
                    <div
                      className="bg-rose-600 h-1.5 rounded-full"
                      style={{
                        width: `${
                          data.performance?.totalEvaluated > 0
                            ? ((data.performance?.ratingTiers?.['Needs Improvement'] || 0) /
                                data.performance.totalEvaluated) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Evaluations Completed:</span>
                <span className="font-bold text-slate-900">{data.performance?.totalEvaluated || 0}</span>
              </div>
            </div>

            {/* Training Participation & Skill Development */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Training & Skill Development
                </h3>
                <p className="text-xs text-slate-500">
                  Course enrollment and workforce certification completion
                </p>
              </div>

              <div className="p-5 bg-gradient-to-tr from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                    Completion Rate
                  </span>
                  <h4 className="text-3xl font-extrabold text-teal-950 mt-1">
                    {data.training?.completionRate || 0}%
                  </h4>
                  <p className="text-xs text-teal-700 mt-1">
                    {data.training?.totalCompleted || 0} out of {data.training?.totalEnrolled || 0} completed
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center text-teal-600">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Total Programs</span>
                  <span className="text-lg font-bold text-slate-900">
                    {data.training?.totalPrograms || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">In Progress</span>
                  <span className="text-lg font-bold text-sky-600">
                    {data.training?.inProgress || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Completed</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {data.training?.totalCompleted || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HRAnalytics;
