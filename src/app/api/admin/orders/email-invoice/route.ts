import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { transporter, FROM_EMAIL } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { orderId } = await req.json();

    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const itemsHtml = order.items.map((item: any) => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.name || 'Unknown Product'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
      </tr>`
    ).join('');

    const mailOptions = {
      from: `"Store Admin" <${FROM_EMAIL}>`,
      to: (order.user as any).email,
      subject: `Invoice for Order #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #3b82f6; text-align: center;">Order Invoice</h2>
          <p>Dear ${(order.user as any).name},</p>
          <p>Thank you for your purchase! Here are the details of your order:</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right;">
            <h3>Total: $${order.totalAmount.toFixed(2)}</h3>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            If you have any questions, please contact support.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
  }
}
