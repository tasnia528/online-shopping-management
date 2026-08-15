"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, User, Upload, ChevronDown, ChevronUp } from "lucide-react";
import imageCompression from "browser-image-compression";

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

interface UserProfile {
  name: string;
  avatar: string;
  contactNumber: {
    countryCode: string;
    number: string;
  };
  addresses: Address[];
}

export default function DashboardProfilePage() {
  const { data: session, update } = useSession();

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    avatar: "",
    contactNumber: { countryCode: "+1", number: "" },
    addresses: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 200,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setProfile(prev => ({ ...prev, avatar: base64data }));
        setUploadingImage(false);
      };
    } catch (err) {
      console.error("Error compressing image", err);
      setError("Failed to process image.");
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || "",
          avatar: data.avatar || "",
          contactNumber: data.contactNumber || { countryCode: "+1", number: "" },
          addresses: data.addresses || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated successfully!");
        await update();
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    setProfile(prev => ({
      ...prev,
      addresses: [...prev.addresses, { street: "", city: "", state: "", zipCode: "", country: "", isPrimary: prev.addresses.length === 0 }]
    }));
  };

  const updateAddress = (index: number, field: keyof Address, value: any) => {
    setProfile(prev => {
      const newAddresses = [...prev.addresses];
      if (field === 'isPrimary' && value === true) {
        newAddresses.forEach(a => a.isPrimary = false);
      }
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return { ...prev, addresses: newAddresses };
    });
  };

  const removeAddress = (index: number) => {
    setProfile(prev => {
      const newAddresses = [...prev.addresses];
      newAddresses.splice(index, 1);
      return { ...prev, addresses: newAddresses };
    });
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading profile...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <User className="text-indigo-600" size={28} /> My Profile
        </h1>
        <p className="text-slate-500">Manage your personal information and addresses.</p>
      </div>
      
      <form onSubmit={handleSave} className="space-y-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        
        {/* Personal Details */}
        <section>
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">Personal Details</h2>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm" onClick={() => fileInputRef.current?.click()}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                <span className="text-3xl font-bold text-slate-400 group-hover:opacity-50 transition-opacity">{profile.name?.charAt(0) || "U"}</span>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Upload size={24} className="text-white" />
              </div>
              
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />
              <h3 className="text-sm font-bold mb-1 text-slate-900 dark:text-white">Profile Picture</h3>
              <p className="text-xs text-slate-500 mb-3 max-w-sm">Upload a PNG or JPEG. Image will be automatically resized and compressed.</p>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                Change Avatar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Full Name</label>
              <input type="text" required value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Contact Number</label>
              <div className="flex gap-2">
                <select value={profile.contactNumber.countryCode} onChange={(e) => setProfile({...profile, contactNumber: {...profile.contactNumber, countryCode: e.target.value}})} className="w-32 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium">
                  <option value="+880">🇧🇩 +880 (BD)</option>
                  <option value="+1">🇺🇸 +1 (US/CA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+81">🇯🇵 +81 (JP)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+33">🇫🇷 +33 (FR)</option>
                  <option value="+55">🇧🇷 +55 (BR)</option>
                </select>
                <input type="text" required value={profile.contactNumber.number} onChange={(e) => setProfile({...profile, contactNumber: {...profile.contactNumber, number: e.target.value}})} className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" placeholder="Phone Number" />
              </div>
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section>
          <div 
            onClick={() => setIsAddressesExpanded(!isAddressesExpanded)} 
            className="flex justify-between items-center mb-4 border-b pb-4 border-slate-200 dark:border-slate-800 cursor-pointer group"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Addresses
              <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                 {isAddressesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            </h2>
            <button type="button" onClick={(e) => { e.stopPropagation(); addAddress(); setIsAddressesExpanded(true); }} className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 transition-colors">
              <Plus size={16} className="mr-1" /> Add Address
            </button>
          </div>
          
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isAddressesExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {profile.addresses.length === 0 ? (
              <p className="text-sm text-slate-500 pb-4">No addresses added yet.</p>
            ) : (
              <div className="space-y-6 pb-4">
                {profile.addresses.map((address, index) => (
                  <div key={index} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl relative bg-slate-50 dark:bg-slate-800/50">
                    <div className="absolute top-4 right-4 flex gap-4 items-center">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input type="radio" name="primaryAddress" checked={address.isPrimary} onChange={() => updateAddress(index, 'isPrimary', true)} className="text-indigo-600 focus:ring-indigo-500" />
                        Set Primary
                      </label>
                      <button type="button" onClick={() => removeAddress(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Street</label>
                        <input type="text" required value={address.street} onChange={(e) => updateAddress(index, 'street', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">City</label>
                        <input type="text" required value={address.city} onChange={(e) => updateAddress(index, 'city', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">State / Province</label>
                        <input type="text" required value={address.state} onChange={(e) => updateAddress(index, 'state', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">ZIP / Postal Code</label>
                        <input type="text" required value={address.zipCode} onChange={(e) => updateAddress(index, 'zipCode', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Country</label>
                        <input type="text" required value={address.country} onChange={(e) => updateAddress(index, 'country', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
        {message && <p className="text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">{message}</p>}

        <button type="submit" disabled={saving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 mt-4">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
