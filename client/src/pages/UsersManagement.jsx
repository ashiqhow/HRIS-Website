import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Building2,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  Eye,
  FileText,
  BadgeCheck,
  CreditCard,
  Briefcase,
  HeartPulse,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import StatusBadge from '../components/StatusBadge';

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

const roles = ['All', 'HR Admin', 'Manager', 'Employee'];

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [designationFilter, setDesignationFilter] = useState('');

  // View Detailed Profile Modal State
  const [viewingUser, setViewingUser] = useState(null);

  // Edit / Role Management Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    role: 'Employee',
    department: 'Engineering',
    designation: '',
    status: 'Active',
    employmentType: 'Full-time',
    dateOfJoining: '',
    salary: {
      baseSalary: 0,
      currency: 'USD',
      payFrequency: 'Monthly',
    },
    profile: {
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
    },
    permissions: {
      canApproveLeave: false,
      canManageUsers: false,
      canManageRecruitment: false,
      canViewAllAttendance: false,
      canBroadcastAnnouncements: false,
    },
  });

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    employmentType: 'Full-time',
    dateOfJoining: new Date().toISOString().split('T')[0],
    salary: {
      baseSalary: 5000,
      currency: 'USD',
      payFrequency: 'Monthly',
    },
    profile: {
      phone: '',
      address: '',
      workLocation: 'Headquarters',
      emergencyContact: {
        name: '',
        phone: '',
        relation: '',
      },
    },
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isHRAdmin = currentUser?.role === 'HR Admin' || currentUser?.permissions?.canManageUsers;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole !== 'All') params.append('role', selectedRole);
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (designationFilter) params.append('designation', designationFilter);

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedDept, selectedStatus, designationFilter]);

  // Open Edit Modal with prefilled values
  const handleEditClick = (u) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      employeeId: u.employeeId || '',
      role: u.role || 'Employee',
      department: u.department || 'General',
      designation: u.designation || '',
      status: u.status || 'Active',
      employmentType: u.employmentType || 'Full-time',
      dateOfJoining: u.dateOfJoining ? new Date(u.dateOfJoining).toISOString().split('T')[0] : '',
      salary: {
        baseSalary: u.salary?.baseSalary || 0,
        currency: u.salary?.currency || 'USD',
        payFrequency: u.salary?.payFrequency || 'Monthly',
      },
      profile: {
        phone: u.profile?.phone || '',
        secondaryEmail: u.profile?.secondaryEmail || '',
        address: u.profile?.address || '',
        workLocation: u.profile?.workLocation || 'Headquarters',
        bio: u.profile?.bio || '',
        emergencyContact: {
          name: u.profile?.emergencyContact?.name || '',
          phone: u.profile?.emergencyContact?.phone || '',
          relation: u.profile?.emergencyContact?.relation || '',
        },
      },
      permissions: {
        canApproveLeave: !!u.permissions?.canApproveLeave,
        canManageUsers: !!u.permissions?.canManageUsers,
        canManageRecruitment: !!u.permissions?.canManageRecruitment,
        canViewAllAttendance: !!u.permissions?.canViewAllAttendance,
        canBroadcastAnnouncements: !!u.permissions?.canBroadcastAnnouncements,
      },
    });
  };

  // Preset permissions according to role selection
  const handleRoleChange = (newRole) => {
    setEditFormData((prev) => {
      let updatedPerms = { ...prev.permissions };
      if (newRole === 'HR Admin') {
        updatedPerms = {
          canApproveLeave: true,
          canManageUsers: true,
          canManageRecruitment: true,
          canViewAllAttendance: true,
          canBroadcastAnnouncements: true,
        };
      } else if (newRole === 'Manager') {
        updatedPerms = {
          canApproveLeave: true,
          canManageUsers: false,
          canManageRecruitment: false,
          canViewAllAttendance: true,
          canBroadcastAnnouncements: false,
        };
      } else {
        updatedPerms = {
          canApproveLeave: false,
          canManageUsers: false,
          canManageRecruitment: false,
          canViewAllAttendance: false,
          canBroadcastAnnouncements: false,
        };
      }
      return {
        ...prev,
        role: newRole,
        permissions: updatedPerms,
      };
    });
  };

  const handleSaveEmployeeRecord = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/users/${editingUser._id}/role-access`, editFormData);
      setFeedback({ type: 'success', message: 'Employee digital record updated successfully!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee record');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/users', newUserData);
      setFeedback({ type: 'success', message: 'New employee registered successfully into central records!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
      setShowAddModal(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        role: 'Employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        employmentType: 'Full-time',
        dateOfJoining: new Date().toISOString().split('T')[0],
        salary: { baseSalary: 5000, currency: 'USD', payFrequency: 'Monthly' },
        profile: {
          phone: '',
          address: '',
          workLocation: 'Headquarters',
          emergencyContact: { name: '', phone: '', relation: '' },
        },
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the digital record for ${name}?`)) {
      try {
        await api.delete(`/users/${userId}`);
        setFeedback({ type: 'success', message: `Employee record for ${name} removed successfully.` });
        setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete employee record');
      }
    }
  };

  // Export workforce to CSV
  const exportToCSV = () => {
    if (users.length === 0) return;
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Role',
      'Department',
      'Designation',
      'Status',
      'Employment Type',
      'Joining Date',
      'Phone',
      'Location',
    ];
    if (isHRAdmin) headers.push('Salary', 'Currency');

    const rows = users.map((u) => {
      const row = [
        `"${u.employeeId || ''}"`,
        `"${u.name || ''}"`,
        `"${u.email || ''}"`,
        `"${u.role || ''}"`,
        `"${u.department || ''}"`,
        `"${u.designation || ''}"`,
        `"${u.status || ''}"`,
        `"${u.employmentType || ''}"`,
        `"${u.dateOfJoining ? new Date(u.dateOfJoining).toLocaleDateString() : ''}"`,
        `"${u.profile?.phone || ''}"`,
        `"${u.profile?.workLocation || ''}"`,
      ];
      if (isHRAdmin) {
        row.push(`"${u.salary?.baseSalary || 0}"`, `"${u.salary?.currency || 'USD'}"`);
      }
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workforce_directory_${new Date().toISOString().split('T')[0]}.csv`);
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
              {currentUser?.role === 'Manager'
                ? `${currentUser.department} Department Team Records`
                : 'Centralized Employee Information Management'}
            </h1>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full">
              Module 1.1
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {isHRAdmin
              ? 'Maintain centralized digital records, manage employee personal and professional data, salaries, and system access.'
              : `View records and contact profiles for your respective team members in the ${currentUser?.department} department.`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            title="Export Employee List as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isHRAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
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
          <Check className="w-4 h-4" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar: Name, ID, Department, Designation, Role, Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search by Name, Email, or ID */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>

        {/* Filter by Designation */}
        <div>
          <input
            type="text"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            placeholder="Filter by Designation..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Department Filter (HR Admin can filter all, Manager is scoped to their department) */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            disabled={!isHRAdmin}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Roles' : r}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Central Employee Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading digital workforce directory...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No employee records match the search or filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee Information</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Department & Designation</th>
                  <th className="py-3 px-4">Joining Date</th>
                  {isHRAdmin && <th className="py-3 px-4">Salary Information</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer" onClick={() => setViewingUser(u)}>
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                          <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-mono font-medium">
                            {u.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <RoleBadge role={u.role} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{u.designation}</p>
                      <p className="text-[11px] text-slate-500">{u.department}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(u.dateOfJoining || u.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      <span className="block text-[10px] text-slate-400">{u.employmentType || 'Full-time'}</span>
                    </td>

                    {isHRAdmin && (
                      <td className="py-3.5 px-4">
                        {u.salary?.baseSalary > 0 ? (
                          <div>
                            <span className="font-bold text-slate-900 font-mono">
                              {u.salary.currency || 'USD'} {Number(u.salary.baseSalary).toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-400">/{u.salary.payFrequency || 'Monthly'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not configured</span>
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <StatusBadge status={u.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="View Digital Employee File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isHRAdmin && (
                          <>
                            <button
                              onClick={() => handleEditClick(u)}
                              className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Update Employee Information"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {currentUser._id !== u._id && (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Employee Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW CENTRALIZED DIGITAL EMPLOYEE FILE MODAL                              */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                  {viewingUser.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingUser.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
                      {viewingUser.employeeId}
                    </span>
                    <RoleBadge role={viewingUser.role} size="sm" />
                    <StatusBadge status={viewingUser.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 mt-5 text-xs">
              {/* Professional & Department Info */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-sky-600" /> Professional Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Department</span>
                    <span className="font-semibold text-slate-800">{viewingUser.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Designation</span>
                    <span className="font-semibold text-slate-800">{viewingUser.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Employment Type</span>
                    <span className="font-semibold text-slate-800">{viewingUser.employmentType || 'Full-time'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Joining</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(viewingUser.dateOfJoining || viewingUser.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Work Location</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.workLocation || 'Headquarters'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-sky-600" /> Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Work Email</span>
                    <span className="font-semibold text-slate-800">{viewingUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.phone || 'Not provided'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Residential Address</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Salary & Compensation (HR Admin only) */}
              {isHRAdmin && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Compensation & Salary Details
                  </h4>
                  <div className="grid grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Base Salary</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {viewingUser.salary?.currency || 'USD'} {Number(viewingUser.salary?.baseSalary || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Pay Frequency</span>
                      <span className="font-semibold text-slate-800">{viewingUser.salary?.payFrequency || 'Monthly'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Payment Currency</span>
                      <span className="font-semibold text-slate-800">{viewingUser.salary?.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" /> Emergency Contact
                </h4>
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Name</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.emergencyContact?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Relationship</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.emergencyContact?.relation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="font-semibold text-slate-800">{viewingUser.profile?.emergencyContact?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Leave Balances */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Leave Allowance Balances</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-center">
                    <span className="text-[11px] text-sky-700 font-medium">Annual Leave</span>
                    <p className="font-bold text-sky-900 text-lg">{viewingUser.leaveBalance?.annual ?? 14} d</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    <span className="text-[11px] text-purple-700 font-medium">Sick Leave</span>
                    <p className="font-bold text-purple-900 text-lg">{viewingUser.leaveBalance?.sick ?? 10} d</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <span className="text-[11px] text-amber-700 font-medium">Casual Leave</span>
                    <p className="font-bold text-amber-900 text-lg">{viewingUser.leaveBalance?.casual ?? 8} d</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-5 border-t border-slate-100">
              {isHRAdmin && (
                <button
                  onClick={() => {
                    const target = viewingUser;
                    setViewingUser(null);
                    handleEditClick(target);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Record
                </button>
              )}
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT EMPLOYEE RECORD MODAL (HR ADMIN)                                     */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Digital Record for {editingUser.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeRecord} className="space-y-4 mt-4 text-xs">
              {/* Identity & Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editFormData.employeeId}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Role, Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">System Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {editingUser?.role === 'HR Admin' ? (
                      <option value="HR Admin">Master HR Administrator (Admin #1)</option>
                    ) : (
                      <>
                        <option value="Manager">Manager (Team Leader)</option>
                        <option value="Employee">Employee (Self-Service)</option>
                        <option value="HR Admin" disabled>
                          HR Admin (1 Master Admin Limit)
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {departments.filter((d) => d !== 'All').map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Status, Employment Type & Date of Joining */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Employment Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Employment Type</label>
                  <select
                    value={editFormData.employmentType}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={editFormData.dateOfJoining}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, dateOfJoining: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Salary & Compensation Section */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 uppercase mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" /> Salary Information Management
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Salary</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editFormData.salary.baseSalary}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, baseSalary: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                    <select
                      value={editFormData.salary.currency}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, currency: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="BDT">BDT (৳)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pay Frequency</label>
                    <select
                      value={editFormData.salary.payFrequency}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, payFrequency: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editFormData.profile.phone}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, phone: e.target.value },
                      }))
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Work Location</label>
                  <select
                    value={editFormData.profile.workLocation}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, workLocation: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Headquarters">Headquarters</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Regional Office">Regional Office</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={editFormData.profile.address}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, address: e.target.value },
                      }))
                    }
                    placeholder="123 Street, City"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Permission Flags */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 uppercase mb-2">
                  System Permission Flags
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.permissions.canApproveLeave}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, canApproveLeave: e.target.checked },
                        }))
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Approve team leaves</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.permissions.canViewAllAttendance}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, canViewAllAttendance: e.target.checked },
                        }))
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Audit organization attendance</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.permissions.canManageUsers}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, canManageUsers: e.target.checked },
                        }))
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Manage employee records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.permissions.canBroadcastAnnouncements}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, canBroadcastAnnouncements: e.target.checked },
                        }))
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Broadcast announcements</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Employee File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD EMPLOYEE MODAL (HR ADMIN)                                             */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Employee to Central Records</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="min 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Custom Employee ID (Optional)</label>
                  <input
                    type="text"
                    value={newUserData.employeeId}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Auto-generated if empty (e.g. EMP-1234)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Employee">Employee (Self-Service)</option>
                    <option value="Manager">Department Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={newUserData.department}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {departments.filter((d) => d !== 'All').map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={newUserData.designation}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Salary Setup */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 uppercase mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" /> Salary Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Salary</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={newUserData.salary.baseSalary}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, baseSalary: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                    <select
                      value={newUserData.salary.currency}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, currency: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="BDT">BDT (৳)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pay Frequency</label>
                    <select
                      value={newUserData.salary.payFrequency}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, payFrequency: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newUserData.profile.phone}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, phone: e.target.value },
                      }))
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={newUserData.dateOfJoining}
                    onChange={(e) => setNewUserData((prev) => ({ ...prev, dateOfJoining: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {saving ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
