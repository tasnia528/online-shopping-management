import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Product } from '@/models/Product';
import { sendInvoiceEmail } from '@/lib/mail';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, paymentMethod, paymentIntentId } = body;

    if (!items || items.length === 0 || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Verify stock and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product}` }, { status: 404 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
      
      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        _productData: product // temporary for invoice
      });
    }

    // No extra fees (matching frontend logic: no tax, free shipping)
    const finalAmount = totalAmount;

    let paymentStatus = 'pending';
    let transactionId = undefined;

    if (paymentMethod === 'stripe') {
      if (!paymentIntentId) {
        return NextResponse.json({ error: 'Missing paymentIntentId for Stripe payment' }, { status: 400 });
      }
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: '2025-01-27.acacia' as any,
      });
      // Verify payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
      }
      paymentStatus = 'completed';
      transactionId = paymentIntent.id;
    }

    // Reduce stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Create Order
    const deliveryEstimate = new Date();
    deliveryEstimate.setDate(deliveryEstimate.getDate() + 5); // 5 days delivery

    const newOrder = new Order({
      user: user._id,
      items: orderItems.map(i => ({ product: i.product, quantity: i.quantity, price: i.price })),
      shippingAddress,
      paymentMethod,
      paymentStatus,
      transactionId,
      totalAmount: finalAmount,
      status: 'Pending',
      deliveryEstimate,
    });

    await newOrder.save();

    // Send Invoice
    const invoiceOrderData = {
      _id: newOrder._id,
      items: orderItems.map(i => ({ product: i._productData, quantity: i.quantity, price: i.price })),
      shippingAddress,
      paymentStatus,
      transactionId,
      totalAmount: finalAmount,
      createdAt: newOrder.createdAt,
      deliveryEstimate: newOrder.deliveryEstimate,
    };

    try {
      await sendInvoiceEmail(user.email, invoiceOrderData, user);
    } catch (mailError) {
      console.error("Failed to send invoice email:", mailError);
    }

    return NextResponse.json({ success: true, orderId: newOrder._id }, { status: 201 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
