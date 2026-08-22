"use client";

import Link from "next/link";
import FallbackImage from "./FallbackImage";
import { ShoppingCart, Heart, Eye, Star } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: any;
  viewMode?: "grid4" | "grid3" | "grid2" | "list";
  showRating?: boolean; // For home page where rating is shown
}

export default function ProductCard({ product, viewMode = "grid4", showRating = false }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, items } = useCart();

  const isListMode = viewMode === "list";
  
  const isAvailable = product.isActive !== false;
  const isStockOut = product.stock === 0;
  const isInCart = items.some(item => item.product._id === product._id);

  return (
    <div className={`group ${isListMode ? "flex flex-col sm:flex-row gap-6 bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800" : "flex flex-col"} ${!isAvailable ? 'opacity-50 grayscale-[50%]' : ''}`}>
      <div className={`relative bg-slate-100 dark:bg-slate-900 overflow-hidden ${isListMode ? "w-full sm:w-64 h-48 sm:h-auto flex-shrink-0" : "w-full h-80 mb-4"}`}>
        {/* Status Badges */}
        {!isAvailable ? (
          <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 z-20">NOT AVAILABLE</span>
        ) : isStockOut ? (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 z-20">STOCK OUT</span>
        ) : null}
        
        <Link href={`/products/${product._id}`} className="absolute inset-0 z-0">
          <FallbackImage 
            src={product.image} 
            alt={product.name} 
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        </Link>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
          <button 
            onClick={(e) => {
              e.preventDefault();
              isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product._id);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg ${
              isInWishlist(product._id) 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart size={20} className={isInWishlist(product._id) ? "fill-current" : ""} />
          </button>
          
          {(!isInCart && isAvailable && !isStockOut) && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-all transform translate-y-8 group-hover:translate-y-0 shadow-lg delay-75"
              title="Add to Cart"
            >
              <ShoppingCart size={20} />
            </button>
          )}
          
          <Link 
            href={`/products/${product._id}`}
            className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-all transform translate-y-12 group-hover:translate-y-0 shadow-lg delay-150"
            title="View Details"
          >
            <Eye size={20} />
          </Link>
        </div>
      </div>
      
      <Link href={`/products/${product._id}`} className={`${isListMode ? "flex flex-col justify-center flex-1" : "flex flex-col"}`}>
        <span className="text-xs text-slate-500 mb-1 uppercase tracking-wider block">{product.category?.name || 'Uncategorized'}</span>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h3>
        
        {showRating && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-slate-500 ml-1">(24)</span>
          </div>
        )}

        {isListMode && (
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>
        )}
        <p className="text-slate-900 dark:text-white font-bold text-xl">${product.price.toFixed(2)}</p>
      </Link>
    </div>
  );
}
