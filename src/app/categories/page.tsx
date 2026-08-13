import Link from "next/link";
import Image from "next/image";
import connectToDatabase from "@/lib/db";
import { Category } from "@/models/Category";
import FallbackImage from "@/components/FallbackImage";

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 }).lean();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Explore Our Collections</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Browse through our curated categories and find exactly what you need to elevate your lifestyle.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category: any) => (
          <Link href={`/products?categoryId=${category._id}`} key={category._id.toString()} className="group relative h-96 w-full block overflow-hidden bg-slate-100 dark:bg-slate-900">
            <FallbackImage 
              src={category.image} 
              alt={category.name} 
              fill
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 transition-opacity group-hover:opacity-100"></div>
            
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <h2 className="text-3xl font-bold text-white mb-2 transform transition-transform group-hover:-translate-y-2">{category.name}</h2>
              {category.description && (
                <p className="text-slate-300 text-sm mb-4 line-clamp-2 transform transition-transform group-hover:-translate-y-2">{category.description}</p>
              )}
              <div className="inline-flex items-center text-sm font-bold text-indigo-400 uppercase tracking-wider transform translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                Shop Collection <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
