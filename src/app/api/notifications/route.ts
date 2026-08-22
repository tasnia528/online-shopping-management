import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Fetch notifications for 'admin' pool if user is admin, otherwise fetch user specific notifications
    const target = currentUser.role === 'admin' ? 'admin' : currentUser._id;

    const notifications = await Notification.find({ user: target }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Fetch notifications error', error);
    return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    const { notificationId } = await req.json();
    if (!notificationId) {
       // Mark all as read
       const currentUser = await User.findById((session.user as any).id);
       const target = currentUser?.role === 'admin' ? 'admin' : currentUser?._id;
       await Notification.updateMany({ user: target, isRead: false }, { isRead: true });
       return NextResponse.json({ message: 'All marked as read' }, { status: 200 });
    }

    const updated = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update notification error', error);
    return NextResponse.json({ message: 'Error updating notification' }, { status: 500 });
  }
}
