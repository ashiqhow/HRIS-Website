import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Lock,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  AlertCircle,
  Check,
  Save,
  Key,
  ShieldCheck,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RoleBadge from '../components/RoleBadge';
import StatusBadge from '../components/StatusBadge';

const Profile = () => {
  const { user, updateLocalUser } = useAuth();

  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'employment', 'security'

  // Form state for permitted personal information
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    secondaryEmail: '',
    address: '',
    workLocation: 'Headquarters',
    bio: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || '',
        phone: user.profile?.phone || '',
        secondaryEmail: user.profile?.secondaryEmail || '',
        address: user.profile?.address || '',
        workLocation: user.profile?.workLocation || 'Headquarters',
        bio: user.profile?.bio || '',
        emergencyContact: {
          name: user.profile?.emergencyContact?.name || '',
          phone: user.profile?.emergencyContact?.phone || '',
          relation: user.profile?.emergencyContact?.relation || '',
        },
      });
    }
  }, [user]);

  // Handle saving personal info
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/profile', personalForm);
      if (res.data.success) {
        updateLocalUser(res.data.user);
        setFeedback({ type: 'success', message: 'Personal profile updated successfully!' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile.',
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Handle changing password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/profile/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to change password.',
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Profile Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-sky-500/20 flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <RoleBadge role={user?.role} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              {user?.designation} • {user?.department} • ID: <span className="font-mono">{user?.employeeId}</span>
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {user?.profile?.workLocation || 'Headquarters'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-400">Account Status</p>
          <div className="mt-1">
            <StatusBadge status={user?.status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Joined: {new Date(user?.dateOfJoining || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </p>
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
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'personal'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Permitted Personal Information
        </button>

        <button
          onClick={() => setActiveTab('employment')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'employment'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Employment & Access Rights
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERMITTED PERSONAL INFO (EDITABLE BY USER)                          */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <form onSubmit={handlePersonalSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500">
              You are permitted to keep your personal contact, bio, and emergency details up to date.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={personalForm.name}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
              <input
                type="tel"
                value={personalForm.phone}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Personal / Secondary Email</label>
              <input
                type="email"
                value={personalForm.secondaryEmail}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, secondaryEmail: e.target.value }))}
                placeholder="personal@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Location</label>
              <select
                value={personalForm.workLocation}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, workLocation: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Headquarters">Headquarters</option>
                <option value="Remote">Remote</option>
                <option value="Regional Office">Regional Office</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Residential Address</label>
            <input
              type="text"
              value={personalForm.address}
              onChange={(e) => setPersonalForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="123 Street Name, City, State, ZIP"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Professional Bio / About Me</label>
            <textarea
              rows={3}
              value={personalForm.bio}
              onChange={(e) => setPersonalForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief overview of your experience, skills, and interests..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            ></textarea>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              Emergency Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={personalForm.emergencyContact.name}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                    }))
                  }
                  placeholder="e.g. Mary Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relationship</label>
                <input
                  type="text"
                  value={personalForm.emergencyContact.relation}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relation: e.target.value },
                    }))
                  }
                  placeholder="e.g. Spouse / Sibling / Parent"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  value={personalForm.emergencyContact.phone}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, phone: e.target.value },
                    }))
                  }
                  placeholder="+1 (555) 999-9999"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EMPLOYMENT & ACCESS RIGHTS (GOVERNED)                               */}
      {/* ========================================================================= */}
      {activeTab === 'employment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Organization & Access Rights
            </h2>
            <p className="text-xs text-slate-500">
              Employment properties are maintained by the HR Administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Employee Identifier</span>
              <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">{user?.employeeId}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Department</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{user?.department}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Designation</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{user?.designation}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Assigned Role</span>
              <div className="mt-1">
                <RoleBadge role={user?.role} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Employment Type</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">{user?.employmentType || 'Full-time'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Date of Joining</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                {new Date(user?.dateOfJoining || Date.now()).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800 block uppercase">Base Compensation</span>
              <span className="text-sm font-bold font-mono text-emerald-950 mt-1 block">
                {user?.salary?.baseSalary ? `${user.salary.currency || 'USD'} ${Number(user.salary.baseSalary).toLocaleString()}` : 'Configured by HR'}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">{user?.salary?.payFrequency || 'Monthly'}</span>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Granted Permissions Matrix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700">Approve/Reject Team Leaves</span>
                {user?.permissions?.canApproveLeave || user?.role === 'HR Admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Granted
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Restricted</span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700">Manage Roles & System Accounts</span>
                {user?.permissions?.canManageUsers || user?.role === 'HR Admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Granted
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Restricted</span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700">Audit Organization Attendance</span>
                {user?.permissions?.canViewAllAttendance || user?.role === 'HR Admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Granted
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Restricted</span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700">Broadcast Company Announcements</span>
                {user?.permissions?.canBroadcastAnnouncements || user?.role === 'HR Admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Granted
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Restricted</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SECURITY & PASSWORD CHANGE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 max-w-xl">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Account Security & Password
            </h2>
            <p className="text-xs text-slate-500">
              Update your account password regularly to ensure portal protection.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
