import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { User } from '@/models/User';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById((session.user as any).id);
    if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    // Process categories and create products
    const processedProducts = [];
    for (const p of products) {
      let categoryId = p.categoryId;

      // If category name is provided instead of ID, resolve or create it
      if (!categoryId && p.categoryName) {
        let cat = await Category.findOne({ name: p.categoryName });
        if (!cat) {
          cat = await Category.create({ name: p.categoryName, image: 'https://placehold.co/100x100?text=Category' });
        }
        categoryId = cat._id;
      }

      processedProducts.push({
        name: p.name,
        description: p.description,
        price: Number(p.price) || 0,
        costPrice: Number(p.costPrice) || (Number(p.price) * 0.7) || 0,
        image: p.image || 'https://placehold.co/400x400?text=No+Image',
        category: categoryId,
        stock: Number(p.stock) || 0,
      });
    }

    await Product.insertMany(processedProducts);

    return NextResponse.json({ message: `Successfully imported ${processedProducts.length} products` }, { status: 201 });
  } catch (error) {
    console.error('Import error', error);
    return NextResponse.json({ message: 'Error importing products' }, { status: 500 });
  }
}
