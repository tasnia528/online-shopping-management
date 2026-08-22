import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models/User';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ isChatBlocked: false });
    
    await connectToDatabase();
    const currentUser = await User.findById((session.user as any).id);
    return NextResponse.json({ isChatBlocked: currentUser?.isChatBlocked || false });
  } catch (error) {
    return NextResponse.json({ isChatBlocked: false });
  }
}
