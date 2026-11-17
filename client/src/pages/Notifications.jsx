import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  Calendar,
  Clock,
  Briefcase,
  Info,
  Check,
  Send,
  Filter,
  Megaphone,
  X,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const filterTabs = [
  { id: 'all', label: 'All Notifications' },
  { id: 'unread', label: 'Unread Only' },
  { id: 'leave', label: 'Leave Updates' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'general', label: 'Announcements' },
];

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'general',
    targetRole: 'All',
  });
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const canBroadcast =
    user?.role === 'HR Admin' || user?.permissions?.canBroadcastAnnouncements;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'attendance':
        return <Clock className="w-5 h-5 text-emerald-600" />;
      case 'recruitment':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-sky-600" />;
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      await api.post('/notifications/broadcast', broadcastForm);
      setSuccessMsg('Announcement broadcasted successfully to all target recipients!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: '',
        message: '',
        type: 'general',
        targetRole: 'All',
      });
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to broadcast announcement');
    } finally {
      setSending(false);
    }
  };

  // Filter items
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !item.isRead;
    return item.type === activeTab;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Notification Center
            </h1>
            <span className="text-xs bg-sky-100 text-sky-700 font-bold px-2.5 py-0.5 rounded-full">
              Feature #4
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time updates on leave approvals, attendance logs, recruitment alerts, and workplace announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}

          {canBroadcast && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Notice
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-sm">No notifications found</p>
            <p className="text-slate-400 text-xs mt-1">
              You're completely up to date with this category.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item._id}
              className={`p-4 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !item.isRead
                  ? 'bg-white border-sky-300 ring-1 ring-sky-200/50'
                  : 'bg-white/80 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    {!item.isRead && (
                      <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                    {item.isBroadcast && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Announcement
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>
                      {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {item.sender?.name && (
                      <span>• Posted by {item.sender.name} ({item.sender.role})</span>
                    )}
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => markAsRead(item._id)}
                  className="self-end sm:self-center px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* BROADCAST ANNOUNCEMENT MODAL                                              */}
      {/* ========================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Broadcast Workplace Announcement
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Annual Company Offsite / Policy Update"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Notification Category
                  </label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="general">General Announcement</option>
                    <option value="recruitment">Recruitment Update</option>
                    <option value="leave">Leave Policy Notice</option>
                    <option value="attendance">Attendance Policy Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience
                  </label>
                  <select
                    value={broadcastForm.targetRole}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, targetRole: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="All">All Organization Staff</option>
                    <option value="Employee">Employees Only</option>
                    <option value="Manager">Department Managers Only</option>
                    <option value="HR Admin">HR Administrators Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notice Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Type the announcement message here..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Broadcasting...' : 'Broadcast to Recipients'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
