import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const adminUser = await User.findById((session.user as any).id);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId, isChatBlocked } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isChatBlocked },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    try {
      await pusherServer.trigger(`user-updates-${userId}`, 'user-blocked', { isChatBlocked });
    } catch (pusherErr) {
      console.error('Pusher trigger error:', pusherErr);
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating chat block status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
