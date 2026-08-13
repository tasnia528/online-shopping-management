import Link from "next/link";
import Image from "next/image";
import { Truck, ShieldCheck, Clock, ArrowRight, Star, Quote, Eye, ShoppingCart } from "lucide-react";
import connectToDatabase from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import ProductCard from "@/components/ProductCard";
import FallbackImage from "@/components/FallbackImage";

export const dynamic = 'force-dynamic';

export default async function Home() {
  await connectToDatabase();
  
  // Fetch some categories for the homepage
  const categories = await Category.find().limit(4).lean();
  
  // Fetch products for Trending (first 4) and New Arrivals (next 4)
  const allProducts = await Product.find().populate('category', 'name').limit(8).lean();
  
  const featuredProducts = allProducts.slice(0, 4);
  const newArrivals = allProducts.slice(4, 8);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Hero background"
          fill
          style={{ objectFit: 'cover' }}
          priority
          className="z-0 animate-[fade-in_1.5s_ease-out_forwards]"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto animate-[fade-in-up_1s_ease-out_forwards]">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Online Shopping <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Management</span>
          </h1>
          <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-light">
            Curated collections of premium products designed to elevate your everyday lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/products" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 group">
              Shop Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/categories" className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-colors">
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* 2. Featured Categories */}
        <section className="mb-24 animate-[fade-in-up_0.8s_ease-out_forwards]">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Shop by Category</h2>
              <p className="text-slate-500 dark:text-slate-400">Find exactly what you're looking for</p>
            </div>
            <Link href="/categories" className="hidden sm:flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              View All Categories <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category: any) => (
              <Link href={`/products?categoryId=${category._id}`} key={category._id.toString()} className="group relative h-80 overflow-hidden block">
                <FallbackImage 
                  src={category.image} 
                  alt={category.name} 
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-700 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-slate-300 text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    Explore Collection →
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/categories" className="sm:hidden mt-6 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            View All Categories <ArrowRight size={16} className="ml-1" />
          </Link>
        </section>

        {/* 3. Trending Products */}
        <section className="mb-24 animate-[fade-in-up_0.8s_ease-out_forwards]">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Trending Now</h2>
              <p className="text-slate-500 dark:text-slate-400">Our most popular items this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product: any) => {
              const serializedProduct = {
                ...product,
                _id: product._id.toString(),
                category: product.category ? { ...product.category, _id: product.category._id.toString() } : null
              };
              return <ProductCard key={serializedProduct._id} product={serializedProduct} showRating={true} />;
            })}
          </div>
        </section>
      </div>

      {/* 4. Promotional Banner */}
      <section className="w-full bg-slate-900 dark:bg-slate-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 animate-[fade-in-up_0.8s_ease-out_forwards]" style={{ animationDelay: '0.2s' }}>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-indigo-400">Limited Time Offer</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6">Summer Clearance Sale</h3>
            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto md:mx-0">
              Get up to 50% off on selected fashion and electronics. Upgrade your style and tech without breaking the bank.
            </p>
            <Link href="/products" className="inline-block px-8 py-4 bg-white text-slate-900 font-bold uppercase tracking-wider text-sm hover:bg-slate-100 transition-colors">
              Shop The Sale
            </Link>
          </div>
          <div className="flex-1 relative w-full h-64 md:h-96">
             <Image 
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Sale"
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
             />
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* 5. New Arrivals */}
        <section className="mb-24 animate-[fade-in-up_0.8s_ease-out_forwards]">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Arrivals</h2>
            <p className="text-slate-500 dark:text-slate-400">Fresh from the creators to you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product: any) => {
              const serializedProduct = {
                ...product,
                _id: product._id.toString(),
                category: product.category ? { ...product.category, _id: product.category._id.toString() } : null
              };
              return (
                <div key={serializedProduct._id} className="relative">
                  <div className="absolute top-4 left-4 z-20 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-wider pointer-events-none">New</div>
                  <ProductCard product={serializedProduct} />
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Features */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 rounded-full text-slate-900 dark:text-white">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
            <p className="text-slate-500 dark:text-slate-400">Enjoy free worldwide shipping on all orders over $100.</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 md:border-x border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 rounded-full text-slate-900 dark:text-white">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
            <p className="text-slate-500 dark:text-slate-400">Shop with confidence using our 100% secure payment gateway.</p>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 rounded-full text-slate-900 dark:text-white">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
            <p className="text-slate-500 dark:text-slate-400">Our customer service team is always here to help you.</p>
          </div>
        </section>

        {/* 7. Testimonials */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-slate-50 dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 relative">
                <Quote size={40} className="absolute top-4 right-4 text-slate-200 dark:text-slate-800 opacity-50" />
                <div className="flex text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} className="fill-current" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8 italic relative z-10">
                  "I was blown away by the quality of the products and the speed of delivery. This is now my go-to store for everything!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Jane Doe</h4>
                    <p className="text-sm text-slate-500">Verified Buyer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Newsletter */}
        <section className="w-full bg-indigo-600 text-white p-12 sm:p-20 text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join Our Newsletter</h2>
          <p className="text-indigo-100 mb-8 max-w-xl">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered straight to your inbox.
          </p>
          <form className="flex w-full max-w-md flex-col sm:flex-row gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white transition-colors"
              required
            />
            <button type="submit" className="px-8 py-3 bg-white text-indigo-600 font-bold uppercase tracking-wider text-sm hover:bg-slate-100 transition-colors">
              Subscribe
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
