import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById((session.user as any).id).select('-passwordHash -verificationCode -resetPasswordToken');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, contactNumber, addresses, avatar } = await req.json();

    await connectToDatabase();

    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (name) user.name = name;
    if (contactNumber) user.contactNumber = contactNumber;
    if (avatar) user.avatar = avatar;
    if (addresses) {
      // Ensure only one primary address
      let primaryCount = 0;
      addresses.forEach((addr: any) => {
        if (addr.isPrimary) primaryCount++;
      });
      
      if (primaryCount > 1) {
        return NextResponse.json({ message: 'Only one primary address is allowed' }, { status: 400 });
      }

      user.addresses = addresses;
    }

    await user.save();

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
