'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Trash2, Edit, Save, X, Image as ImageIcon, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, PackageOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import Image from 'next/image';

const IMGBB_API_KEY = '3fdb12711764698b3e03e8747c93fe24'; // Provided a free generic key for testing, replace in production with env variable ideally

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Pagination & Filtering State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    category: '',
    image: '',
    isActive: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, sortBy, sortOrder, filterCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(`/api/admin/products?search=${encodeURIComponent(search)}&page=${page}&limit=12&sortBy=${sortBy}&sortOrder=${sortOrder}&category=${filterCategory}`),
        fetch('/api/categories')
      ]);
      const data = await resProd.json();
      const cats = await resCat.json();
      
      if (resProd.ok) {
        setProducts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setProducts([]);
      }
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const body = new FormData();
    body.append('image', file);
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, image: data.data.url });
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Upload error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      try {
        const res = await fetch('/api/admin/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: data }),
        });
        if (res.ok) {
          alert('Products imported successfully!');
          fetchData();
        } else {
          alert('Import failed');
        }
      } catch (error) {
        console.error(error);
        alert('Import error');
      }
    };
    reader.readAsBinaryString(file);
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/admin/products';
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId ? { _id: editingId, ...formData } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        alert('Failed to save');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (product: any) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice || '',
      stock: product.stock,
      category: product.category?._id || '',
      image: product.image,
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', costPrice: '', stock: '', category: categories[0]?._id || '', image: '', isActive: true });
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 mt-1">Manage your catalog of {totalCount} items.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={excelInputRef}
            onChange={handleExcelImport}
          />
          {/* <button 
            onClick={() => excelInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button> */}
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search Products..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300 max-w-[120px] truncate"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newBy, newOrder] = e.target.value.split('-');
                setSortBy(newBy);
                setSortOrder(newOrder);
                setPage(1);
              }}
              className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-desc">Highest Price</option>
              <option value="price-asc">Lowest Price</option>
              <option value="stock-asc">Lowest Stock</option>
              <option value="stock-desc">Highest Stock</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
          <p className="text-slate-500">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <div key={product._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md transition-all group">
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase shadow-sm ${
                    product.isActive !== false ? 'bg-indigo-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {product.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">{product.category?.name || 'Uncategorized'}</p>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1" title={product.name}>{product.name}</h3>
                
                <div className="flex justify-between items-end mt-auto pt-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Price</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">${product.price?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Stock</p>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  onClick={() => openEditModal(product)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(product._id)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Selling Price ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cost Price ($) <span className="text-slate-400 font-normal">- For analytics</span></label>
                  <input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer">
                    Product is Active
                    <p className="text-xs text-slate-500 font-normal mt-1">If unchecked, customers will see "Not Available" and cannot purchase.</p>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Product Image (ImgBB or URL)</label>
                  <div className="flex gap-4">
                    <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="Image URL..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                      {uploadingImage ? 'Uploading...' : <><Upload className="w-4 h-4"/> Upload</>}
                    </button>
                  </div>
                  {formData.image && (
                    <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Image src={formData.image} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                  <Save className="w-4 h-4" /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
