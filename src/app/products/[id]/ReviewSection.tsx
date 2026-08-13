"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, ThumbsUp, Edit2, Trash2, Reply } from "lucide-react";

export default function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Review Form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const requireLogin = () => {
    if (!session) {
      router.push("/signin");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    if (rating === 0) return alert("Please select a rating");
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment })
      });
      if (res.ok) {
        setComment("");
        setRating(5);
        fetchReviews(); // Refresh
      } else {
        alert("Failed to submit review");
      }
    } catch (err) {
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: string, payload?: any) => {
    if (!session) return alert("Please login");
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      alert("Error performing action");
    }
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      alert("Error deleting review");
    }
  };

  if (loading) return <div className="text-center py-10">Loading reviews...</div>;

  return (
    <div id="reviews" className="w-full border-t border-slate-200 dark:border-slate-800 pt-16 mt-16">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center">Customer Reviews</h2>

      <div className="flex flex-col md:flex-row gap-12 mb-16">
        <div className="w-full md:w-1/3">
          <div className="bg-slate-50 dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">Overall Rating</h3>
            <div className="text-5xl font-black mb-4">
              {reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "0.0"}
            </div>
            <div className="flex justify-center text-yellow-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={20} className="fill-current" />
              ))}
            </div>
            <p className="text-sm text-slate-500">Based on {reviews.length} reviews</p>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4">Write a Review</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  type="button" 
                  key={star} 
                  onClick={() => {
                    if (requireLogin()) setRating(star);
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-700'} transition-transform hover:scale-110`}
                >
                  <Star size={28} className="fill-current" />
                </button>
              ))}
            </div>
            <textarea 
              required 
              value={comment} 
              onClick={() => requireLogin()}
              onChange={(e) => setComment(e.target.value)} 
              rows={4} 
              className="w-full p-4 mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all" 
              placeholder="What did you think about this product?"
            ></textarea>
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.length === 0 ? (
          <p className="col-span-full text-center text-slate-500">No reviews yet. Be the first!</p>
        ) : (
          reviews.map((rev) => {
            const isOwner = session && (session.user as any).id === rev.user._id;
            const isAdmin = session && (session.user as any).role === 'admin';
            const hasLiked = session && rev.likes.includes((session.user as any).id);

            return (
              <div key={rev._id} className="bg-slate-50 dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="flex text-yellow-400 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} className={rev.rating >= star ? 'fill-current' : 'text-slate-300 dark:text-slate-700 fill-current'} />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6 italic text-sm flex-1">"{rev.comment}"</p>
                
                {rev.adminReply && (
                  <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500 text-sm">
                    <span className="font-bold block text-indigo-700 dark:text-indigo-400 mb-1">Shoppy Admin:</span>
                    <span className="text-slate-700 dark:text-slate-300">{rev.adminReply}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                      {rev.user?.avatar ? (
                        <img src={rev.user.avatar} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        rev.user?.name?.substring(0,2) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{rev.user?.name || 'Unknown User'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 text-slate-500">
                    <button onClick={() => handleAction(rev._id, 'like')} className={`flex items-center gap-1 text-xs hover:text-indigo-500 transition-colors ${hasLiked ? 'text-indigo-600 font-bold' : ''}`}>
                      <ThumbsUp size={14} /> {rev.likes.length}
                    </button>
                    {isOwner && (
                      <button onClick={() => handleDelete(rev._id)} className="hover:text-red-500 ml-2" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                    {isAdmin && !rev.adminReply && (
                      <button onClick={() => {
                        const reply = prompt("Admin Reply:");
                        if (reply) handleAction(rev._id, 'adminReply', { adminReply: reply });
                      }} className="hover:text-indigo-500 ml-2" title="Reply">
                        <Reply size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
