import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Building2,
  Calendar,
  Users,
  CreditCard,
  Clock,
  Briefcase,
  Award,
  GraduationCap,
  CalendarDays,
  CheckCircle,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const reportDomains = [
  { id: 'employees', name: 'Employee Information', icon: Users, desc: 'Centralized profiles, salaries & departments' },
  { id: 'attendance', name: 'Attendance & Timesheets', icon: Clock, desc: 'Daily punch logs, work hours & punctuality' },
  { id: 'leaves', name: 'Leave & Balance Audit', icon: CalendarDays, desc: 'Applications, durations & remaining quotas' },
  { id: 'payroll', name: 'Payroll & Compensation', icon: CreditCard, desc: 'Itemized monthly salaries, formulas & net pay' },
  { id: 'recruitment', name: 'Recruitment & ATS', icon: Briefcase, desc: 'Vacancies, candidates & pipeline conversion' },
  { id: 'performance', name: 'Performance Appraisals', icon: Award, desc: 'Scores, goals & rating tier distribution' },
  { id: 'training', name: 'Training & Development', icon: GraduationCap, desc: 'Program rosters & completion records' },
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

const ReportsHub = () => {
  const { user } = useAuth();
  const isHRAdmin = user?.role === 'HR Admin' || user?.permissions?.canManageUsers;
  const isManager = user?.role === 'Manager';

  const [activeType, setActiveType] = useState('employees');
  const [selectedDept, setSelectedDept] = useState(
    !isHRAdmin && isManager ? user?.department : 'All'
  );
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Loaded report data
  const [report, setReport] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Print / PDF Preview Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch Catalog
  const fetchCatalog = async () => {
    try {
      const res = await api.get('/reports/catalog');
      if (res.data.success) {
        setCatalog(res.data.catalog || []);
      }
    } catch (err) {
      console.error('Failed to load reports catalog:', err);
    }
  };

  // Fetch Report Data
  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', activeType);
      if (selectedDept && selectedDept !== 'All') params.append('department', selectedDept);
      if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports/generate?${params.toString()}`);
      if (res.data.success) {
        setReport(res.data.report);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeType, selectedDept, selectedStatus, search, startDate, endDate]);

  // Client-Side CSV Download Generator
  const downloadCSV = () => {
    if (!report || !report.columns || !report.rows) return;

    // Header row
    const headers = report.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');

    // Data rows
    const dataRows = report.rows.map((row) =>
      row.map((val) => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...dataRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `HRIS_${report.type.toUpperCase()}_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reports & Document Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Generate, filter, and export organizational records in PDF or CSV formats across all HR operations.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={loading || !report || report.rows?.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to CSV
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={loading || !report}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / PDF View
          </button>
        </div>
      </div>

      {/* Domain Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {reportDomains.map((domain) => {
          const Icon = domain.icon;
          const isActive = activeType === domain.id;
          return (
            <button
              key={domain.id}
              onClick={() => setActiveType(domain.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {domain.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          {isHRAdmin && (
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
          )}

          {/* Date range filter for Attendance */}
          {activeType === 'attendance' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Summary Cards */}
      {report?.summary && Object.keys(report.summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(report.summary).map(([key, val]) => {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());
            return (
              <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 uppercase font-semibold">{formattedKey}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {typeof val === 'number' && key.toLowerCase().includes('expenditure')
                    ? `$${val.toLocaleString()}`
                    : typeof val === 'number' && key.toLowerCase().includes('rate')
                    ? `${val}%`
                    : val}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{report?.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scope: {report?.departmentScope} • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {report?.rows?.length || 0} Records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Generating report dataset...
          </div>
        ) : !report || report.rows?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No Records Found</h4>
            <p className="text-sm text-slate-400 mt-1">
              No data matches your selected filters for this report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200 uppercase tracking-wider text-slate-500 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  {report.columns?.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.rows?.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 whitespace-nowrap ${
                          cIdx === 0 ? 'font-semibold text-slate-900' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable / PDF Modal Viewer */}
      {showPrintModal && report && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:shadow-none print:w-full print:border-none">
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Official Document Print / PDF Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Document / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formatted Official Document Body */}
            <div className="p-8 space-y-6">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    ENTERPRISE HRIS PORTAL
                  </h1>
                  <p className="text-xs uppercase font-bold tracking-widest text-indigo-600 mt-0.5">
                    Official Executive Report & Audit Dossier
                  </p>
                  <h2 className="text-lg font-bold text-slate-800 mt-2">{report.title}</h2>
                </div>

                <div className="text-right text-xs text-slate-500 space-y-0.5">
                  <p><strong>Generated By:</strong> {report.generatedBy}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                  <p><strong>Department Scope:</strong> {report.departmentScope}</p>
                  <p><strong>Document ID:</strong> DOC-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* Summary KPIs */}
              {report.summary && Object.keys(report.summary).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  {Object.entries(report.summary).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-400 uppercase font-semibold block text-[10px]">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <strong className="text-sm font-bold text-slate-900">{v}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] text-slate-700">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      {report.columns?.map((c, i) => (
                        <th key={i} className="px-3 py-2">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows?.map((r, i) => (
                      <tr key={i} className="even:bg-slate-50/50">
                        {r.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off Section */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Prepared By:</p>
                  <div className="h-10 border-b border-dashed border-slate-300 w-48 mt-2" />
                  <p className="mt-1 font-mono">{report.generatedBy} (Authorized HR Officer)</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <p className="font-semibold text-slate-700">Executive Approval:</p>
                  <div className="h-10 border-b border-dashed border-slate-300 w-48 mt-2" />
                  <p className="mt-1 font-mono">HR Operations Directorate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsHub;
