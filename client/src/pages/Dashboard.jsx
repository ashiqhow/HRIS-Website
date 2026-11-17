import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  CalendarDays,
  AlertCircle,
  Building2,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Send,
  Check,
  X,
  FileText,
  UserCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RoleBadge from '../components/RoleBadge';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Handle Employee Check-In / Check-Out
  const handleAttendanceAction = async (type) => {
    try {
      setActionLoading(true);
      const endpoint = type === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 4000);
      fetchDashboardData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manager Quick Leave Review
  const handleQuickReview = async (leaveId, status) => {
    try {
      setActionLoading(true);
      await api.put(`/leaves/${leaveId}/review`, {
        status,
        reviewComment: `Quick ${status} from Manager Dashboard`,
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500">Loading personalized dashboard...</p>
      </div>
    );
  }

  const role = user?.role;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-sky-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RoleBadge role={role} size="lg" />
              <span className="text-xs text-slate-300 font-mono">ID: {user?.employeeId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {role === 'HR Admin' && 'Enterprise HR Overview & Workforce Operations'}
              {role === 'Manager' && `${user?.department} Department Leadership Portal`}
              {role === 'Employee' && 'Self-Service Employee Portal & Daily Workspace'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right self-start md:self-auto">
            <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Current Time</p>
            <p className="text-xl font-bold font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[11px] text-slate-300">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-xs text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. HR ADMIN DASHBOARD                                                     */}
      {/* ========================================================================= */}
      {role === 'HR Admin' && data && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workforce</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.totalEmployees || 0}</h3>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {data.stats?.activeEmployees || 0} Active Staff
                </span>
              </div>
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.attendanceRate || 0}%</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 block">
                  {data.stats?.todayAttendanceCount || 0} check-ins logged
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.pendingLeavesCount || 0}</h3>
                <Link to="/leaves" className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-0.5 mt-1">
                  Review queue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.departmentsCount || 0}</h3>
                <span className="text-xs text-purple-600 font-medium mt-1 block">
                  Across organization
                </span>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* HR Quick Actions Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Administrative Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/users"
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition flex flex-col items-center text-center gap-2 group"
              >
                <ShieldCheck className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Role & Access</span>
                <span className="text-[11px] text-slate-400">Manage permissions</span>
              </Link>

              <Link
                to="/leaves"
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition flex flex-col items-center text-center gap-2 group"
              >
                <CalendarDays className="w-6 h-6 text-amber-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Review Leaves</span>
                <span className="text-[11px] text-slate-400">{data.stats?.pendingLeavesCount} pending</span>
              </Link>

              <Link
                to="/notifications"
                className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition flex flex-col items-center text-center gap-2 group"
              >
                <Send className="w-6 h-6 text-sky-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Broadcast Notice</span>
                <span className="text-[11px] text-slate-400">Notify employees</span>
              </Link>

              <Link
                to="/attendance"
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition flex flex-col items-center text-center gap-2 group"
              >
                <Clock className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800">Attendance Audit</span>
                <span className="text-[11px] text-slate-400">View real-time logs</span>
              </Link>
            </div>
          </div>

          {/* Department Breakdown & Recent Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Department Workforce</span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </h2>
              <div className="space-y-3">
                {data.departmentBreakdown?.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">{dept.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((dept.count / (data.stats?.totalEmployees || 1)) * 100)
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-800 min-w-[28px] text-right">
                        {dept.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Registrations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recently Registered Staff
                </h2>
                <Link to="/users" className="text-xs text-sky-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentUsers?.map((u) => (
                  <div key={u._id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.designation} • {u.department}</p>
                      </div>
                    </div>
                    <RoleBadge role={u.role} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MANAGER DASHBOARD                                                      */}
      {/* ========================================================================= */}
      {role === 'Manager' && data && (
        <div className="space-y-6">
          {/* Manager KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Team</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.teamSize || 0}</h3>
                <span className="text-xs text-slate-500 font-medium mt-1 block">{user?.department} Team</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.presentToday || 0}</h3>
                <span className="text-xs text-emerald-600 font-medium mt-1 block">
                  {data.stats?.attendanceRate || 0}% team attendance
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On Leave Today</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.onLeaveToday || 0}</h3>
                <span className="text-xs text-amber-600 font-medium mt-1 block">Scheduled off</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.stats?.pendingApprovals || 0}</h3>
                <span className="text-xs text-rose-600 font-medium mt-1 block">Awaiting your review</span>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Pending Leave Requests for Team */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Pending Team Leave Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Review and approve leave submissions from your department
                </p>
              </div>
              <Link to="/leaves" className="text-xs text-sky-600 font-semibold hover:underline">
                View all leaves
              </Link>
            </div>

            {data.pendingTeamLeaves && data.pendingTeamLeaves.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                All caught up! No pending leave requests for your team.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Leave Type</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.pendingTeamLeaves?.map((leave) => (
                      <tr key={leave._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{leave.employee?.name}</p>
                          <p className="text-[11px] text-slate-400">{leave.employee?.designation}</p>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {leave.leaveType}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-400">({leave.daysCount} days)</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleQuickReview(leave._id, 'Approved')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleQuickReview(leave._id, 'Rejected')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
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

          {/* Department Team Roster */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              {user?.department} Team Members
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.teamMembers?.map((m) => (
                <div key={m._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{m.designation}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{m.employeeId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EMPLOYEE DASHBOARD                                                     */}
      {/* ========================================================================= */}
      {role === 'Employee' && data && (
        <div className="space-y-6">
          {/* Top Section: Daily Clock In/Out & Leave Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Attendance Clock Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Today's Attendance
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    data.stats?.hasCheckedIn
                      ? data.stats?.hasCheckedOut
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {data.stats?.hasCheckedIn
                      ? data.stats?.hasCheckedOut
                        ? 'Completed for today'
                        : 'Currently Working'
                      : 'Not Checked In'}
                  </span>
                </div>

                <div className="text-center py-3">
                  <Clock className="w-8 h-8 text-sky-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-2xl font-extrabold text-slate-900 font-mono">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  {data.stats?.hasCheckedIn && (
                    <p className="text-xs text-slate-500 mt-1">
                      Check-in logged at: {new Date(data.stats.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {data.stats?.hasCheckedOut && (
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      Work logged: {data.stats.workHours} hours
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {!data.stats?.hasCheckedIn ? (
                  <button
                    onClick={() => handleAttendanceAction('check-in')}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Check In Now</span>
                  </button>
                ) : !data.stats?.hasCheckedOut ? (
                  <button
                    onClick={() => handleAttendanceAction('check-out')}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Check Out</span>
                  </button>
                ) : (
                  <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
                    ✓ Completed today's work schedule
                  </div>
                )}
              </div>
            </div>

            {/* Leave Balances */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Leave Allowance
                  </h2>
                  <Link
                    to="/leaves"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    Apply for Leave <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 text-center">
                    <p className="text-xs font-medium text-sky-700">Annual Leave</p>
                    <p className="text-2xl font-extrabold text-sky-900 mt-1">
                      {data.stats?.leaveBalance?.annual ?? 14}
                    </p>
                    <span className="text-[10px] text-sky-600">days available</span>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                    <p className="text-xs font-medium text-purple-700">Sick Leave</p>
                    <p className="text-2xl font-extrabold text-purple-900 mt-1">
                      {data.stats?.leaveBalance?.sick ?? 10}
                    </p>
                    <span className="text-[10px] text-purple-600">days available</span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                    <p className="text-xs font-medium text-amber-700">Casual Leave</p>
                    <p className="text-2xl font-extrabold text-amber-900 mt-1">
                      {data.stats?.leaveBalance?.casual ?? 8}
                    </p>
                    <span className="text-[10px] text-amber-600">days available</span>
                  </div>
                </div>
              </div>

              {/* Profile Completion Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Profile Completeness</span>
                  <span className="font-bold text-sky-600">{data.stats?.profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.stats?.profileCompletion}%` }}
                  ></div>
                </div>
                {data.stats?.profileCompletion < 100 && (
                  <Link
                    to="/profile"
                    className="text-[11px] text-slate-500 hover:text-sky-600 mt-1.5 inline-block"
                  >
                    Complete contact & emergency info in Profile →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: My Recent Leaves & Company Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Recent Leaves */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  My Recent Leave Applications
                </h2>
                <Link to="/leaves" className="text-xs text-sky-600 hover:underline">
                  View all
                </Link>
              </div>

              {data.myLeaves && data.myLeaves.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No leave requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.myLeaves?.map((leave) => (
                    <div
                      key={leave._id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">{leave.leaveType}</span>
                          <span className="text-[11px] text-slate-400">({leave.daysCount} days)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        {leave.reviewComment && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">
                            Note: "{leave.reviewComment}"
                          </p>
                        )}
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company Announcements / Alerts Feed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  Company Noticeboard & Updates
                </h2>
                <Link to="/notifications" className="text-xs text-sky-600 hover:underline">
                  All alerts
                </Link>
              </div>

              {data.recentAnnouncements && data.recentAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No company notices at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentAnnouncements?.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
