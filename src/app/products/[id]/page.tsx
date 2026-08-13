import Image from "next/image";
import FallbackImage from "@/components/FallbackImage";
import Link from "next/link";
import { Star, Truck, ShieldCheck, Clock, ArrowLeft } from "lucide-react";
import ProductControls from "./ProductControls";
import ReviewSection from "./ReviewSection";
import connectToDatabase from "@/lib/db";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Invalid Product ID</h1>
        <Link href="/products" className="text-indigo-600 underline">Return to Products</Link>
      </div>
    );
  }

  await connectToDatabase();
  const product = await Product.findById(id).populate("category", "name").lean();

  if (!product) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products" className="text-indigo-600 underline">Return to Products</Link>
      </div>
    );
  }

  const categoryName = (product.category as any)?.name || 'Uncategorized';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <div className="mb-8">
        <Link href="/products" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider">
          <ArrowLeft size={16} className="mr-2" /> Back to Catalog
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        {/* Left Side: Images */}
        <div className="w-full lg:w-1/2">
          <div className="relative w-full aspect-[4/5] bg-slate-100 dark:bg-slate-900 overflow-hidden group">
            <FallbackImage 
              src={product.image} 
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-700 group-hover:scale-105"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-widest">{categoryName}</span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={18} className="fill-current" />
              ))}
            </div>
            <a href="#reviews" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white underline">Reviews</a>
          </div>

          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-8">${product.price.toFixed(2)}</p>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed border-b border-slate-200 dark:border-slate-800 pb-10">
            {product.description}
          </p>

          <p className="text-sm text-slate-500 mb-4">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          
          <ProductControls product={JSON.parse(JSON.stringify(product))} />

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="flex flex-col items-center text-center">
              <Truck className="mb-2 text-slate-400" size={24} />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Free Delivery</span>
              <span className="text-xs text-slate-500">On orders over $50</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="mb-2 text-slate-400" size={24} />
              <span className="text-sm font-bold text-slate-900 dark:text-white">1 Year Warranty</span>
              <span className="text-xs text-slate-500">Guaranteed quality</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Clock className="mb-2 text-slate-400" size={24} />
              <span className="text-sm font-bold text-slate-900 dark:text-white">30 Day Returns</span>
              <span className="text-xs text-slate-500">No questions asked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection productId={product._id.toString()} />
    </div>
  );
}
