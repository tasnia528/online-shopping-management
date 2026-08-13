import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Category } from '@/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
