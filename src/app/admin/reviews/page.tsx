'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, EyeOff, Eye, Check, Filter, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Image from 'next/image';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInput, setReplyInput] = useState<{ [key: string]: string }>({});

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterHidden, setFilterHidden] = useState('');
  const [filterReplied, setFilterReplied] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [page, sortBy, sortOrder, filterHidden, filterReplied]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}&hidden=${filterHidden}&replied=${filterReplied}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (reviewId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isHidden: !currentStatus })
      });
      if (res.ok) {
        fetchReviews(); // Refresh
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (reviewId: string) => {
    const reply = replyInput[reviewId];
    if (!reply || !reply.trim()) return;

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, adminReply: reply })
      });
      if (res.ok) {
        setReplyInput({ ...replyInput, [reviewId]: '' });
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        <p className="text-gray-500 mt-1">Manage and reply to {totalCount} product reviews.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 w-full">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterHidden}
              onChange={(e) => { setFilterHidden(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="">Visibility: All</option>
              <option value="false">Visible Only</option>
              <option value="true">Hidden Only</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <select 
              value={filterReplied}
              onChange={(e) => { setFilterReplied(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="">Reply Status: All</option>
              <option value="true">Replied</option>
              <option value="false">Needs Reply</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto">
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
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reviews.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No reviews found matching your criteria.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow">
                
                {/* Product & User Info Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
                  {review.product && (
                    <div className="flex items-center gap-3 flex-1 min-w-0 border-r border-slate-200 dark:border-slate-700 pr-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image src={review.product.image || '/placeholder.png'} alt={review.product.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Product</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{review.product.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {review.user && (
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {review.user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{review.user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{review.user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Content & Admin Reply */}
                <div className="flex-1 flex flex-col p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => handleToggleHide(review._id, review.isHidden)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                        review.isHidden 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {review.isHidden ? <><EyeOff className="w-3 h-3" /> Hidden</> : <><Eye className="w-3 h-3" /> Visible</>}
                    </button>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">{review.comment}</p>
                  <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase">{new Date(review.createdAt).toLocaleString()}</p>

                  {/* Admin Reply Section */}
                  <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1.5 mb-2">
                      <MessageSquare className="w-3 h-3" /> Admin Reply
                    </h4>
                    
                    {review.adminReply ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic">"{review.adminReply}"</p>
                        <button 
                          onClick={() => setReplyInput({ ...replyInput, [review._id]: review.adminReply })}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold self-end"
                        >
                          Edit Reply
                        </button>
                      </div>
                    ) : null}

                    {(!review.adminReply || replyInput[review._id] !== undefined) && (
                      <div className="flex flex-col gap-2 mt-2">
                        <textarea
                          placeholder="Type reply..."
                          value={replyInput[review._id] ?? ''}
                          onChange={(e) => setReplyInput({ ...replyInput, [review._id]: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[60px]"
                        />
                        <button 
                          onClick={() => handleSendReply(review._id)}
                          className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Save Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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
    </div>
  );
}
