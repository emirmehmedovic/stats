'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, MessageSquare, UserPlus, RefreshCw, TicketCheck, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';

type NotificationType =
  | 'TICKET_CREATED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_UPDATED'
  | 'TICKET_COMMENTED'
  | 'TICKET_RESOLVED';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  ticketId: string | null;
  ticket: {
    id: string;
    title: string;
    status: string;
  } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=20');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.ticketId) {
      router.push(`/support-tickets/${notification.ticketId}`);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TICKET_CREATED':
        return <Ticket className="w-4 h-4" />;
      case 'TICKET_ASSIGNED':
        return <UserPlus className="w-4 h-4" />;
      case 'TICKET_UPDATED':
        return <RefreshCw className="w-4 h-4" />;
      case 'TICKET_COMMENTED':
        return <MessageSquare className="w-4 h-4" />;
      case 'TICKET_RESOLVED':
        return <TicketCheck className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'TICKET_CREATED':
        return 'text-blue-600 bg-blue-50';
      case 'TICKET_ASSIGNED':
        return 'text-purple-600 bg-purple-50';
      case 'TICKET_UPDATED':
        return 'text-orange-600 bg-orange-50';
      case 'TICKET_COMMENTED':
        return 'text-green-600 bg-green-50';
      case 'TICKET_RESOLVED':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Upravo sada';
    if (diffMins < 60) return `Prije ${diffMins} min`;
    if (diffHours < 24) return `Prije ${diffHours}h`;
    if (diffDays < 7) return `Prije ${diffDays} dana`;
    return date.toLocaleDateString('bs');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 lg:p-3.5 bg-white rounded-full shadow-soft hover:shadow-md transition-all group"
      >
        <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-dark-600 group-hover:text-primary-600" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 lg:top-0 lg:right-0 min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-2 right-2 lg:top-3 lg:right-3.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Notifikacije</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <>
                  <span className="text-sm text-slate-600">{unreadCount} nepročitanih</span>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Označi sve
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm">Učitavam...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nema notifikacija</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  router.push('/support-tickets');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
              >
                Vidi sve tikete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
