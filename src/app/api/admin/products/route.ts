import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { User } from '@/models/User';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const filterCategory = searchParams.get('category') || '';

    let query: any = {};
    if (filterCategory) {
      query.category = filterCategory;
    }
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const data = await req.json();
    const newProduct = new Product(data);
    await newProduct.save();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { _id, ...data } = await req.json();
    const updated = await Product.findByIdAndUpdate(_id, data, { new: true });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting product' }, { status: 500 });
  }
}
