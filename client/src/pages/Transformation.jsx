import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  ShieldCheck,
  Globe,
  Smile,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  Sliders,
  Sparkles,
  Calculator,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import api from '../services/api';

const Transformation = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive ROI Calculator State
  const [headcount, setHeadcount] = useState(50);
  const [adminHourlyRate, setAdminHourlyRate] = useState(30);
  const [paperCostPerEmp, setPaperCostPerEmp] = useState(12);

  // Active pillar tab
  const [activePillar, setActivePillar] = useState('time');

  const fetchTransformationData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/transformation');
      if (res.data.success) {
        setData(res.data);
        if (res.data.activeStaffCount) {
          setHeadcount(res.data.activeStaffCount);
        }
      }
    } catch (err) {
      console.error('Failed to load transformation analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransformationData();
  }, []);

  // Reactive ROI Calculations
  const hoursSavedMonthly = Math.round(headcount * 4.5);
  const monthlyAdminLaborSavings = Math.round(hoursSavedMonthly * adminHourlyRate);
  const monthlyStationerySavings = Math.round(headcount * paperCostPerEmp);
  const totalMonthlySavings = monthlyAdminLaborSavings + monthlyStationerySavings;
  const annualSavings = totalMonthlySavings * 12;

  const currentPillar = data?.pillars?.find((p) => p.id === activePillar) || data?.pillars?.[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Digital Transformation Analysis
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Empirical evaluation comparing traditional manual HR operations with automated HRIS processes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          <Sparkles className="w-4 h-4" />
          <span>Proven 88% Operational Acceleration</span>
        </div>
      </div>

      {/* Top Value Realization Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time Efficiency
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">88% Faster</h3>
            <span className="text-[11px] text-slate-400 font-medium">Across all HR routines</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Annual Cost Savings
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              ${annualSavings.toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Paperless + Overtime savings
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Process Accuracy
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">99.8%</h3>
            <span className="text-[11px] text-purple-600 font-semibold">
              0% Leave overdraws
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workforce Satisfaction
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">92%</h3>
            <span className="text-[11px] text-amber-600 font-semibold">
              Up from 54% manual baseline
            </span>
          </div>
        </div>
      </div>

      {/* Interactive ROI & Savings Simulator */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Interactive Organizational ROI Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Adjust headcount and administrative factors to project annual monetary and labor savings.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full self-start md:self-auto">
            Live Reactive Modeling
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sliders Input Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Headcount Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Total Workforce Headcount:</span>
                <span className="text-indigo-400 font-bold text-sm">{headcount} Employees</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={headcount}
                onChange={(e) => setHeadcount(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>10</span>
                <span>250</span>
                <span>500 Employees</span>
              </div>
            </div>

            {/* Admin Hourly Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Admin Personnel Cost:</span>
                <span className="text-indigo-400 font-bold text-sm">${adminHourlyRate} / hour</span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                step="5"
                value={adminHourlyRate}
                onChange={(e) => setAdminHourlyRate(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$15/hr</span>
                <span>$50/hr</span>
                <span>$100/hr</span>
              </div>
            </div>

            {/* Paper Cost Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Monthly Paper, Slip & Storage Cost per Staff:</span>
                <span className="text-indigo-400 font-bold text-sm">${paperCostPerEmp} / staff</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={paperCostPerEmp}
                onChange={(e) => setPaperCostPerEmp(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$5</span>
                <span>$20</span>
                <span>$40</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Simulated Net Impact
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                ${annualSavings.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">Projected Net Annual Savings</p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Hours Saved:</span>
                <span className="font-bold text-emerald-400">{hoursSavedMonthly} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Labor Savings:</span>
                <span className="font-bold text-white">${monthlyAdminLaborSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Paper Eliminated:</span>
                <span className="font-bold text-white">${monthlyStationerySavings.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
              <span className="text-[11px] font-semibold text-emerald-300">
                Instant ROI • Zero hardware investment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Transformation Pillars Tab Navigation */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Transformation Comparison Across Core HR Pillars
          </h2>
          <p className="text-xs text-slate-500">
            Select a pillar to view side-by-side workflow differences between manual and automated HRIS methods.
          </p>
        </div>

        {/* Pillar Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {data?.pillars?.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePillar(p.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activePillar === p.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>{p.title}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activePillar === p.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.metric}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Pillar Detailed Comparisons */}
        {currentPillar && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{currentPillar.title}</h3>
                <p className="text-xs text-slate-500">{currentPillar.description}</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                {currentPillar.metric}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentPillar.comparisons?.map((c, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition grid grid-cols-1 md:grid-cols-7 gap-4 items-center text-xs"
                >
                  {/* Process Name */}
                  <div className="md:col-span-2">
                    <p className="font-bold text-slate-900 text-sm">{c.process}</p>
                  </div>

                  {/* Manual Way */}
                  <div className="md:col-span-2 p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-rose-950">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-rose-700 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Traditional Manual</span>
                    </div>
                    <p className="font-medium">{c.manual}</p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden md:flex justify-center text-slate-300">
                    <ArrowRight className="w-5 h-5 text-indigo-500" />
                  </div>

                  {/* Automated HRIS */}
                  <div className="md:col-span-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-950">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-700 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Automated HRIS</span>
                    </div>
                    <p className="font-semibold text-emerald-900">{c.automated}</p>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                      ★ {c.reduction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Before vs After Process Workflows Progression */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Workforce Experience & Process Flow Shifts
          </h2>
          <p className="text-xs text-slate-500">
            Evolution from fragmented physical interactions to unified cloud automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Traditional Manual Process */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  Traditional Legacy Experience
                </h4>
                <p className="text-[11px] text-rose-700">Fragmented, physical, error-prone</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>Physical morning queue at paper register books; illegible signatures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>Leave request slips lost on manager desks waiting for pen signatures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>Spreadsheet payroll formulas prone to broken cell references and tax errors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>Employees must visit HR in-person during work hours to request payslips.</span>
              </li>
            </ul>
          </div>

          {/* Automated HRIS Platform */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Modern Enterprise HRIS Platform
                </h4>
                <p className="text-[11px] text-emerald-700">Transparent, instant, audit-ready</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>1-click digital check-in with automatic timestamping and late arrivals tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>Real-time leave balance validation; instant manager approval with notifications.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>Automated payroll calculation formula ($Net = Basic + Allow + Bonus - Ded$).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>24/7 self-service dashboard with instant digital payslip viewer and PDF export.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transformation;
