import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  UserPlus,
  Users,
  Search,
  Filter,
  Plus,
  Check,
  X,
  Clock,
  Calendar,
  Star,
  MapPin,
  ExternalLink,
  MessageSquare,
  FileText,
  Building2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';

const stages = [
  'All',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

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

const Recruitment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'jobs'

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobDept, setJobDept] = useState('All');
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    department: 'Engineering',
    description: '',
    qualifications: '',
    employmentType: 'Full-time',
    location: 'Headquarters',
    deadline: '',
  });

  // Applicants state
  const [applicants, setApplicants] = useState([]);
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedJobFilter, setSelectedJobFilter] = useState('All');
  const [applicantSearch, setApplicantSearch] = useState('');
  const [showAddApplicantModal, setShowAddApplicantModal] = useState(false);
  const [newApplicantForm, setNewApplicantForm] = useState({
    name: '',
    email: '',
    phone: '',
    job: '',
    experience: '1-3 years',
    coverLetter: '',
  });

  // Candidate review modal state
  const [reviewingCandidate, setReviewingCandidate] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  // Stage change modal state
  const [advancingCandidate, setAdvancingCandidate] = useState(null);
  const [targetStage, setTargetStage] = useState('Shortlisted');
  const [interviewDate, setInterviewDate] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  // Metrics
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const isHRAdmin = user?.role === 'HR Admin' || user?.permissions?.canManageRecruitment;
  const isManager = user?.role === 'Manager';

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (jobDept !== 'All') params.append('department', jobDept);
      if (jobSearch) params.append('search', jobSearch);

      const res = await api.get(`/recruitment/jobs?${params.toString()}`);
      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  // Fetch applicants
  const fetchApplicants = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStage !== 'All') params.append('stage', selectedStage);
      if (selectedJobFilter !== 'All') params.append('job', selectedJobFilter);
      if (applicantSearch) params.append('search', applicantSearch);

      const res = await api.get(`/recruitment/applicants?${params.toString()}`);
      if (res.data.success) {
        setApplicants(res.data.applicants);
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const res = await api.get('/recruitment/metrics');
      if (res.data.success) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchApplicants(), fetchMetrics()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [activeTab, selectedStage, selectedJobFilter, jobDept]);

  // Create Job
  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/recruitment/jobs', newJobForm);
      setFeedbackMsg({ type: 'success', text: 'Job vacancy published successfully!' });
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
      setShowAddJobModal(false);
      setNewJobForm({
        title: '',
        department: 'Engineering',
        description: '',
        qualifications: '',
        employmentType: 'Full-time',
        location: 'Headquarters',
        deadline: '',
      });
      fetchJobs();
      fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  // Create Applicant
  const handleCreateApplicant = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/recruitment/applicants', newApplicantForm);
      setFeedbackMsg({ type: 'success', text: 'Applicant added to hiring pipeline!' });
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
      setShowAddApplicantModal(false);
      setNewApplicantForm({
        name: '',
        email: '',
        phone: '',
        job: '',
        experience: '1-3 years',
        coverLetter: '',
      });
      fetchApplicants();
      fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add applicant');
    } finally {
      setSaving(false);
    }
  };

  // Update candidate stage
  const handleSaveStageChange = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/recruitment/applicants/${advancingCandidate._id}/stage`, {
        stage: targetStage,
        notes: stageNotes,
        interviewDate: targetStage === 'Interview Scheduled' ? interviewDate : undefined,
      });
      setFeedbackMsg({ type: 'success', text: `Candidate advanced to ${targetStage}!` });
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
      setAdvancingCandidate(null);
      fetchApplicants();
      fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update candidate stage');
    } finally {
      setSaving(false);
    }
  };

  // Add review feedback
  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post(`/recruitment/applicants/${reviewingCandidate._id}/reviews`, {
        feedback: feedbackNote,
        rating: feedbackRating,
      });
      setFeedbackMsg({ type: 'success', text: 'Evaluation feedback recorded for candidate!' });
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
      setReviewingCandidate(null);
      setFeedbackNote('');
      fetchApplicants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Selected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Interview Scheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Shortlisted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Recruitment Management System
            </h1>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
              Module 2.1
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Publish job openings, review candidate credentials, schedule interviews, and track applicants across pipeline stages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isHRAdmin && (
            <button
              onClick={() => setShowAddJobModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Briefcase className="w-4 h-4" />
              <span>Post New Vacancy</span>
            </button>
          )}

          <button
            onClick={() => setShowAddApplicantModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Pipeline Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Open Roles</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{metrics.openJobs}</span>
            <span className="text-[10px] text-slate-400">{metrics.totalJobs} total created</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Applied</span>
            <span className="text-2xl font-black text-slate-700 mt-0.5 block">{metrics.pipeline?.Applied || 0}</span>
            <span className="text-[10px] text-slate-400">New submissions</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-amber-600 uppercase block">Under Review</span>
            <span className="text-2xl font-black text-amber-700 mt-0.5 block">{metrics.pipeline?.['Under Review'] || 0}</span>
            <span className="text-[10px] text-slate-400">In screening</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-blue-600 uppercase block">Shortlisted</span>
            <span className="text-2xl font-black text-blue-700 mt-0.5 block">{metrics.pipeline?.Shortlisted || 0}</span>
            <span className="text-[10px] text-slate-400">Qualified profiles</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-purple-600 uppercase block">Interviews</span>
            <span className="text-2xl font-black text-purple-700 mt-0.5 block">{metrics.pipeline?.['Interview Scheduled'] || 0}</span>
            <span className="text-[10px] text-slate-400">Scheduled rounds</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-bold text-emerald-600 uppercase block">Selected</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{metrics.pipeline?.Selected || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Offer stage</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pipeline'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Candidate Pipeline & Review Tracking
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Active Job Vacancies ({jobs.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CANDIDATE PIPELINE TRACKING                                        */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                placeholder="Search candidate name or email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter by Stage & Job */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {stages.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Pipeline Stages' : st}
                  </option>
                ))}
              </select>

              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Jobs</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading candidate pipeline...</div>
            ) : applicants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No candidates in this stage or search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Applied Role & Dept</th>
                      <th className="py-3 px-4">Experience & Details</th>
                      <th className="py-3 px-4">Pipeline Stage</th>
                      <th className="py-3 px-4">Reviews & Feedback</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((cand) => (
                      <tr key={cand._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{cand.name}</p>
                            <p className="text-[11px] text-slate-400">{cand.email}</p>
                            {cand.phone && <p className="text-[10px] text-slate-400 font-mono">{cand.phone}</p>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{cand.job?.title || 'Open Application'}</p>
                          <p className="text-[11px] text-slate-500">{cand.job?.department}</p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-medium text-slate-800 block">{cand.experience}</span>
                          {cand.interviewDate && (
                            <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                              Interview: {new Date(cand.interviewDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStageColor(cand.stage)}`}>
                            {cand.stage}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {cand.reviews && cand.reviews.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {cand.reviews[cand.reviews.length - 1].rating}/5 by {cand.reviews[cand.reviews.length - 1].reviewer?.name || 'Reviewer'}
                              </span>
                              <p className="text-[10px] text-slate-500 italic truncate max-w-xs">
                                "{cand.reviews[cand.reviews.length - 1].feedback}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">No reviews yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setAdvancingCandidate(cand);
                                setTargetStage(cand.stage);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition"
                            >
                              Update Stage
                            </button>

                            <button
                              onClick={() => setReviewingCandidate(cand)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold transition flex items-center gap-1"
                              title="Add Manager Review"
                            >
                              <MessageSquare className="w-3 h-3" /> Review
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
      {/* TAB 2: ACTIVE JOB VACANCIES                                               */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      {job.department}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      job.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{job.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-700">Location:</span> {job.location} • {job.employmentType}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Deadline:</span> {new Date(job.deadline).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Required:</span> {job.qualifications}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg">
                    {job.applicantsCount || 0} Applicants
                  </span>

                  <button
                    onClick={() => {
                      setSelectedJobFilter(job._id);
                      setActiveTab('pipeline');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View Pipeline <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POST NEW JOB OPENING MODAL                                                */}
      {/* ========================================================================= */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Post New Job Vacancy</h3>
              </div>
              <button
                onClick={() => setShowAddJobModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJobForm.title}
                  onChange={(e) => setNewJobForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={newJobForm.department}
                    onChange={(e) => setNewJobForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {departments.filter((d) => d !== 'All').map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Application Deadline</label>
                  <input
                    type="date"
                    required
                    value={newJobForm.deadline}
                    onChange={(e) => setNewJobForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Employment Type</label>
                  <select
                    value={newJobForm.employmentType}
                    onChange={(e) => setNewJobForm((prev) => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={newJobForm.location}
                    onChange={(e) => setNewJobForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Remote / Headquarters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Job Description</label>
                <textarea
                  rows={3}
                  required
                  value={newJobForm.description}
                  onChange={(e) => setNewJobForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Outline responsibilities and project scope..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Required Qualifications</label>
                <textarea
                  rows={2}
                  required
                  value={newJobForm.qualifications}
                  onChange={(e) => setNewJobForm((prev) => ({ ...prev, qualifications: e.target.value }))}
                  placeholder="e.g. 3+ years React, Node.js, REST APIs, Git"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD APPLICANT / CANDIDATE MODAL                                           */}
      {/* ========================================================================= */}
      {showAddApplicantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">Register Candidate</h3>
              </div>
              <button
                onClick={() => setShowAddApplicantModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={newApplicantForm.name}
                  onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newApplicantForm.email}
                  onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="alex@email.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Vacancy</label>
                <select
                  required
                  value={newApplicantForm.job}
                  onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, job: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  <option value="">Select a job vacancy...</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newApplicantForm.phone}
                    onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    value={newApplicantForm.experience}
                    onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g. 4 years"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Cover Letter / Notes</label>
                <textarea
                  rows={2}
                  value={newApplicantForm.coverLetter}
                  onChange={(e) => setNewApplicantForm((prev) => ({ ...prev, coverLetter: e.target.value }))}
                  placeholder="Summary of qualifications and candidate profile..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddApplicantModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {saving ? 'Registering...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPDATE STAGE MODAL                                                        */}
      {/* ========================================================================= */}
      {advancingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Advance Stage: {advancingCandidate.name}
              </h3>
              <button
                onClick={() => setAdvancingCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStageChange} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {stages.filter((s) => s !== 'All').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {targetStage === 'Interview Scheduled' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Interview Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Hiring Notes</label>
                <textarea
                  rows={3}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Add notes about candidate progress..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdvancingCandidate(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD MANAGER FEEDBACK & REVIEW MODAL                                       */}
      {/* ========================================================================= */}
      {reviewingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Candidate Review: {reviewingCandidate.name}
              </h3>
              <button
                onClick={() => setReviewingCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Evaluation Score (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setFeedbackRating(num)}
                      className={`p-2 rounded-xl border flex items-center gap-1 font-bold transition ${
                        feedbackRating >= num
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Manager Review Feedback</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Record your assessment of the candidate's technical skills, cultural fit, and interview performance..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingCandidate(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;
