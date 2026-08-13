"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

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
        if (profile.avatar) {
          await update({ avatar: profile.avatar });
        }
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
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">My Profile</h1>
      
      <form onSubmit={handleSave} className="space-y-8 bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        
        {/* Personal Details */}
        <section>
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">Personal Details</h2>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-slate-400">{profile.name?.charAt(0) || "U"}</span>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2">Avatar Image URL</label>
              <input type="text" value={profile.avatar} onChange={(e) => setProfile({...profile, avatar: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" placeholder="https://example.com/avatar.jpg" />
              <p className="text-xs text-slate-500 mt-1">Provide a valid image URL to update your profile picture.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Full Name</label>
              <input type="text" required value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Contact Number</label>
              <div className="flex gap-2">
                <select value={profile.contactNumber.countryCode} onChange={(e) => setProfile({...profile, contactNumber: {...profile.contactNumber, countryCode: e.target.value}})} className="w-24 px-2 py-2 border border-slate-300 dark:border-slate-700 bg-transparent">
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <input type="text" required value={profile.contactNumber.number} onChange={(e) => setProfile({...profile, contactNumber: {...profile.contactNumber, number: e.target.value}})} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-transparent" placeholder="Phone Number" />
              </div>
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Addresses</h2>
            <button type="button" onClick={addAddress} className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              <Plus size={16} className="mr-1" /> Add Address
            </button>
          </div>
          
          {profile.addresses.length === 0 ? (
            <p className="text-sm text-slate-500">No addresses added yet.</p>
          ) : (
            <div className="space-y-6">
              {profile.addresses.map((address, index) => (
                <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute top-4 right-4 flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="primaryAddress" checked={address.isPrimary} onChange={() => updateAddress(index, 'isPrimary', true)} />
                      Set Primary
                    </label>
                    <button type="button" onClick={() => removeAddress(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div>
                      <label className="block text-xs font-bold mb-1">Street</label>
                      <input type="text" required value={address.street} onChange={(e) => updateAddress(index, 'street', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">City</label>
                      <input type="text" required value={address.city} onChange={(e) => updateAddress(index, 'city', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">State / Province</label>
                      <input type="text" required value={address.state} onChange={(e) => updateAddress(index, 'state', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">ZIP / Postal Code</label>
                      <input type="text" required value={address.zipCode} onChange={(e) => updateAddress(index, 'zipCode', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Country</label>
                      <input type="text" required value={address.country} onChange={(e) => updateAddress(index, 'country', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
        {message && <p className="text-green-500 text-sm font-bold">{message}</p>}

        <button type="submit" disabled={saving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
