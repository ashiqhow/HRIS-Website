import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Clock,
  DollarSign,
  Globe,
  Smile,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Printer,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import api from '../services/api';

const dimensionIcons = {
  'Time Efficiency': Clock,
  'Cost Effectiveness': DollarSign,
  'Data Accuracy & Integrity': ShieldCheck,
  'Accessibility & Uptime': Globe,
  'Employee Satisfaction': Smile,
  'Strategic Decision-Making': TrendingUp,
};

const Effectiveness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEffectiveness = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/effectiveness');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load HRIS effectiveness evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEffectiveness();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-500 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Evaluating HRIS performance metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              HRIS Effectiveness Evaluation
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Systemic audit assessing Time, Cost, Accuracy, Accessibility, Satisfaction, and Decision-Making.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer self-start md:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Executive Evaluation
        </button>
      </div>

      {/* Maturity Index & Score Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {data?.maturityLevel || 'Level 4: Optimized Digital Enterprise HRIS'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Overall HRIS Effectiveness Score
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Based on empirical transaction telemetry, employee survey responses, automated formula accuracy, and management turnaround benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex-shrink-0">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black text-emerald-400">
                {data?.overallScore || 94}
              </span>
              <span className="text-xs text-slate-400 block font-semibold">/ 100 Index</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-left text-xs space-y-1">
              <span className="font-semibold text-emerald-300 block">Status: Optimal</span>
              <span className="text-slate-400 block">Benchmark: &gt;80</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Core Effectiveness Dimensions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Evaluation by Performance Dimensions
          </h2>
          <p className="text-xs text-slate-500">
            Detailed scoring across the 6 core pillars of human resource information systems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.dimensions?.map((dim, idx) => {
            const Icon = dimensionIcons[dim.name] || Award;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {dim.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{dim.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dim.summary}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Score vs Target ({dim.target}):</span>
                    <span className="font-extrabold text-slate-900 text-sm">{dim.score} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {dim.benchmark}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Implementation Challenges & Mitigation Strategies */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Implementation Challenges & Mitigation Strategies
          </h2>
          <p className="text-xs text-slate-500">
            Operational hurdles identified during digital transformation and corrective actions taken
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data?.challenges?.map((c) => (
              <div key={c.id} className="p-5 hover:bg-slate-50/50 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {c.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{c.challenge}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        c.severity === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      Severity: {c.severity}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                      Operational Impact:
                    </span>
                    <p className="text-slate-600">{c.impact}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider mb-0.5">
                      Applied Mitigation Strategy:
                    </span>
                    <p className="text-emerald-950">{c.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Roadmap & Future Improvements */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Strategic Roadmap for Future Improvements
          </h2>
          <p className="text-xs text-slate-500">
            Actionable future enhancements to sustain organizational excellence and workforce agility
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.recommendations?.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {rec.horizon}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      rec.priority === 'High'
                        ? 'bg-rose-50 text-rose-700'
                        : rec.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Priority: {rec.priority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.description}</p>
              </div>

              <div className="pt-2 flex items-center text-xs font-semibold text-indigo-600 gap-1">
                <span>View Engineering Specs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Effectiveness;
