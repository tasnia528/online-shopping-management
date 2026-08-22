'use client';

import { useState, useEffect } from 'react';
import { Mail, Trash2, Shield, User as UserIcon, X, Send, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, Users } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <p className="text-sm text-gray-500">Loading editor...</p> });

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Pagination & Filtering State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterRole, setFilterRole] = useState('');

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, sortBy, sortOrder, filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}&role=${filterRole}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) fetchUsers();
      else alert('Failed to update role. Cannot change your own role.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else alert('Failed to delete user.');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectUser = (id: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u._id)));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const res = await fetch('/api/admin/users/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          subject: emailSubject,
          body: emailBody
        })
      });
      if (res.ok) {
        alert('Emails sent successfully!');
        setIsEmailModalOpen(false);
        setSelectedUsers(new Set());
        setEmailSubject('');
        setEmailBody('');
      } else {
        alert('Failed to send emails.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 mt-1">Manage {totalCount} total users and communications.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEmailModalOpen(true)}
            disabled={selectedUsers.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Mail className="w-4 h-4" /> Email Selected ({selectedUsers.size})
          </button>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0 flex items-center gap-2">
          <div className="flex items-center justify-center p-2">
            <input 
              title="Select all"
              type="checkbox" 
              className="rounded border-slate-300 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
              checked={users.length > 0 && selectedUsers.size === users.length}
              onChange={toggleSelectAll}
            />
          </div>
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search Users by Name or Email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newBy, newOrder] = e.target.value.split('-');
                setSortBy(newBy);
                setSortOrder(newOrder);
                setPage(1);
              }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
          <p className="text-slate-500">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {users.map((u) => (
            <div 
              key={u._id} 
              className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border ${selectedUsers.has(u._id) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'} overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer`}
              onClick={() => toggleSelectUser(u._id)}
            >
              <div className="p-5 flex-1 flex flex-col items-center text-center relative">
                <div className="absolute top-4 left-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    checked={selectedUsers.has(u._id)}
                    readOnly
                  />
                </div>
                
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center mb-4 shadow-inner">
                  {u.avatar ? (
                    <Image src={u.avatar} alt={u.name} fill className="object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1">{u.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-1">{u.email}</p>
                
                <div className="mt-auto w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Joined</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className={`text-xs rounded-lg px-2 py-1 font-bold border-0 focus:ring-2 appearance-none text-center ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  title="Delete User"
                  onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Email to {selectedUsers.size} User(s)</h2>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input 
                  required 
                  type="text" 
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="e.g., Important Account Update" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Message (HTML supported)</label>
                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800 [&_.ql-toolbar]:border-slate-300 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-container]:border-slate-300 dark:[&_.ql-container]:border-slate-700 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-editor]:text-white">
                  <ReactQuill 
                    theme="snow" 
                    value={emailBody} 
                    onChange={setEmailBody} 
                    style={{ height: '200px', marginBottom: '45px' }}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button disabled={sendingEmail} type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 shadow-sm transition-all hover:shadow-md">
                  {sendingEmail ? 'Sending...' : <><Send className="w-4 h-4" /> Send Email</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
