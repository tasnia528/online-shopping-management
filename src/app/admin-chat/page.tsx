'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Send, User as UserIcon, Trash2, Search, Image as ImageIcon, Loader2, ArrowLeft, Ban, CheckCircle, X, MoreVertical, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { pusherClient } from '@/lib/pusherClient';
import { Check, CheckCheck } from 'lucide-react';

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


function AdminChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // URL sync for selected user
  const initialUserId = searchParams.get('userId');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId);
  
  const [inputMsg, setInputMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Pagination for users list
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll messages every 2s for real-time feel
  const { data: messages = [], mutate } = useSWR(
    selectedUserId ? `/api/chat?withUserId=${selectedUserId}` : null,
    fetcher
  );

  // Update URL when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      router.replace(`?userId=${selectedUserId}`);
    } else {
      router.replace(`?`);
    }
  }, [selectedUserId, router]);

  // Handle Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setUsers([]);
      setHasMore(true);
      fetchUsers(1, search, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);


  // Mark messages as read when admin opens a chat
  useEffect(() => {
    if (selectedUserId) {
      fetch('/api/chat/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: selectedUserId })
      }).then(() => mutate());
    }
  }, [selectedUserId, mutate]);

  // Pusher subscriptions
  useEffect(() => {
    const adminChannel = pusherClient.subscribe('admin-updates');
    adminChannel.bind('new-message', (newMessage: any) => {
      // Refresh the user list to get the latest unread counts from the server
      // We use a small timeout to ensure the DB has finished saving the message state
      setTimeout(() => {
        fetchUsers(1, search, true);
      }, 500);
    });

    if (selectedUserId) {
      const channel = pusherClient.subscribe(`chat-${selectedUserId}`);
      
      channel.bind('new-message', (newMessage: any) => {
        if (newMessage.sender._id === session?.user?.id) return; // We handle our own messages in sendPayload

        mutate((current: any) => {
          if (!current) return [newMessage];
          if (current.find((m: any) => m._id === newMessage._id)) return current;
          return [...current, newMessage];
        }, false);
        
        // If message is from the customer, mark as read
        if (newMessage.sender._id !== session?.user?.id) {
          fetch('/api/chat/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: selectedUserId })
          }).then(() => mutate());
        }
      });

      channel.bind('messages-read', () => {
        mutate((current: any) => {
          if (!current) return current;
          return current.map((m: any) => ({ ...m, isRead: true }));
        }, false);
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        adminChannel.unbind_all();
        adminChannel.unsubscribe();
      };
    }
    
    return () => {
      adminChannel.unbind_all();
      adminChannel.unsubscribe();
    };
  }, [selectedUserId, mutate, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async (pageNum: number, searchTerm: string, reset: boolean = false) => {
    if (loadingUsers || (!hasMore && !reset)) return;
    
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?limit=20&page=${pageNum}&search=${encodeURIComponent(searchTerm)}&role=customer&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      
      const newUsers = data.data || [];
      
      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(u => u._id));
          const uniqueNew = newUsers.filter((u: any) => !existingIds.has(u._id));
          return [...prev, ...uniqueNew];
        });
      }
      
      if (newUsers.length < 20 || data.page >= data.totalPages) {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50) {
        if (!loadingUsers && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchUsers(nextPage, search);
        }
      }
    }
  };

  const handleUserClick = (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null); // Toggle close
    } else {
      setSelectedUserId(userId);
      // Reset unread count locally
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, unreadMessageCount: 0 } : u));
    }
  };

  const toggleBlockStatus = async (user: any) => {
    setBlockingUserId(user._id);
    try {
      const res = await fetch(`/api/admin/users/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, isChatBlocked: !user.isChatBlocked })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === user._id ? { ...u, isChatBlocked: !u.isChatBlocked } : u));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBlockingUserId(null);
    }
  };

  const clearConversation = async () => {
    if (!selectedUserId) return;
    if (!confirm('Are you sure you want to clear the entire conversation with this customer? This cannot be undone.')) return;
    
    // Optimistically clear the UI
    mutate([], false);
    
    try {
      const res = await fetch(`/api/chat?clearUserId=${selectedUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        mutate();
      } else {
        alert('Failed to clear conversation');
        mutate();
      }
    } catch (e) {
      console.error(e);
      mutate();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUserId) return;

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
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Upload error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendPayload = async (payload: { content: string, imageUrl?: string | null }) => {
    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      content: payload.content,
      imageUrl: payload.imageUrl,
      sender: { _id: (session?.user as any).id, name: session?.user?.name, role: 'admin' },
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    mutate([...messages, optimisticMessage], false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, receiverId: selectedUserId })
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
      mutate((current: any) => (current || []).filter((m: any) => m._id !== tempId), false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMsg.trim() && !pendingImage) || !selectedUserId) return;

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

  const selectedUser = users.find(u => u._id === selectedUserId);

  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    const label = formatDateLabel(msg.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-2 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Chat</h1>
          <p className="text-gray-500 mt-1">Communicate with customers in real-time.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
        {/* User List */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Customers</h3>
              <button 
                onClick={() => fetchUsers(1, search, true)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="Refresh customer list"
              >
                <RefreshCw size={16} className={loadingUsers ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div 
            className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
            ref={listRef}
            onScroll={handleScroll}
          >
            {users.length === 0 && !loadingUsers ? (
              <div className="p-4 text-center text-sm text-gray-500">No customers found.</div>
            ) : (
              users.map(u => (
                <button 
                  key={u._id}
                  onClick={() => handleUserClick(u._id)}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${selectedUserId === u._id ? 'bg-blue-50 dark:bg-gray-800/80' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                    {u.avatar ? <Image src={u.avatar} alt={u.name} fill className="object-cover" /> : <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    {u.isChatBlocked && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <Ban className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {u.name} 
                        {u.isChatBlocked && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold uppercase tracking-wider">Blocked</span>}
                      </p>
                      {u.unreadMessageCount > 0 && selectedUserId !== u._id && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex-shrink-0">
                          {u.unreadMessageCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                </button>
              ))
            )}
            
            {loadingUsers && (
              <div className="p-4 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          {selectedUserId && selectedUser ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                    {selectedUser.avatar ? <Image src={selectedUser.avatar} alt={selectedUser.name} fill className="object-cover" /> : <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                      <button 
                        onClick={() => { toggleBlockStatus(selectedUser); setIsMenuOpen(false); }}
                        disabled={blockingUserId === selectedUser._id}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-70 ${selectedUser.isChatBlocked ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                      >
                        {blockingUserId === selectedUser._id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> {selectedUser.isChatBlocked ? 'Unblocking...' : 'Blocking...'}</>
                        ) : (
                          selectedUser.isChatBlocked ? <><CheckCircle className="w-4 h-4" /> Unblock Chat</> : <><Ban className="w-4 h-4" /> Block Chat</>
                        )}
                      </button>
                      <button 
                        onClick={() => { clearConversation(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onClick={() => setIsMenuOpen(false)}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-center text-gray-500">No messages yet. Send a greeting!</p>
                  </div>
                ) : (
                  Object.keys(groupedMessages).map((dateLabel) => (
                    <div key={dateLabel} className="space-y-4">
                      <div className="flex justify-center">
                        <span className="text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                          {dateLabel}
                        </span>
                      </div>
                      {groupedMessages[dateLabel].map((msg: any) => {
                        const isAdmin = msg.sender.role === 'admin';
                        return (
                          <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} group items-center gap-2`}>
                            {isAdmin && msg.status !== 'sending' && (
                              <button onClick={() => deleteMessage(msg._id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all">
                                <Trash2 size={16} />
                              </button>
                            )}
                            <div className="flex flex-col max-w-[75%]">
                              <div className={`rounded-2xl px-4 py-2 ${
                                isAdmin ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm'
                              } ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                                {msg.imageUrl && (
                                  <div 
                                    className="mb-2 rounded-lg overflow-hidden relative cursor-pointer group bg-gray-100 dark:bg-gray-800" 
                                    style={{ width: '200px', height: '200px' }}
                                    onClick={() => setFullscreenImage(msg.imageUrl)}
                                  >
                                    <img src={msg.imageUrl} alt="Attached Image" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 shadow-sm" />
                                    </div>
                                  </div>
                                )}
                                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <span>{formatTime(msg.createdAt)}</span>
                                {isAdmin && (
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
              
              {/* Message Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                {pendingImage && (
                  <div className="mb-3 relative inline-block">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-sm">
                      <Image src={pendingImage} alt="Preview" fill className="object-cover" />
                    </div>
                    <button 
                      onClick={() => setPendingImage(null)} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={sendMessage} className="flex gap-2 items-end relative">
                  {selectedUser.isChatBlocked && (
                    <div className="absolute inset-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                      <p className="text-red-500 font-bold text-sm">Customer is blocked from chatting.</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingImage || selectedUser.isChatBlocked}
                    className="p-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  </button>
                  <input 
                    type="text" 
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    disabled={selectedUser.isChatBlocked}
                    placeholder="Type your message..." 
                    className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={(!inputMsg.trim() && !pendingImage) || uploadingImage || selectedUser.isChatBlocked} 
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Customer Selected</h3>
              <p>Select a customer from the list to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] aspect-square md:aspect-video flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 z-[101] p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
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
    </div>
  );
}

export default function AdminChat() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <AdminChatContent />
    </Suspense>
  );
}
