import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, ShieldAlert, CheckCircle2, AlertOctagon, FileCheck, Layers } from 'lucide-react';
import { NotificationItem } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { dashboardApi } from '../../services/apiClient';

interface NotificationMenuProps {
  onNavigate: (module: string) => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load live operational work alerts from database
    dashboardApi
      .getStats()
      .then((data) => {
        const notifs: NotificationItem[] = [];
        if (data?.metrics?.pendingApprovalsCount > 0) {
          notifs.push({
            id: 'notif-appr',
            title: 'Committee Approvals Pending',
            message: `${data.metrics.pendingApprovalsCount} loan applications are awaiting credit committee sign-off.`,
            category: 'approval',
            read: false,
            timestamp: new Date().toISOString(),
            targetModule: 'approvals',
          });
        }
        if (data?.metrics?.pendingDisbursementsCount > 0) {
          notifs.push({
            id: 'notif-disb',
            title: 'Disbursements Ready for Action',
            message: `${data.metrics.pendingDisbursementsCount} disbursement batches require authorization.`,
            category: 'disbursement',
            read: false,
            timestamp: new Date().toISOString(),
            targetModule: 'disbursements',
          });
        }
        if (data?.metrics?.totalOverdueAmount > 0) {
          notifs.push({
            id: 'notif-coll',
            title: 'Delinquent Overdue Monitored',
            message: `Overdue exposure of ₹${Number(data.metrics.totalOverdueAmount).toLocaleString('en-IN')} requires collection follow-up.`,
            category: 'collection',
            read: false,
            timestamp: new Date().toISOString(),
            targetModule: 'collections',
          });
        }
        setNotifications(notifs);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    onNavigate(notif.targetModule);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'approval':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'disbursement':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'credit':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'collection':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'system':
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors relative"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden text-left">
          {/* Header */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full tabular-nums">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40 inline-flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded font-medium ${
                filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2 py-0.5 rounded font-medium ${
                filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active notifications in this view
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                    !notif.read ? 'bg-slate-50/50' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getCategoryIcon(notif.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate ${
                          !notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-rose-600 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(notif.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
