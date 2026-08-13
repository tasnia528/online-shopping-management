import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Review } from '@/models/Review';
import { auth } from '@/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (body.action === 'like') {
      if (review.likes.includes(userId)) {
        review.likes = review.likes.filter((likeId) => likeId.toString() !== userId.toString());
      } else {
        review.likes.push(userId);
      }
      await review.save();
      return NextResponse.json({ message: 'Like updated' }, { status: 200 });
    }

    if (body.action === 'adminReply') {
      if (role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      review.adminReply = body.adminReply;
      await review.save();
      return NextResponse.json({ message: 'Admin reply added' }, { status: 200 });
    }

    // Default Edit Review
    if (review.user.toString() !== userId.toString()) {
      return NextResponse.json({ message: 'Forbidden: You can only edit your own review' }, { status: 403 });
    }

    if (body.rating) review.rating = body.rating;
    if (body.comment) review.comment = body.comment;

    await review.save();
    return NextResponse.json({ message: 'Review updated' }, { status: 200 });

  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (review.user.toString() !== userId.toString() && role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await Review.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Review deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
