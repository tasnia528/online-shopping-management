'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Mail, RefreshCw, CheckCircle, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Package, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, sortBy, sortOrder, filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(search)}&page=${page}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}&status=${filterStatus}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (res.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const downloadInvoice = (order: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Invoice', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Order ID: ${order._id}`, 14, 40);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 48);
    doc.text(`Customer: ${order.user?.name} (${order.user?.email})`, 14, 56);
    
    if (order.transactionId) {
      doc.text(`Transaction ID: ${order.transactionId}`, 14, 64);
    }

    const tableColumn = ["Product", "Quantity", "Price"];
    const tableRows: any[] = [];
    
    order.items.forEach((item: any) => {
      const productData = [
        item.product?.name || 'Unknown',
        item.quantity,
        `$${item.price.toFixed(2)}`
      ];
      tableRows.push(productData);
    });

    (doc as any).autoTable({
      startY: 75,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`, 14, finalY + 15);
    
    doc.save(`invoice_${order._id}.pdf`);
  };

  const emailInvoice = async (orderId: string) => {
    setSendingEmail(orderId);
    try {
      const res = await fetch('/api/admin/orders/email-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        alert('Invoice sent to customer successfully!');
      } else {
        alert('Failed to send invoice email.');
      }
    } catch (e) {
      console.error(e);
      alert('Error sending email.');
    } finally {
      setSendingEmail(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 mt-1">Manage {totalCount} total orders.</p>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search Orders..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
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
              <option value="totalAmount-desc">Highest Amount</option>
              <option value="totalAmount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No orders found</h3>
          <p className="text-slate-500">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {orders.map((order) => (
            <div key={order._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Order ID</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">#{order._id.substring(order._id.length - 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1 flex items-center justify-end gap-1"><Calendar size={12}/> Date</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{order.user?.name}</p>
                    <p className="text-xs text-slate-500">{order.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Total</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Payment:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.paymentStatus} ({order.paymentMethod})
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(order._id, status)}
                        disabled={order.status === 'Delivered'}
                        className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded transition-all ${
                          order.status === status
                            ? status === 'Delivered' ? 'bg-green-500 text-white shadow-sm'
                            : status === 'Cancelled' ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-indigo-600 text-white shadow-sm'
                            : order.status === 'Delivered' 
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed opacity-50'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  title="Download Invoice"
                  onClick={() => downloadInvoice(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                {order.paymentStatus !== 'completed' && (
                  <button 
                    title="Send Payment Reminder"
                    onClick={() => emailInvoice(order._id)}
                    disabled={sendingEmail === order._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sendingEmail === order._id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Mail className="w-4 h-4" /> Reminder</>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
