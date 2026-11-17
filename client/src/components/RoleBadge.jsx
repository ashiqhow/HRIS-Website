import React from 'react';
import { ShieldCheck, Users, User } from 'lucide-react';

const RoleBadge = ({ role, size = 'sm' }) => {
  const isLg = size === 'lg';

  if (role === 'HR Admin') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full ${isLg ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
        <ShieldCheck className={isLg ? 'w-4 h-4 text-purple-600' : 'w-3.5 h-3.5 text-purple-600'} />
        HR Admin
      </span>
    );
  }

  if (role === 'Manager') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full ${isLg ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
        <Users className={isLg ? 'w-4 h-4 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
        Manager
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full ${isLg ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
      <User className={isLg ? 'w-4 h-4 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
      Employee
    </span>
  );
};

export default RoleBadge;
