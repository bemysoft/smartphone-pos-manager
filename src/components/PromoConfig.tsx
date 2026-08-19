import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Promo } from "../types";
import { Plus, Edit2, Trash2, Tag, ShoppingBag, Users, Save, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function PromoConfig() {
  const { t } = useLanguage();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Promo>>({
    name: "",
    description: "",
    type: "QUANTITY",
    isActive: true,
    minQuantity: 0,
    discountPercentage: 0,
    customerRole: "REGULAR",
    roleDiscountPercentage: 0,
    buyX: 0,
    freeY: 0,
    validFrom: "",
    validUntil: "",
    printOnReceipt: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await apiFetch("/api/promos");
      const data = await res.json();
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiFetch(`/api/promos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch("/api/promos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      setShowForm(false);
      setEditingId(null);
      fetchPromos();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan promo.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/promos/${id}`, { method: "DELETE" });
      fetchPromos();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (promo: Promo) => {
    setFormData({ ...promo });
    setEditingId(promo.id);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manajemen Promo & Diskon</h2>
          <p className="text-xs text-slate-500">Atur diskon bertingkat dan buy-1-get-1.</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: "", description: "", type: "QUANTITY", isActive: true,
              minQuantity: 0, discountPercentage: 0, customerRole: "REGULAR",
              roleDiscountPercentage: 0, buyX: 0, freeY: 0, validFrom: "", validUntil: "", printOnReceipt: true
            });
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Promo
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">{editingId ? "Edit Promo" : "Promo Baru"}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Promo</label>
                <input required type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tipe Promo</label>
                <select value={formData.type || "QUANTITY"} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <option value="QUANTITY">Diskon Kuantitas (Beli N, Diskon X%)</option>
                  <option value="ROLE">Diskon Member (Berdasarkan Role)</option>
                  <option value="BUY_X_GET_Y">Beli X Gratis Y</option>
                </select>
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat</label>
                <input type="text" value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
            </div>

            {formData.type === "QUANTITY" && (
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Minimal Beli (Qty)</label>
                  <input type="number" min="1" value={formData.minQuantity ?? 0} onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Diskon (%)</label>
                  <input type="number" min="0" max="100" value={formData.discountPercentage ?? 0} onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
            )}

            {formData.type === "ROLE" && (
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Role Pelanggan</label>
                  <select value={formData.customerRole || "REGULAR"} onChange={e => setFormData({...formData, customerRole: e.target.value as any})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs">
                    <option value="REGULAR">Regular</option>
                    <option value="MEMBER">Member</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Diskon (%)</label>
                  <input type="number" min="0" max="100" value={formData.roleDiscountPercentage ?? 0} onChange={e => setFormData({...formData, roleDiscountPercentage: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
            )}

            {formData.type === "BUY_X_GET_Y" && (
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Syarat Beli (Beli X)</label>
                  <input type="number" min="1" value={formData.buyX ?? 0} onChange={e => setFormData({...formData, buyX: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  <p className="text-[10px] text-slate-400 mt-1">Misal: 3 (Berlaku kelipatan)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Gratis (Gratis Y Termurah)</label>
                  <input type="number" min="1" value={formData.freeY ?? 0} onChange={e => setFormData({...formData, freeY: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  <p className="text-[10px] text-slate-400 mt-1">Misal: 1 (1 HP paling murah gratis)</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Berlaku Dari (Opsional)</label>
                <input type="datetime-local" value={formData.validFrom || ""} onChange={e => setFormData({...formData, validFrom: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Berlaku Sampai (Opsional)</label>
                <input type="datetime-local" value={formData.validUntil || ""} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs" />
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700">Promo Aktif</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="printOnReceipt" checked={formData.printOnReceipt !== false} onChange={e => setFormData({...formData, printOnReceipt: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                <label htmlFor="printOnReceipt" className="text-xs font-bold text-slate-700">Cetak Diskon di Struk Kasir</label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20">
                <Save className="w-4 h-4" />
                Simpan Promo
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-500">Memuat data promo...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Belum ada promo.</p>
          <p className="text-xs text-slate-400 mt-1">Tambahkan promo untuk pelanggan Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map(promo => (
            <div key={promo.id} className={`p-5 rounded-2xl border ${promo.isActive ? 'border-primary-100 bg-primary-50/30' : 'border-slate-200 bg-slate-50 opacity-60'} flex justify-between items-start`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    promo.type === 'QUANTITY' ? 'bg-blue-100 text-blue-700' :
                    promo.type === 'ROLE' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {promo.type === 'QUANTITY' ? 'Kuantitas' : promo.type === 'ROLE' ? 'Role / Member' : 'Beli X Gratis Y'}
                  </span>
                  {!promo.isActive && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">Non-Aktif</span>}
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{promo.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{promo.description}</p>
                {(promo.validFrom || promo.validUntil) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    ⏰ {promo.validFrom ? new Date(promo.validFrom).toLocaleString('id-ID') : 'Selamanya'} - {promo.validUntil ? new Date(promo.validUntil).toLocaleString('id-ID') : 'Selamanya'}
                  </p>
                )}
                <div className="mt-3 text-[11px] font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 inline-block">
                  {promo.type === 'QUANTITY' && `Beli minimal ${promo.minQuantity} item, diskon ${promo.discountPercentage}%`}
                  {promo.type === 'ROLE' && `Role ${promo.customerRole}, diskon ${promo.roleDiscountPercentage}%`}
                  {promo.type === 'BUY_X_GET_Y' && `Beli ${promo.buyX} item, gratis ${promo.freeY} item termurah`}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(promo)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                {confirmDeleteId === promo.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(promo.id)} className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Yakin?</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300">Batal</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(promo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
