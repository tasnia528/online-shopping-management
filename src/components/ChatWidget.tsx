'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Image as ImageIcon, Loader2, Maximize2, Minimize2, Check, CheckCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { pusherClient } from '@/lib/pusherClient';

// Cache bust URL by default
const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

const IMGBB_API_KEY = '3fdb12711764698b3e03e8747c93fe24';

const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isCustomer = session?.user && (session.user as any).role !== 'admin';
  const userId = isCustomer ? (session.user as any).id : null;

  // We only poll initially now, rely on Pusher for real-time updates
  const { data: messages = [], mutate } = useSWR(
    isCustomer ? '/api/chat' : null,
    fetcher
  );

  const unreadCount = messages.filter((m: any) => m.sender._id !== userId && !m.isRead).length;

  const { data: statusData, mutate: mutateStatus } = useSWR(
    isCustomer ? '/api/chat/status' : null,
    fetcher
  );
  
  const isChatBlocked = statusData?.isChatBlocked || false;

  // Mark messages as read when opening chat
  useEffect(() => {
    if (isOpen && isCustomer) {
      fetch('/api/chat/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: null }) // Mark all admin messages as read
      }).then(() => mutate());
    }
  }, [isOpen, isCustomer, mutate]);

  // Pusher subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = pusherClient.subscribe(`chat-${userId}`);
    const updatesChannel = pusherClient.subscribe(`user-updates-${userId}`);
    
    channel.bind('new-message', (newMessage: any) => {
      if (newMessage.sender._id === userId) return; // We handle our own messages in sendPayload

      mutate((current: any) => {
        if (!current) return [newMessage];
        if (current.find((m: any) => m._id === newMessage._id)) return current;
        return [...current, newMessage];
      }, false);
      
      // If it's a message from someone else and chat is open, mark as read
      if (newMessage.sender._id !== userId && isOpen) {
        fetch('/api/chat/read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: null })
        }).then(() => mutate());
      }
    });

    channel.bind('messages-read', () => {
      mutate((current: any) => {
        if (!current) return current;
        return current.map((m: any) => ({ ...m, isRead: true }));
      }, false);
    });

    updatesChannel.bind('user-blocked', (data: { isChatBlocked: boolean }) => {
      mutateStatus(data, false);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      updatesChannel.unbind_all();
      updatesChannel.unsubscribe();
    };
  }, [userId, isOpen, mutate, mutateStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (pathname === '/admin-chat' || pathname?.startsWith('/admin')) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const body = new FormData();
    body.append('image', file);
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (data.success) {
        setPendingImage(data.data.url);
      }
    } catch (error) {
      console.error('Image upload failed', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendPayload = async (payload: { content: string, imageUrl?: string | null }) => {
    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: userId, name: session?.user?.name, avatar: (session?.user as any).avatar },
      content: payload.content,
      imageUrl: payload.imageUrl,
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending' // custom local flag
    };

    mutate([...messages, optimisticMessage], false);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, receiverId: null })
      });
      if (!res.ok) {
        mutate((current: any) => (current || []).filter((m: any) => m._id !== tempId), false);
        return;
      }
      const savedMessage = await res.json();
      mutate((current: any) => {
        if (!current) return [savedMessage];
        return current.map((m: any) => m._id === tempId ? savedMessage : m);
      }, false);
    } catch (e) {
      console.error(e);
      mutate((current: any) => (current || []).filter((m: any) => m._id !== tempId), false); // revert on error
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() && !pendingImage) return;

    const msgToSend = inputMsg;
    const imgToSend = pendingImage;
    setInputMsg('');
    setPendingImage(null);
    await sendPayload({ content: msgToSend, imageUrl: imgToSend || null });
  };

  const deleteMessage = async (id: string) => {
    if (id.length < 24) return;
    mutate(messages.filter((m: any) => m._id !== id), false);
    try {
      await fetch(`/api/chat?id=${id}`, { method: 'DELETE' });
      mutate();
    } catch (e) {
      console.error(e);
      mutate();
    }
  };

  if (!isCustomer) return null;

  // Group messages by Date
  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    const label = formatDateLabel(msg.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const windowClasses = isExpanded
    ? `fixed inset-0 w-full h-full bg-white dark:bg-gray-800 flex flex-col z-[100]`
    : `fixed bottom-6 right-6 w-[350px] h-[500px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-transform ${isOpen && !isExpanded ? 'scale-0' : 'scale-100'} z-40`}
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      <div className={windowClasses}>
        <div className={`p-4 bg-blue-600 text-white flex justify-between items-center ${isExpanded ? '' : 'rounded-t-2xl'}`}>
          <div>
            <h3 className="font-bold">Support Chat</h3>
            <p className="text-xs text-blue-100">We typically reply in a few minutes.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-white hover:text-gray-200 transition-colors">
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={() => { setIsOpen(false); setIsExpanded(false); }} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900/50">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-4">How can we help you today?</p>
          ) : (
            Object.keys(groupedMessages).map((dateLabel) => (
              <div key={dateLabel} className="space-y-4">
                <div className="flex justify-center">
                  <span className="text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                    {dateLabel}
                  </span>
                </div>
                {groupedMessages[dateLabel].map((msg: any) => {
                  const isMine = msg.sender._id === userId;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group items-center gap-2`}>
                      {isMine && msg.status !== 'sending' && (
                        <button onClick={() => deleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className={`flex flex-col ${isExpanded ? 'max-w-[50%]' : 'max-w-[85%]'}`}>
                        <div className={`rounded-2xl px-4 py-2 ${
                          isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                        } ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                          {msg.imageUrl && (
                            <div 
                              className="mb-2 rounded-lg overflow-hidden relative cursor-pointer bg-gray-100 dark:bg-gray-800" 
                              style={{ width: '100%', height: '150px' }}
                              onClick={() => setFullscreenImage(msg.imageUrl)}
                            >
                              <img src={msg.imageUrl} alt="Attached Image" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <span className="flex items-center ml-1">
                              {msg.status === 'sending' ? 'Sending...' : (
                                msg.isRead ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={`p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 ${isExpanded ? '' : 'rounded-b-2xl'}`}>
          {isChatBlocked ? (
            <div className="flex items-center justify-center py-2 text-red-500 font-semibold text-sm gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <X className="w-4 h-4" /> You are blocked from sending messages.
            </div>
          ) : (
            <>
              {pendingImage && (
                <div className="mb-3 relative inline-block">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-sm">
                    <Image src={pendingImage} alt="Preview" fill className="object-cover" />
                  </div>
                  <button 
                    onClick={() => setPendingImage(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2 items-end">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploadingImage}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                </button>
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={(!inputMsg.trim() && !pendingImage) || uploadingImage} 
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] aspect-square md:aspect-video flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 z-[201] p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
      )}
    </>
  );
}
