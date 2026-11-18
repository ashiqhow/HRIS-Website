import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = status ? status.toLowerCase() : '';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['approved', 'present', 'active'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['pending', 'late', 'half day', 'pending approval'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['rejected', 'absent', 'suspended'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['inactive', 'on leave'].includes(normalized)) {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
