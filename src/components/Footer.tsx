"use client";

import Link from "next/link";
import { Globe, MessageCircle, Camera, Video, Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/admin-chat') return null;

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div>
            <Link href="/" className="text-3xl text-indigo-600 dark:text-indigo-400 font-pacifico tracking-wide mb-6 inline-block">
              Shoppy
            </Link>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Your ultimate destination for quality and style. We offer the best products at the most competitive prices, ensuring a seamless shopping experience.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors">
                <Camera size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors">
                <Video size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Links</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link></li>
              <li><Link href="/categories" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Shop Categories</Link></li>
              <li><Link href="/products" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Products</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Special Offers</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Customer Service</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Track Your Order</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Shipping Info</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contact Us</h3>
            <ul className="flex flex-col gap-6">
              <li className="flex items-start gap-3">
                <MapPin className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" size={20} />
                <span className="text-slate-600 dark:text-slate-400">123 Commerce St, Shopping City, SC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                <span className="text-slate-600 dark:text-slate-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
                <span className="text-slate-600 dark:text-slate-400">support@shoppy.com</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-slate-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Shoppy. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Payment icons placeholder */}
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded rounded-sm"></div>
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded rounded-sm"></div>
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded rounded-sm"></div>
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded rounded-sm"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
