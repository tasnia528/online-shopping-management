"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { ShoppingCart, Heart, Sun, Moon, Menu, X, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session, status } = useSession();
  const { items, uniqueItemCount, totalPrice, isOpen: isCartOpen, setIsOpen: setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const { wishlistItems } = useWishlist();
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsCartOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        
        {/* Logo */}
        <Link href="/" className="text-3xl text-indigo-600 dark:text-indigo-400 font-pacifico tracking-wide">
          Shoppy
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-600 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          <Link href="/categories" className="text-slate-600 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Categories</Link>
          <Link href="/products" className="text-slate-600 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Products</Link>
        </div>

        {/* Actions (Icons & Auth) */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/dashboard/wishlist" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative flex items-center justify-center p-1">
            <Heart size={22} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <div className="relative" ref={cartRef}>
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)} 
              className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative flex items-center justify-center p-1"
            >
              <ShoppingCart size={22} />
              {uniqueItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {uniqueItemCount}
                </span>
              )}
            </button>
            
            {/* Cart Dropdown */}
            {isCartOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">Shopping Cart</h3>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium">{uniqueItemCount} Items</span>
                </div>
                
                <div className="max-h-80 overflow-y-auto p-4 flex flex-col gap-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-slate-500 text-sm">Your cart is empty.</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.product._id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.product.name}</h4>
                          <div className="flex items-center gap-3 mt-1 mb-1">
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
                              <button 
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >-</button>
                              <span className="text-xs font-bold px-2 border-x border-slate-200 dark:border-slate-700">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >+</button>
                            </div>
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">${(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-slate-400 hover:text-red-500 self-start p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {items.length > 0 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Subtotal</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                    <Link 
                      href="/checkout" 
                      onClick={() => setIsCartOpen(false)}
                      className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold text-sm rounded-lg transition-colors shadow-md shadow-indigo-600/20"
                    >
                      Checkout Now
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 ml-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            ) : status === "authenticated" ? (
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-colors focus:outline-none">
                  {(session.user as any)?.avatar ? (
                    <img src={(session.user as any).avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{session.user?.name?.charAt(0) || "U"}</span>
                  )}
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 rounded-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <LayoutDashboard size={16} className="mr-2" /> Dashboard
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <UserIcon size={16} className="mr-2" /> My Profile
                    </Link>
                    <button onClick={() => { setIsProfileOpen(false); signOut(); }} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
                      <LogOut size={16} className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin" className="px-4 py-2 text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                  Sign In
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 shadow-lg shadow-indigo-600/30 transition-all">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button className="text-slate-600 dark:text-slate-300 relative">
            <ShoppingCart size={24} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-600 dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl py-4 px-4 flex flex-col gap-4">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">Home</Link>
          <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">Categories</Link>
          <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">Products</Link>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-medium text-slate-700 dark:text-slate-200">Theme</span>
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center font-medium rounded-xl border border-slate-200 dark:border-slate-700">
              Sign In
            </Link>
            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center font-medium rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
