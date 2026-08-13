import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';
import { Category } from '@/models/Category'; // Ensure it's imported so it can populate

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findById(id).populate('category', 'name');

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error: any) {
    console.error('Fetch single product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
