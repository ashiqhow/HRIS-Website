import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  Eye,
  Building2,
  TrendingUp,
  X,
  FileText,
  BarChart2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';

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

const programStatuses = ['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'];

const participantStatuses = ['Enrolled', 'In Progress', 'Completed', 'Dropped'];

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Upcoming':
    case 'Enrolled':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Cancelled':
    case 'Dropped':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const Training = () => {
  const { user } = useAuth();
  const isHRAdmin = user?.role === 'HR Admin' || user?.permissions?.canManageUsers;
  const isManager = user?.role === 'Manager';
  const canManageTraining = isHRAdmin || isManager;

  const [activeTab, setActiveTab] = useState(
    canManageTraining ? 'programs' : 'my-trainings'
  );

  // Programs state
  const [trainings, setTrainings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  // Personal trainings state
  const [myTrainings, setMyTrainings] = useState([]);

  // Reports state
  const [trainingReports, setTrainingReports] = useState(null);

  // Employees for assignment dropdown/checklist
  const [employees, setEmployees] = useState([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningProgram, setAssigningProgram] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [viewingProgram, setViewingProgram] = useState(null);
  const [updatingParticipant, setUpdatingParticipant] = useState(null);

  // Participant update form
  const [participantForm, setParticipantForm] = useState({
    status: 'In Progress',
    score: 85,
    feedback: '',
  });

  // Create Program Form
  const [newProgramForm, setNewProgramForm] = useState({
    title: '',
    description: '',
    trainer: '',
    department: 'All',
    startDate: '',
    endDate: '',
    location: 'Virtual Training Room (Zoom/Meet)',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch all training programs
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (search) params.append('search', search);

      const res = await api.get(`/training?${params.toString()}`);
      if (res.data.success) {
        setTrainings(res.data.trainings || []);
      }
    } catch (err) {
      console.error('Failed to load training programs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee's assigned trainings
  const fetchMyTrainings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/training/my-trainings');
      if (res.data.success) {
        setMyTrainings(res.data.trainings || []);
      }
    } catch (err) {
      console.error('Failed to load personal training enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch training reports & analytics
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/training/reports');
      if (res.data.success) {
        setTrainingReports(res.data);
      }
    } catch (err) {
      console.error('Failed to load training reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees list for assignment
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users?status=Active');
      if (res.data.success) {
        setEmployees(res.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch workforce users for training:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'programs') {
      fetchPrograms();
      if (canManageTraining) fetchEmployees();
    } else if (activeTab === 'my-trainings') {
      fetchMyTrainings();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, selectedStatus, selectedDept, search]);

  // Handle Create Program
  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (
      !newProgramForm.title ||
      !newProgramForm.description ||
      !newProgramForm.trainer ||
      !newProgramForm.startDate ||
      !newProgramForm.endDate
    ) {
      setFeedback({ type: 'error', text: 'Please fill in all required training program details.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', text: '' });

      const res = await api.post('/training', newProgramForm);
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Training program created successfully!' });
        setShowCreateModal(false);
        setNewProgramForm({
          title: '',
          description: '',
          trainer: '',
          department: 'All',
          startDate: '',
          endDate: '',
          location: 'Virtual Training Room (Zoom/Meet)',
        });
        fetchPrograms();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create training program.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Employee Assignment
  const handleAssignEmployees = async () => {
    if (!assigningProgram || selectedEmployeeIds.length === 0) {
      setFeedback({ type: 'error', text: 'Please select at least one employee to enroll.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/training/${assigningProgram._id}/assign`, {
        employeeIds: selectedEmployeeIds,
      });

      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        setAssigningProgram(null);
        setSelectedEmployeeIds([]);
        fetchPrograms();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign employees to training.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Updating Participant Status
  const handleUpdateParticipant = async (e) => {
    e.preventDefault();
    if (!updatingParticipant || !updatingParticipant.programId || !updatingParticipant.employeeId) return;

    try {
      setSubmitting(true);
      const res = await api.put(
        `/training/${updatingParticipant.programId}/participants/${updatingParticipant.employeeId}`,
        participantForm
      );

      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Training participation progress updated.' });
        setUpdatingParticipant(null);
        if (viewingProgram) {
          // Refresh viewing program data
          const updatedProgram = await api.get('/training');
          const found = updatedProgram.data.trainings.find((t) => t._id === viewingProgram._id);
          if (found) setViewingProgram(found);
        }
        fetchPrograms();
        if (activeTab === 'my-trainings') fetchMyTrainings();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update participant progress.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Training & Development
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize training programs, enroll workforce members, monitor completion, and track skill development.
          </p>
        </div>

        {isHRAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Training Program
          </button>
        )}
      </div>

      {/* Global Feedback Alert */}
      {feedback.text && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {canManageTraining && (
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'programs'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Training Programs & Enrollment
          </button>
        )}
        <button
          onClick={() => setActiveTab('my-trainings')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'my-trainings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Enrolled Trainings
        </button>
        {canManageTraining && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completion Analytics & Reports
          </button>
        )}
      </div>

      {/* Tab 1: Training Programs & Enrollment (HR & Manager) */}
      {activeTab === 'programs' && canManageTraining && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search training title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {programStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Programs Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading training programs...
            </div>
          ) : trainings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Training Programs</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                No programs match your search or filter. Create a new training program to upskill employees.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trainings.map((prog) => {
                const totalParticipants = prog.participants?.length || 0;
                const completedCount = prog.participants?.filter((p) => p.status === 'Completed').length || 0;

                return (
                  <div
                    key={prog._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                            prog.status
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                          {prog.status}
                        </span>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {prog.department}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{prog.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {prog.description}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Instructor: <strong>{prog.trainer}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(prog.startDate).toLocaleDateString()} -{' '}
                            {new Date(prog.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{prog.location}</span>
                        </div>
                      </div>

                      {/* Enrolled Progress Bar */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Participants ({totalParticipants})</span>
                          <span>{completedCount} Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{
                              width: `${totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-5 py-3 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployeeIds([]);
                          setAssigningProgram(prog);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Enroll Staff
                      </button>

                      <button
                        onClick={() => setViewingProgram(prog)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Roster
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Enrolled Trainings (Employee View) */}
      {activeTab === 'my-trainings' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {user?.name}'s Learning & Development Path
                  </h2>
                  <p className="text-sm text-emerald-200 mt-0.5">
                    Track your curriculum, attendance, completion certifications, and evaluation scores.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10">
                <div>
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Enrolled Programs
                  </p>
                  <p className="text-2xl font-bold mt-0.5">{myTrainings.length}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="text-2xl font-bold mt-0.5">
                    {myTrainings.filter((t) => t.myStatus === 'Completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading your trainings...
            </div>
          ) : myTrainings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Trainings Enrolled</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                You are currently not enrolled in any training programs. Your HR administrator will assign you to upcoming sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTrainings.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                          item.myStatus
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                        {item.myStatus}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{item.title}</h3>
                    </div>
                    {item.myScore > 0 && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Score</span>
                        <p className="text-lg font-bold text-emerald-600">{item.myScore}%</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Instructor:</span>
                      <strong className="text-slate-800">{item.trainer}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Schedule:</span>
                      <strong className="text-slate-800">
                        {new Date(item.startDate).toLocaleDateString()}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Location / Platform:</span>
                      <span className="text-slate-800 truncate block">{item.location}</span>
                    </div>
                  </div>

                  {item.myFeedback && (
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-950">
                      <span className="font-semibold block text-emerald-800 mb-0.5">Your Feedback:</span>
                      "{item.myFeedback}"
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setUpdatingParticipant({
                          programId: item._id,
                          employeeId: user._id,
                          name: user.name,
                        });
                        setParticipantForm({
                          status: item.myStatus || 'In Progress',
                          score: item.myScore || 85,
                          feedback: item.myFeedback || '',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      Update My Progress / Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Completion Analytics & Reports (HR & Manager) */}
      {activeTab === 'reports' && canManageTraining && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          {trainingReports && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Programs
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {trainingReports.summary?.totalPrograms || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Enrolled
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {trainingReports.summary?.totalEnrolled || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Completed
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {trainingReports.summary?.totalCompleted || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Completion Rate
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {trainingReports.summary?.completionRate || 0}%
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Reports Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workforce Training Reports</h3>
                <p className="text-xs text-slate-500">
                  Historical log of organized training modules, participation rates, and employee outcomes.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Training Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Training Program</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4">Enrollment</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingReports?.programs?.map((prog) => {
                    const total = prog.participants?.length || 0;
                    const comp = prog.participants?.filter((p) => p.status === 'Completed').length || 0;
                    return (
                      <tr key={prog._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{prog.title}</td>
                        <td className="px-6 py-4">{prog.department}</td>
                        <td className="px-6 py-4">{prog.trainer}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(prog.startDate).toLocaleDateString()} -{' '}
                          {new Date(prog.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">{comp}</span> / {total} Completed
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                              prog.status
                            )}`}
                          >
                            {prog.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Training Program */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Training Program</h3>
                  <p className="text-xs text-slate-500">
                    Add new professional development workshop or course.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Training Program Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Cloud Architecture & Security"
                  value={newProgramForm.title}
                  onChange={(e) => setNewProgramForm({ ...newProgramForm, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description & Syllabus *
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of curriculum, learning objectives, and prerequisites..."
                  value={newProgramForm.description}
                  onChange={(e) =>
                    setNewProgramForm({ ...newProgramForm, description: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Trainer / Instructor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={newProgramForm.trainer}
                    onChange={(e) => setNewProgramForm({ ...newProgramForm, trainer: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Target Department
                  </label>
                  <select
                    value={newProgramForm.department}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, department: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newProgramForm.startDate}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, startDate: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newProgramForm.endDate}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, endDate: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Location / Conference Room / Virtual URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auditorium B or https://meet.google.com/xyz"
                  value={newProgramForm.location}
                  onChange={(e) => setNewProgramForm({ ...newProgramForm, location: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enroll / Assign Employees */}
      {assigningProgram && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Enroll Employees in Training
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-sm">
                    {assigningProgram.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningProgram(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Select employees from the workforce to enroll in this training session. They will be notified automatically.
              </p>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {employees.map((emp) => {
                  const isAlreadyEnrolled = assigningProgram.participants?.some(
                    (p) => (p.employee?._id || p.employee) === emp._id
                  );
                  const isChecked = selectedEmployeeIds.includes(emp._id);

                  return (
                    <label
                      key={emp._id}
                      className={`flex items-center justify-between p-3 cursor-pointer transition ${
                        isAlreadyEnrolled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={isAlreadyEnrolled}
                          checked={isChecked || isAlreadyEnrolled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds([...selectedEmployeeIds, emp._id]);
                            } else {
                              setSelectedEmployeeIds(
                                selectedEmployeeIds.filter((id) => id !== emp._id)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-tight">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {emp.employeeId} • {emp.department} • {emp.designation}
                          </p>
                        </div>
                      </div>

                      {isAlreadyEnrolled && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Enrolled
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  {selectedEmployeeIds.length} new employee(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigningProgram(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting || selectedEmployeeIds.length === 0}
                    onClick={handleAssignEmployees}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Program Details & Participant Roster */}
      {viewingProgram && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Training Program Roster & Progress
                  </h3>
                  <p className="text-xs text-slate-500">{viewingProgram.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProgram(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Program Details summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Instructor:</span>
                  <span className="font-bold text-slate-900">{viewingProgram.trainer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department:</span>
                  <span className="font-bold text-slate-900">{viewingProgram.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Schedule:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(viewingProgram.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Location:</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {viewingProgram.location}
                  </span>
                </div>
              </div>

              {/* Participants Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Enrolled Participants ({viewingProgram.participants?.length || 0})
                </h4>

                {(!viewingProgram.participants || viewingProgram.participants.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                    No participants currently enrolled.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Feedback</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingProgram.participants.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {p.employee?.name || 'Employee'}
                              <span className="block text-[11px] font-normal text-slate-400">
                                {p.employee?.department} • {p.employee?.employeeId}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(
                                  p.status
                                )}`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {p.score ? `${p.score}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                              {p.feedback || '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setUpdatingParticipant({
                                    programId: viewingProgram._id,
                                    employeeId: p.employee?._id || p.employee,
                                    name: p.employee?.name || 'Employee',
                                  });
                                  setParticipantForm({
                                    status: p.status || 'In Progress',
                                    score: p.score || 85,
                                    feedback: p.feedback || '',
                                  });
                                }}
                                className="text-emerald-600 hover:text-emerald-700 font-semibold"
                              >
                                Edit Progress
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Participant Status & Score */}
      {updatingParticipant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Update Training Progress
              </h3>
              <button
                onClick={() => setUpdatingParticipant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateParticipant} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Participant: <strong className="text-slate-800">{updatingParticipant.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Participation Status
                </label>
                <select
                  value={participantForm.status}
                  onChange={(e) => setParticipantForm({ ...participantForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {participantStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Evaluation Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={participantForm.score}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, score: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Feedback / Assessment Notes
                </label>
                <textarea
                  rows={2}
                  value={participantForm.feedback}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, feedback: e.target.value })
                  }
                  placeholder="Record participant attendance, quiz score, or remarks..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingParticipant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
