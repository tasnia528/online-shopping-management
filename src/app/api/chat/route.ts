import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { auth } from '@/auth';
import { pusherServer } from '@/lib/pusher';

// GET messages
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('withUserId'); // Used by admin to fetch specific chat

    let query: any = {};

    if (currentUser.role === 'admin') {
      if (withUserId) {
        query = {
          $or: [
            { sender: withUserId },
            { receiver: withUserId }
          ]
        };
      } else {
        // Just return latest conversations
        return NextResponse.json([], { status: 200 });
      }
    } else {
      // Customer fetching their own chat
      query = {
        $or: [
          { sender: currentUser._id },
          { receiver: currentUser._id }
        ]
      };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).populate('sender', 'name role avatar');
    return NextResponse.json(messages, { status: 200 });

  } catch (error) {
    console.error('Chat error', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new message
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const { content, receiverId, imageUrl } = await req.json();

    if (currentUser.isChatBlocked) {
      return NextResponse.json({ message: 'You have been blocked from sending messages' }, { status: 403 });
    }

    if (!content && !imageUrl) return NextResponse.json({ message: 'Content or image required' }, { status: 400 });

    const newMessage = new Message({
      sender: currentUser._id,
      content: content || undefined,
      imageUrl: imageUrl || undefined,
      // If admin, send to specific user. If user, send to admin (receiver = null or admin id)
      receiver: currentUser.role === 'admin' ? receiverId : null 
    });

    await newMessage.save();
    await newMessage.populate('sender', 'name role avatar');

    const chatChannelId = currentUser.role === 'admin' ? receiverId : currentUser._id.toString();
    try {
      await pusherServer.trigger(`chat-${chatChannelId}`, 'new-message', newMessage);
      await pusherServer.trigger('admin-updates', 'new-message', newMessage);
    } catch (pusherErr) {
      console.error('Pusher trigger error:', pusherErr);
    }

    // Notify admin if message is from a customer
    if (currentUser.role !== 'admin') {
      try {
        const notif = await Notification.create({
          user: 'admin', // Special marker for admin-wide notifications
          type: 'new_message',
          message: `New message from ${currentUser.name}: ${content.substring(0, 50)}...`,
          link: '/admin-chat',
        });
        await pusherServer.trigger('admin-updates', 'new-notification', notif);
      } catch (e) {
        console.error('Failed to create chat notification', e);
      }
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json({ message: 'Error sending message', error: error.message, stack: error.stack }, { status: 500 });
  }
}

// DELETE a message or clear conversation
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');
    const clearUserId = searchParams.get('clearUserId');

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    if (clearUserId) {
      if (currentUser.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      
      await Message.deleteMany({
        $or: [
          { sender: clearUserId },
          { receiver: clearUserId }
        ]
      });
      return NextResponse.json({ message: 'Conversation cleared' }, { status: 200 });
    }

    if (!messageId) return NextResponse.json({ message: 'Message ID or clearUserId required' }, { status: 400 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    // Only allow deletion if the sender is the current user
    if (message.sender.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);
    
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting message' }, { status: 500 });
  }
}
