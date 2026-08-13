import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';
import { Category } from '@/models/Category';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    await connectToDatabase();

    // Ensure Category model is registered for populate
    Category.init();

    // Build the query object
    const query: any = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.category = new mongoose.Types.ObjectId(categoryId);
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products,
      pagination: {
        totalItems: totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
