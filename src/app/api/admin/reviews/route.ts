import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Review } from '@/models/Review';
import { Notification } from '@/models/Notification';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const filterHidden = searchParams.get('hidden') || '';
    const filterReplied = searchParams.get('replied') || '';

    let query: any = {};
    if (filterHidden === 'true') query.isHidden = true;
    if (filterHidden === 'false') query.isHidden = false;
    if (filterReplied === 'true') query.adminReply = { $exists: true, $ne: '' };
    if (filterReplied === 'false') query.adminReply = { $exists: false }; // Note: In MongoDB, sometimes it's an empty string. The easiest is $in: [null, ''] or $exists: false. We'll use $in: [null, ''] 

    if (filterReplied === 'false') {
      query.adminReply = { $in: [null, ''] };
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email _id')
      .populate('product', 'name image _id')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      data: reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch all reviews error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId, adminReply, isHidden } = await req.json();

    if (!reviewId) {
      return NextResponse.json({ message: 'Missing review ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Create an object with only defined fields (don't overwrite with undefined if they didn't send one of the fields)
    const updateData: any = {};
    if (adminReply !== undefined) updateData.adminReply = adminReply;
    if (isHidden !== undefined) updateData.isHidden = isHidden;

    const updated = await Review.findByIdAndUpdate(reviewId, updateData, { new: true }).populate('user', '_id name').populate('product', 'name');

    if (!updated) {
       return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    // If an admin just replied, notify the user
    if (adminReply !== undefined && adminReply !== '') {
        try {
            await Notification.create({
                user: updated.user._id,
                type: 'review_reply',
                message: `Admin replied to your review on ${(updated.product as any).name}.`,
                link: `/products/${(updated.product as any)._id}`
            });
        } catch (e) {
            console.error('Failed to notify customer of review reply', e);
        }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
