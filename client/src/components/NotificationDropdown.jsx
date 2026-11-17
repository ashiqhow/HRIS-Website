import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Clock, Briefcase, Info, Check, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'leave':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'recruitment':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1 transition"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 6).map((item) => (
            <div
              key={item._id}
              className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                !item.isRead ? 'bg-sky-50/50' : ''
              }`}
              onClick={() => {
                if (!item.isRead) markAsRead(item._id);
              }}
            >
              <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs font-semibold ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {item.message}
                </p>
              </div>
              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-sky-500 self-center flex-shrink-0"></span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 transition w-full py-1"
        >
          View all in Notification Center
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
