import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CalendarDays,
  Clock,
  Bell,
  UserCog,
  X,
  LogOut,
  Building2,
  Briefcase,
  CreditCard,
  Award,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RoleBadge from './RoleBadge';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const isHRAdmin = user?.role === 'HR Admin';
  const isManager = user?.role === 'Manager';

  const navItems = [
    {
      label: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      label: 'Employee Directory',
      to: '/users',
      icon: ShieldCheck,
      badge: 'HR Only',
      visible: isHRAdmin || (isManager && user?.permissions?.canManageUsers),
    },
    {
      label: 'Attendance Tracking',
      to: '/attendance',
      icon: Clock,
      badge: null,
      visible: true,
    },
    {
      label: 'Leaves & Time Off',
      to: '/leaves',
      icon: CalendarDays,
      badge: null,
      visible: true,
    },
    {
      label: 'Recruitment & ATS',
      to: '/recruitment',
      icon: Briefcase,
      badge: isHRAdmin || isManager ? 'Active' : null,
      visible: isHRAdmin || isManager,
    },
    {
      label: 'Payroll & Payslips',
      to: '/payroll',
      icon: CreditCard,
      badge: null,
      visible: true,
    },
    {
      label: 'Performance Reviews',
      to: '/performance',
      icon: Award,
      badge: null,
      visible: true,
    },
    {
      label: 'Training & Skills',
      to: '/training',
      icon: GraduationCap,
      badge: null,
      visible: true,
    },
    {
      label: 'Notification Center',
      to: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-red-500 text-white',
      visible: true,
    },
    {
      label: 'Profile Management',
      to: '/profile',
      icon: UserCog,
      badge: null,
      visible: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-300 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-wide">
              HRIS Navigation
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] text-slate-400 truncate">{user?.department}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <RoleBadge role={user?.role} size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">{user?.employeeId}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
