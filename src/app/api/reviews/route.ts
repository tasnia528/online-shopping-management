import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Review } from '@/models/Review';
import { auth } from '@/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }

    await connectToDatabase();

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name _id')
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId, rating, comment } = await req.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const newReview = new Review({
      product: productId,
      user: (session.user as any).id,
      rating,
      comment,
      likes: [],
    });

    await newReview.save();

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
