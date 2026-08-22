'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import useSWR from 'swr';
import { pusherClient } from '@/lib/pusherClient';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll every 5 seconds for "real-time" notifications
  const { data: notifications = [], mutate } = useSWR(
    session?.user ? '/api/notifications' : null, 
    fetcher, 
    {}
  );


  useEffect(() => {
    if (!session?.user || (session.user as any).role !== 'admin') return;
    
    const adminChannel = pusherClient.subscribe('admin-updates');
    adminChannel.bind('new-notification', (notif: any) => {
      mutate((current: any) => {
        if (!current) return [notif];
        if (current.find((n: any) => n._id === notif._id)) return current;
        return [notif, ...current];
      }, false);
    });
    return () => {
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
    };
  }, [session?.user, mutate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const groupNotificationsByDate = (notifs: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    notifs.forEach(notif => {
      const date = new Date(notif.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateString = '';
      if (date.toDateString() === today.toDateString()) {
        dateString = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Yesterday';
      } else {
        dateString = date.toLocaleDateString();
      }
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(notif);
    });
    
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      mutate(); // Optimistic UI update
    } catch (e) {
      console.error(e);
    }
  };

  if (!session?.user || (session.user as any).role !== 'admin') return null;

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && unreadCount > 0) {
      // Optimistically clear the local unread count immediately by marking all as read in cache
      mutate(notifications.map((n: any) => ({ ...n, isRead: true })), false);
      markAsRead();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle} 
        className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2 flex flex-col">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">No notifications yet.</p>
              </div>
            ) : (
              Object.keys(groupedNotifications).map((date) => (
                <div key={date} className="mb-4">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 py-1 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{date}</span>
                  </div>
                  {groupedNotifications[date].map((notif: any) => (
                    <div 
                      key={notif._id} 
                      className={`p-3 rounded-lg mb-1 transition-colors flex justify-between items-start ${notif.isRead ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-blue-50/50 dark:bg-indigo-900/20 border-l-2 border-indigo-500'}`}
                    >
                      <div className="flex-1 pr-2">
                        <p className={`text-sm ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-medium'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                          {notif.link && (
                            <Link href={notif.link} className="text-[10px] text-indigo-500 hover:underline">
                              View details
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button onClick={() => markAsRead(notif._id)} title="Mark as read" className="text-slate-400 hover:text-indigo-500">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
