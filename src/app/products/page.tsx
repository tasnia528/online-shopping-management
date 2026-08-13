"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, ChevronLeft, ChevronRight, Grid3x3, Grid2x2, List as ListIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import ProductCard from "@/components/ProductCard";

function ProductsList() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoryId") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"grid4" | "grid3" | "grid2" | "list">("grid4");

  useEffect(() => {
    // Initial fetch for categories
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Sync state if URL changes directly
    const cat = searchParams.get("categoryId");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    // Fetch products whenever filters or page change
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: "20",
          search: search,
        });

        if (selectedCategory !== "All") {
          queryParams.append("categoryId", selectedCategory);
        }

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, currentPage]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Our Products</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">Discover everything you need in one place.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 rounded-none text-slate-900 dark:text-white"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-slate-400" />
            </div>
            <select 
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full pl-10 pr-8 py-3 bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 rounded-none text-slate-900 dark:text-white appearance-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-500">
        <p>Showing {products.length} of {totalItems} products</p>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded">
          <button 
            onClick={() => setViewMode("grid4")} 
            className={`p-2 rounded transition-colors ${viewMode === "grid4" ? "bg-white dark:bg-black shadow text-indigo-600" : "hover:text-slate-900 dark:hover:text-white"}`}
            title="4 Column Grid"
          >
            <Grid3x3 size={18} />
          </button>
          <button 
            onClick={() => setViewMode("grid2")} 
            className={`p-2 rounded transition-colors ${viewMode === "grid2" ? "bg-white dark:bg-black shadow text-indigo-600" : "hover:text-slate-900 dark:hover:text-white"}`}
            title="2 Column Grid"
          >
            <Grid2x2 size={18} />
          </button>
          <button 
            onClick={() => setViewMode("list")} 
            className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-white dark:bg-black shadow text-indigo-600" : "hover:text-slate-900 dark:hover:text-white"}`}
            title="List View"
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-full py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="w-full py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No products found</h2>
          <p className="text-slate-500">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <>
          <div className={`grid gap-8 mb-16 ${
            viewMode === "grid4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : 
            viewMode === "grid2" ? "grid-cols-1 sm:grid-cols-2" : 
            "grid-cols-1"
          }`}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} viewMode={viewMode} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center font-bold text-sm ${
                      currentPage === i + 1 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function ProductsPageWrapper() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <Suspense fallback={<div className="w-full py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
