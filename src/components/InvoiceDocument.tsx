import React from 'react';

export default function InvoiceDocument({ order }: { order: any }) {
  if (!order) return null;
  return (
    <div className="bg-white text-black p-12 font-sans w-[800px] shadow-sm">
      <div className="flex justify-between items-start mb-12 border-b pb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-indigo-600 mb-2">INVOICE</h1>
          <p className="text-slate-500 font-medium">Order #{order._id}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold font-pacifico text-indigo-600">Shoppy</h2>
          <p className="text-slate-500 mt-2">123 E-Commerce St.</p>
          <p className="text-slate-500">Tech City, TC 10101</p>
        </div>
      </div>

      <div className="flex justify-between mb-12 gap-6">
        <div>
          <h3 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-sm">Bill To:</h3>
          <p className="font-bold text-lg text-slate-900">{order.shippingAddress?.street}</p>
          <p className="text-slate-700">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
          <p className="text-slate-700">{order.shippingAddress?.country}</p>
        </div>
        <div className="text-right">
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
          {order.items?.map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="py-4">
                <p className="font-bold text-slate-900">{item.product?.name || 'Unknown Product'}</p>
              </td>
              <td className="py-4 text-center font-medium">{item.quantity}</td>
              <td className="py-4 text-right">${item.price?.toFixed(2) || '0.00'}</td>
              <td className="py-4 text-right font-bold text-slate-900">${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-bold text-slate-900">${order.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600">Shipping:</span>
            <span className="font-bold text-green-600">Free</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600">Paid:</span>
            <span className="font-bold text-green-600">${order.paymentStatus === 'completed' ? order.totalAmount?.toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-slate-600">Due:</span>
            <span className="font-bold text-red-600">${order.paymentStatus === 'completed' ? '0.00' : order.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-slate-400 text-sm mt-12 pt-8 border-t">
        <p>Thank you for shopping with Shoppy!</p>
        <p>If you have any questions about this invoice, please contact support@shoppy.com</p>
      </div>
    </div>
  );
}
