import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { pusherServer } from '@/lib/pusher';

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { senderId } = await req.json();
    
    // Determine the query to find unread messages directed to the current user
    let query: any = { isRead: false };
    
    if (currentUser.role === 'admin') {
      // Admin reading messages from a specific customer
      if (!senderId) return NextResponse.json({ message: 'Sender ID required' }, { status: 400 });
      query.sender = senderId;
      query.$or = [{ receiver: currentUser._id }, { receiver: null }];
    } else {
      // Customer reading messages from admins
      query.sender = { $ne: currentUser._id };
      query.receiver = currentUser._id;
    }

    const result = await Message.updateMany(query, { $set: { isRead: true } });

    if (result.modifiedCount > 0) {
      // Trigger a Pusher event to notify the other party that their messages were read
      const chatChannelId = currentUser.role === 'admin' ? senderId : currentUser._id.toString();
      try {
        await pusherServer.trigger(`chat-${chatChannelId}`, 'messages-read', { byUserId: currentUser._id.toString() });
      } catch (pusherErr) {
        console.error('Pusher trigger error:', pusherErr);
      }
    }

    return NextResponse.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount }, { status: 200 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
