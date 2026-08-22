import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { Message } from '@/models/Message';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser || currentUser.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const filterRole = searchParams.get('role') || '';

    let query: any = {};
    if (filterRole) {
      query.role = filterRole;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash -verificationCode -resetPasswordToken')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch unread message counts for each user
    const usersWithUnreadCounts = await Promise.all(users.map(async (user) => {
      const unreadMessageCount = await Message.countDocuments({
        sender: user._id,
        isRead: false
      });
      return { ...user.toObject(), unreadMessageCount };
    }));

    return NextResponse.json({
      data: usersWithUnreadCounts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser || currentUser.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { userId, role } = await req.json();
    
    if (userId === currentUser._id.toString()) {
      return NextResponse.json({ message: 'Cannot change own role' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-passwordHash');
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    if (!currentUser || currentUser.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id === currentUser._id.toString()) {
      return NextResponse.json({ message: 'Cannot delete yourself' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
  }
}
