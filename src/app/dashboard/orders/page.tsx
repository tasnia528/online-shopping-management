"use client";

import { useEffect, useState } from "react";
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, Check, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data.orders || []);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleDownloadInvoice = async (order: any) => {
    setDownloadingOrderId(order._id);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text("Shoppy", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("123 E-Commerce St.", 14, 27);
      doc.text("Tech City, TC 10101", 14, 32);

      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("INVOICE", 150, 20);
      doc.setFontSize(10);
      doc.text(`Order #: ${order._id}`, 150, 27);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 150, 32);

      // Bill To
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Bill To:", 14, 50);
      doc.setFontSize(10);
      doc.text(`${order.shippingAddress?.street}`, 14, 57);
      doc.text(`${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode}`, 14, 62);
      doc.text(`${order.shippingAddress?.country}`, 14, 67);

      // Order Details
      doc.setFontSize(12);
      doc.text("Order Details:", 110, 50);
      doc.setFontSize(10);
      doc.text(`Payment Method: ${(order.paymentMethod || '').toUpperCase()}`, 110, 57);
      doc.text(`Transaction ID: ${order.transactionId || 'N/A'}`, 110, 62);
      doc.text(`Status: ${order.status}`, 110, 67);

      // Items Table
      const tableColumn = ["Item", "Qty", "Price", "Subtotal"];
      const tableRows: any[] = [];

      order.items?.forEach((item: any) => {
        const rowData = [
          item.product?.name || 'Unknown Product',
          item.quantity?.toString() || '0',
          `$${item.price?.toFixed(2) || '0.00'}`,
          `$${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Summary
      const finalY = (doc as any).lastAutoTable.finalY || 80;
      
      doc.setFontSize(10);
      doc.text("Subtotal:", 140, finalY + 10);
      doc.text(`$${order.totalAmount?.toFixed(2) || '0.00'}`, 180, finalY + 10, { align: 'right' });
      
      doc.text("Shipping:", 140, finalY + 17);
      doc.text("Free", 180, finalY + 17, { align: 'right' });
      
      const isCompleted = order.paymentStatus === 'completed';
      const totalAmountStr = `$${order.totalAmount?.toFixed(2) || '0.00'}`;
      const zeroStr = "$0.00";
      
      doc.text("Paid:", 140, finalY + 24);
      doc.text(isCompleted ? totalAmountStr : zeroStr, 180, finalY + 24, { align: 'right' });
      
      doc.text("Due:", 140, finalY + 31);
      doc.setTextColor(220, 38, 38);
      doc.text(isCompleted ? zeroStr : totalAmountStr, 180, finalY + 31, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for shopping with Shoppy!", 105, finalY + 50, { align: 'center' });

      doc.save(`Shoppy-Invoice-${order._id}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to download invoice");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading your orders...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-red-500">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
        <Package className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Orders Yet</h2>
        <p className="text-slate-500 mb-6">You haven't placed any orders. Start shopping to see your history here.</p>
        <Link href="/products" className="inline-block px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={16} className="text-amber-500" />;
      case 'Processing': return <Package size={16} className="text-blue-500" />;
      case 'Shipped': return <Truck size={16} className="text-indigo-500" />;
      case 'Delivered': return <CheckCircle size={16} className="text-green-500" />;
      case 'Cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-slate-500" />;
    }
  };

  const statusList = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const statusIcons = [<Clock size={24} />, <Package size={24} />, <Truck size={24} />, <CheckCircle size={24} />];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Order History</h1>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      
      {orders.map((order: any) => {
        const currentStatusIndex = statusList.indexOf(order.status);
        const isCancelled = order.status === 'Cancelled';
        const isExpanded = !!expandedOrders[order._id];
        
        return (
          <div key={order._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Order Header - ALWAYS VISIBLE */}
            <div 
              onClick={() => toggleOrder(order._id)}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800/80 p-6 flex flex-wrap justify-between items-center gap-4 cursor-pointer transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Order Number</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">#{order._id.substring(order._id.length - 8)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Date Placed</p>
                <p className="text-slate-900 dark:text-white font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Total Amount</p>
                <p className="text-slate-900 dark:text-white font-bold">${order.totalAmount.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>

            {/* EXPANDABLE CONTENT */}
            <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100 border-t border-slate-200 dark:border-slate-800' : 'max-h-0 opacity-0'}`}>
              
              {/* Order Tracking Progress */}
              {!isCancelled && (
                <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
                  <div className="max-w-3xl mx-auto">
                    <div className="relative">
                      {/* Progress bar background line */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 rounded-full z-0"></div>
                      
                      {/* Active progress line */}
                      <div 
                        className="absolute top-1/2 left-0 h-1 bg-indigo-600 transition-all duration-1000 ease-out -translate-y-1/2 rounded-full z-0"
                        style={{ width: `${(Math.max(0, currentStatusIndex) / 3) * 100}%` }}
                      ></div>
                      
                      {/* Icons container */}
                      <div className="relative z-10 flex justify-between w-full">
                        {statusList.map((status, index) => {
                          const isCompleted = index < currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          const isPending = index > currentStatusIndex;
                          
                          return (
                            <div key={status} className="flex flex-col items-center">
                              <div 
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                                  isCompleted ? 'bg-indigo-600 text-white shadow-md' : 
                                  isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-100 dark:ring-indigo-900/50' : 
                                  'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-white dark:border-slate-900'
                                }`}
                              >
                                {isCompleted ? <Check size={24} /> : (
                                  <div className={isCurrent ? 'animate-pulse' : ''}>
                                    {statusIcons[index]}
                                  </div>
                                )}
                              </div>
                              <div className={`mt-3 font-bold text-sm ${
                                isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 
                                isCompleted ? 'text-slate-900 dark:text-white' : 
                                'text-slate-400 dark:text-slate-500'
                              }`}>
                                {status}
                              </div>
                              {isCurrent && (
                                <span className="absolute mt-14 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {order.deliveryEstimate && (
                    <p className="text-sm text-slate-500 mt-10 text-center flex items-center justify-center gap-2">
                      <Truck size={16} /> Estimated Delivery: <span className="font-bold text-slate-900 dark:text-white">{new Date(order.deliveryEstimate).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              )}
              
              {isCancelled && (
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-900/10 text-center">
                  <p className="text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2">
                    <XCircle size={20} /> This order was cancelled.
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                {/* Order Items */}
                <div className="p-6 md:w-2/3 space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Items in this order:</h3>
                  <div className="space-y-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={item.product?.image} alt={item.product?.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <Link href={`/products/${item.product?._id}`} className="font-bold text-lg text-slate-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">
                            {item.product?.name || 'Unknown Product'}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <p>Qty: <span className="font-bold text-slate-900 dark:text-white">{item.quantity}</span></p>
                            <p>Price: <span className="font-bold text-slate-900 dark:text-white">${item.price.toFixed(2)}</span></p>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</p>
                          <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">${(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Footer - Payment Info */}
                <div className="p-6 md:w-1/3 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Payment Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Payment Method</span>
                        <span className="font-bold text-slate-900 dark:text-white uppercase">{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Payment Status</span>
                        <span className={`font-bold uppercase ${order.paymentStatus === 'completed' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Paid Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">${order.paymentStatus === 'completed' ? order.totalAmount.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Due Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">${order.paymentStatus === 'completed' ? '0.00' : order.totalAmount.toFixed(2)}</span>
                      </div>
                      {order.transactionId && (
                        <div className="flex justify-between text-sm flex-col gap-1">
                          <span className="text-slate-500">Transaction ID</span>
                          <span className="text-xs font-mono text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded break-all">{order.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      Customer Info
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-6 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="font-bold text-slate-900 dark:text-white">{order.user?.name || 'Customer'}</p>
                      <p>{order.user?.email}</p>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Shipping Address</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-6 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="font-medium text-slate-900 dark:text-white">{order.shippingAddress?.street}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                      <p>{order.shippingAddress?.country}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleDownloadInvoice(order)} 
                      disabled={downloadingOrderId === order._id}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 shadow-md shadow-indigo-600/20"
                    >
                      {downloadingOrderId === order._id ? (
                        <>Generating PDF...</>
                      ) : (
                        <><FileText size={16} /> Download Invoice</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
