"use client";

import { useSession } from "next-auth/react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import FallbackImage from "@/components/FallbackImage";
import { ShoppingCart, Trash2, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { wishlistItems, removeFromWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/wishlist");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Heart className="text-red-500 fill-current" size={32} /> My Wishlist
        </h1>
        <p className="text-slate-500">Items you've saved for later.</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Heart size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your wishlist is empty</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added any items to your wishlist yet. Explore our products and find something you love!</p>
          <Link href="/products" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlistItems.map((product) => (
            <div key={product._id} className="group flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
              <Link href={`/products/${product._id}`} className="relative h-64 w-full block overflow-hidden bg-white dark:bg-slate-800">
                {product.image ? (
                  <FallbackImage 
                    src={product.image} 
                    alt={product.name || 'Product'} 
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <Link href={`/products/${product._id}`} className="block mb-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                </Link>
                <p className="text-slate-900 dark:text-white font-bold text-xl mb-6">${product.price?.toFixed(2)}</p>
                
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => {
                      const success = addToCart(product);
                      if (success) {
                        removeFromWishlist(product._id);
                      }
                    }}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                  >
                    <ShoppingCart size={18} /> Add
                  </button>
                  <button 
                    onClick={() => removeFromWishlist(product._id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
