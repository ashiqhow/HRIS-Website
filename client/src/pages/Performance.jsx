import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  FileText,
  Calendar,
  Building2,
  User,
  Eye,
  Printer,
  ChevronRight,
  Target,
  Sparkles,
  BarChart3,
  X,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';

const periods = [
  'All',
  'Annual 2026',
  'Q1 2026',
  'Q2 2026',
  'Q3 2026',
  'Q4 2026',
  'Annual 2025',
];

const ratings = ['All', 'Excellent', 'Very Good', 'Good', 'Needs Improvement'];

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

const getRatingColor = (rating) => {
  switch (rating) {
    case 'Excellent':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Very Good':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Good':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Needs Improvement':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const Performance = () => {
  const { user } = useAuth();
  const canEvaluate = user?.role === 'HR Admin' || user?.role === 'Manager' || user?.permissions?.canManageUsers;

  const [activeTab, setActiveTab] = useState(canEvaluate ? 'workforce' : 'my-appraisals');

  // Workforce evaluations state
  const [evaluations, setEvaluations] = useState([]);
  const [metrics, setMetrics] = useState({
    avgScore: 0,
    ratingDistribution: {
      Excellent: 0,
      'Very Good': 0,
      Good: 0,
      'Needs Improvement': 0,
    },
  });
  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  // Employee's own evaluations state
  const [myAppraisals, setMyAppraisals] = useState([]);

  // Employees list for new evaluation dropdown
  const [employeesList, setEmployeesList] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // New Appraisal Form State
  const [createForm, setCreateForm] = useState({
    employee: '',
    period: 'Annual 2026',
    productivityScore: 85,
    overallScore: 85,
    feedback: '',
    strengths: '',
    areasForImprovement: '',
    goals: [
      {
        goalTitle: 'Core Objective & Deliverables',
        target: 'Meet project milestones with 95%+ quality standards',
        achievementScore: 85,
        comments: 'Consistently delivered assigned sprint tasks on schedule.',
      },
    ],
  });

  // Calculate live preview rating
  const getPreviewRating = (score) => {
    const num = Number(score);
    if (num >= 90) return 'Excellent';
    if (num >= 75) return 'Very Good';
    if (num >= 60) return 'Good';
    return 'Needs Improvement';
  };

  // Fetch workforce evaluations
  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod !== 'All') params.append('period', selectedPeriod);
      if (selectedRating !== 'All') params.append('rating', selectedRating);
      if (selectedDept !== 'All') params.append('department', selectedDept);
      if (search) params.append('search', search);

      const res = await api.get(`/performance?${params.toString()}`);
      if (res.data.success) {
        setEvaluations(res.data.evaluations || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load performance evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee's own appraisals
  const fetchMyAppraisals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/performance/my-appraisals');
      if (res.data.success) {
        setMyAppraisals(res.data.appraisals || []);
      }
    } catch (err) {
      console.error('Failed to load personal appraisals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for evaluation dropdown
  const fetchEmployeesList = async () => {
    try {
      const res = await api.get('/users?status=Active');
      if (res.data.success) {
        setEmployeesList(res.data.users || []);
        if (res.data.users && res.data.users.length > 0 && !createForm.employee) {
          setCreateForm((prev) => ({ ...prev, employee: res.data.users[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch employee options:', err);
    }
  };

  useEffect(() => {
    if (canEvaluate && activeTab === 'workforce') {
      fetchEvaluations();
      fetchEmployeesList();
    } else {
      fetchMyAppraisals();
    }
  }, [activeTab, selectedPeriod, selectedRating, selectedDept, search]);

  // Handle Goal Addition
  const handleAddGoal = () => {
    setCreateForm((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          goalTitle: '',
          target: '',
          achievementScore: 80,
          comments: '',
        },
      ],
    }));
  };

  // Handle Goal Removal
  const handleRemoveGoal = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  // Handle Goal Field Change
  const handleGoalChange = (index, field, value) => {
    setCreateForm((prev) => {
      const updatedGoals = [...prev.goals];
      updatedGoals[index] = {
        ...updatedGoals[index],
        [field]: field === 'achievementScore' ? Number(value) : value,
      };
      return { ...prev, goals: updatedGoals };
    });
  };

  // Submit Evaluation
  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    if (!createForm.employee || !createForm.feedback.trim()) {
      setFeedback({ type: 'error', text: 'Please select an employee and provide evaluation feedback.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: '', text: '' });

      const res = await api.post('/performance', createForm);
      if (res.data.success) {
        setFeedback({ type: 'success', text: 'Performance evaluation completed and recorded!' });
        setShowCreateModal(false);
        // Reset form
        setCreateForm({
          employee: employeesList[0]?._id || '',
          period: 'Annual 2026',
          productivityScore: 85,
          overallScore: 85,
          feedback: '',
          strengths: '',
          areasForImprovement: '',
          goals: [
            {
              goalTitle: 'Core Objective & Deliverables',
              target: 'Meet project milestones with 95%+ quality standards',
              achievementScore: 85,
              comments: '',
            },
          ],
        });
        fetchEvaluations();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit appraisal evaluation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentPreviewRating = getPreviewRating(createForm.overallScore);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Performance Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Digitize employee appraisals, track key performance goals, productivity scores, and evaluation history.
          </p>
        </div>

        {canEvaluate && (
          <button
            onClick={() => {
              fetchEmployeesList();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Performance Appraisal
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

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {canEvaluate && (
          <button
            onClick={() => setActiveTab('workforce')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'workforce'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Workforce Appraisals & Evaluations
          </button>
        )}
        <button
          onClick={() => setActiveTab('my-appraisals')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'my-appraisals'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Performance Appraisals
        </button>
      </div>

      {/* Metric Cards (Workforce view) */}
      {activeTab === 'workforce' && canEvaluate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Org Score
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Excellent (90+)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.ratingDistribution?.Excellent || 0}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Very Good (75-89)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.ratingDistribution?.['Very Good'] || 0}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Needs Improvement (&lt;60)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.ratingDistribution?.['Needs Improvement'] || 0}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Workforce Tab Content */}
      {activeTab === 'workforce' && canEvaluate && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Period Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <Star className="w-3.5 h-3.5 text-slate-400" />
                <span>Rating:</span>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {ratings.map((r) => (
                    <option key={r} value={r}>
                      {r}
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

          {/* Evaluations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading performance evaluations...
              </div>
            ) : evaluations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No Appraisals Found</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  No performance records match your current criteria. Create a new appraisal to begin evaluating team productivity.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Employee</th>
                      <th className="px-6 py-4 font-semibold">Period</th>
                      <th className="px-6 py-4 font-semibold">Reviewer</th>
                      <th className="px-6 py-4 font-semibold">Productivity</th>
                      <th className="px-6 py-4 font-semibold">Overall Score</th>
                      <th className="px-6 py-4 font-semibold">Rating</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluations.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                              {item.employee?.name ? item.employee.name.charAt(0).toUpperCase() : 'E'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {item.employee?.name || 'Unknown Employee'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-slate-400">
                                  {item.employee?.employeeId}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {item.employee?.designation}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{item.period}</span>
                          <p className="text-xs text-slate-400">
                            {new Date(item.evaluationDate || item.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{item.reviewer?.name || 'System'}</p>
                          <p className="text-xs text-slate-400">{item.reviewer?.role}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${Math.min(item.productivityScore || 0, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">
                              {item.productivityScore}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-base font-bold text-slate-900">
                            {item.overallScore}
                          </span>
                          <span className="text-xs text-slate-400"> / 100</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRatingColor(
                              item.rating
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                            {item.rating}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setViewingEvaluation(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Appraisal
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
      )}

      {/* My Performance Appraisals Tab (Employee View) */}
      {activeTab === 'my-appraisals' && (
        <div className="space-y-6">
          {/* Personal Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {user?.name}'s Performance Overview
                  </h2>
                  <p className="text-sm text-slate-300 mt-0.5">
                    {user?.designation} • {user?.department} • {user?.employeeId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Appraisals
                  </p>
                  <p className="text-2xl font-bold mt-0.5">{myAppraisals.length}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Latest Rating
                  </p>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {myAppraisals[0]?.rating || 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Appraisals List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading your appraisals...
            </div>
          ) : myAppraisals.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No Appraisals Yet</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Your performance evaluations will appear here once reviewed by your team manager or HR administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myAppraisals.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{item.period} Appraisal</h3>
                        <p className="text-xs text-slate-400">
                          Evaluated by {item.reviewer?.name || 'Management'} on{' '}
                          {new Date(item.evaluationDate || item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xl font-bold text-slate-900">{item.overallScore}</span>
                        <span className="text-xs text-slate-400"> / 100</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRatingColor(
                          item.rating
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                        {item.rating}
                      </span>
                    </div>
                  </div>

                  {/* Feedback preview */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">
                      Manager Feedback
                    </p>
                    <p className="text-sm text-slate-700 italic">"{item.feedback}"</p>
                  </div>

                  {/* Goals and Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        <strong className="text-slate-800">{item.goals?.length || 0}</strong> Goals Assessed
                      </span>
                      <span>•</span>
                      <span>
                        Productivity Score:{' '}
                        <strong className="text-slate-800">{item.productivityScore}%</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => setViewingEvaluation(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Report & Goals
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Performance Appraisal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    New Employee Performance Appraisal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Establish goals, score productivity, and record manager assessment.
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

            <form onSubmit={handleCreateEvaluation} className="p-6 space-y-6">
              {/* Employee Selection & Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Employee *
                  </label>
                  <select
                    value={createForm.employee}
                    onChange={(e) => setCreateForm({ ...createForm, employee: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {employeesList.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeId} - {emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Evaluation Period *
                  </label>
                  <input
                    type="text"
                    value={createForm.period}
                    onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                    placeholder="e.g. Annual 2026 or Q1 2026"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Scores & Automatic Rating Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Productivity Score (0 - 100): <strong className="text-indigo-600">{createForm.productivityScore}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={createForm.productivityScore}
                      onChange={(e) => setCreateForm({ ...createForm, productivityScore: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Overall Evaluation Score (0 - 100): <strong className="text-indigo-600">{createForm.overallScore} / 100</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={createForm.overallScore}
                      onChange={(e) => setCreateForm({ ...createForm, overallScore: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Rating Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs text-slate-500">
                    System Assigned Category (Auto-Calculated):
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRatingColor(
                      currentPreviewRating
                    )}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                    {currentPreviewRating}
                  </span>
                </div>
              </div>

              {/* Goals Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Performance Goals & Targets</h4>
                    <p className="text-xs text-slate-500">Record specific goals assessed during this period.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Goal
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {createForm.goals.map((g, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 relative space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Goal #{idx + 1}</span>
                        {createForm.goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Goal Title (e.g. Optimize API Latency)"
                          value={g.goalTitle}
                          onChange={(e) => handleGoalChange(idx, 'goalTitle', e.target.value)}
                          required
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Target / Milestone"
                          value={g.target}
                          onChange={(e) => handleGoalChange(idx, 'target', e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 flex-shrink-0">Score:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={g.achievementScore}
                            onChange={(e) => handleGoalChange(idx, 'achievementScore', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Evaluation comments on this goal..."
                        value={g.comments}
                        onChange={(e) => handleGoalChange(idx, 'comments', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback & Qualitative Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Evaluator Feedback & Summary *
                  </label>
                  <textarea
                    rows={3}
                    value={createForm.feedback}
                    onChange={(e) => setCreateForm({ ...createForm, feedback: e.target.value })}
                    required
                    placeholder="Provide an overview of the employee's contributions, consistency, and professional demeanor..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Key Strengths Identified
                    </label>
                    <textarea
                      rows={2}
                      value={createForm.strengths}
                      onChange={(e) => setCreateForm({ ...createForm, strengths: e.target.value })}
                      placeholder="e.g. Strong problem-solving, team mentorship, attention to detail..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Areas For Improvement & Growth
                    </label>
                    <textarea
                      rows={2}
                      value={createForm.areasForImprovement}
                      onChange={(e) => setCreateForm({ ...createForm, areasForImprovement: e.target.value })}
                      placeholder="e.g. Proactive communication in standups, documentation hygiene..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Appraisal...' : 'Complete & Record Appraisal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Appraisal Details Modal */}
      {viewingEvaluation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 print:m-0 print:shadow-none print:w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Performance Appraisal Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setViewingEvaluation(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Appraisal Document Body */}
            <div className="p-8 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-widest text-indigo-600">
                    HRIS Appraisal Dossier
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {viewingEvaluation.employee?.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {viewingEvaluation.employee?.designation} • {viewingEvaluation.employee?.department} (ID: {viewingEvaluation.employee?.employeeId})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold border ${getRatingColor(
                      viewingEvaluation.rating
                    )}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current mr-2" />
                    {viewingEvaluation.rating}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Evaluation Period: {viewingEvaluation.period}
                  </p>
                </div>
              </div>

              {/* Score Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Overall Score</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {viewingEvaluation.overallScore} <span className="text-xs text-slate-400">/ 100</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Productivity Score</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {viewingEvaluation.productivityScore}%
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Reviewer</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {viewingEvaluation.reviewer?.name || 'Authorized Lead'}
                  </p>
                  <p className="text-[11px] text-slate-400">{viewingEvaluation.reviewer?.role}</p>
                </div>
              </div>

              {/* Evaluator Feedback */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Manager Appraisal & Qualitative Summary
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  {viewingEvaluation.feedback}
                </div>
              </div>

              {/* Goals Table */}
              {viewingEvaluation.goals && viewingEvaluation.goals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Assessed Performance Goals
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Goal Objective</th>
                          <th className="px-4 py-3">Target</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingEvaluation.goals.map((g, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{g.goalTitle}</td>
                            <td className="px-4 py-3 text-slate-500">{g.target || '—'}</td>
                            <td className="px-4 py-3 font-bold text-indigo-600">{g.achievementScore}%</td>
                            <td className="px-4 py-3 text-slate-600">{g.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Identified Strengths
                  </p>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {viewingEvaluation.strengths || 'Consistent reliability and task execution.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Areas for Growth & Improvement
                  </p>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    {viewingEvaluation.areasForImprovement || 'Continue building cross-functional leadership.'}
                  </p>
                </div>
              </div>

              {/* Sign-off Footer */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>Evaluation Date: {new Date(viewingEvaluation.evaluationDate || viewingEvaluation.createdAt).toLocaleDateString()}</span>
                <span>Digitally Verified by HRIS Performance Management Suite</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
