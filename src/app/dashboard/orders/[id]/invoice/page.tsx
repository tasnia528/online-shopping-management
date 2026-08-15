"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function InvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) {
          setOrder(data.order);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Shoppy-Invoice-${order._id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-8 text-center min-h-screen">Loading invoice...</div>;
  if (!order) return <div className="p-8 text-center text-red-500 min-h-screen">Order not found</div>;

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 mb-4 flex justify-end">
         <button 
           onClick={handleDownload} 
           disabled={downloading}
           className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
         >
           {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
           {downloading ? "Generating PDF..." : "Download PDF"}
         </button>
      </div>

      <div ref={invoiceRef} className="bg-white text-black p-8 sm:p-12 font-sans max-w-4xl mx-auto shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-12 border-b pb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black text-indigo-600 mb-2">INVOICE</h1>
            <p className="text-slate-500 font-medium">Order #{order._id}</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-3xl font-bold font-pacifico text-indigo-600">Shoppy</h2>
            <p className="text-slate-500 mt-2">123 E-Commerce St.</p>
            <p className="text-slate-500">Tech City, TC 10101</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mb-12 gap-6">
          <div>
            <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-sm">Bill To:</h3>
            <p className="font-bold text-lg text-slate-900">{order.shippingAddress?.street}</p>
            <p className="text-slate-700">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
            <p className="text-slate-700">{order.shippingAddress?.country}</p>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-sm">Order Details:</h3>
            <p><span className="text-slate-500">Date:</span> <span className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</span></p>
            <p><span className="text-slate-500">Payment Method:</span> <span className="uppercase font-medium text-slate-900">{order.paymentMethod}</span></p>
            <p><span className="text-slate-500">Transaction ID:</span> <span className="font-medium text-slate-900 break-all">{order.transactionId || 'N/A'}</span></p>
          </div>
        </div>

        <table className="w-full mb-8 text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="py-3 font-bold text-slate-800">Item</th>
              <th className="py-3 font-bold text-slate-800 text-center">Qty</th>
              <th className="py-3 font-bold text-slate-800 text-right">Price</th>
              <th className="py-3 font-bold text-slate-800 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-4">
                  <p className="font-bold text-slate-900">{item.product?.name || 'Unknown Product'}</p>
                </td>
                <td className="py-4 text-center font-medium">{item.quantity}</td>
                <td className="py-4 text-right">${item.price.toFixed(2)}</td>
                <td className="py-4 text-right font-bold text-slate-900">${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-bold text-slate-900">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-600">Shipping:</span>
              <span className="font-bold text-green-600">Free</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-600">Paid:</span>
              <span className="font-bold text-green-600">${order.paymentStatus === 'completed' ? order.totalAmount.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-600">Due:</span>
              <span className="font-bold text-red-600">${order.paymentStatus === 'completed' ? '0.00' : order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-slate-400 text-sm mt-12 pt-8 border-t">
          <p>Thank you for shopping with Shoppy!</p>
          <p>If you have any questions about this invoice, please contact support@shoppy.com</p>
        </div>
      </div>
    </div>
  );
}
