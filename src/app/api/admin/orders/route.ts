import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { auth } from '@/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const filterStatus = searchParams.get('status') || '';

    let query: any = {};

    if (filterStatus) {
      query.status = filterStatus;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find matching users first for name/email search
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      const orConditions: any[] = [
        { transactionId: searchRegex },
        { user: { $in: userIds } }
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }

      query.$or = orConditions;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image price')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching orders' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { orderId, status } = await req.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    if (existingOrder.status === 'Delivered') {
      return NextResponse.json({ message: 'Cannot update a Delivered order' }, { status: 400 });
    }

    const updates: any = { status };
    if (status === 'Delivered' && existingOrder.paymentMethod === 'cod') {
      updates.paymentStatus = 'completed';
    }

    const updated = await Order.findByIdAndUpdate(orderId, updates, { new: true }).populate('user', 'name email');
    
    // Notify Customer
    if (updated) {
      try {
        await Notification.create({
          user: updated.user._id,
          type: 'order_updated',
          message: `Your order #${updated._id} status is now ${status}.`,
          link: '/dashboard/orders',
        });
      } catch (e) {
        console.error(e);
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating order' }, { status: 500 });
  }
}
