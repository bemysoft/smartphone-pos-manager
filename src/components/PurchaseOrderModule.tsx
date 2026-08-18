import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Send, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building2, 
  User, 
  Phone, 
  Calendar, 
  Trash2, 
  Check, 
  AlertCircle,
  MessageSquare,
  Copy,
  ChevronRight,
  ExternalLink,
  Boxes,
  Tag,
  DollarSign,
  ArrowRight,
  Edit2,
  X,
  Smartphone,
  Barcode,
  QrCode
} from "lucide-react";
import { Product, Supplier, PurchaseOrder, PurchaseOrderItem } from "../types";
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from "../data";
import { apiFetch } from "../lib/api";

interface PurchaseOrderModuleProps {
  products: Product[];
  currentUser: any;
  onProductsChange?: () => void;
}

export default function PurchaseOrderModule({
  products,
  currentUser,
  onProductsChange
}: PurchaseOrderModuleProps) {
  // Local state for PO list
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem("app_purchase_orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PURCHASE_ORDERS;
      }
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  // Local state for Suppliers list
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem("app_suppliers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SUPPLIERS;
      }
    }
    return INITIAL_SUPPLIERS;
  });

  // Fetch suppliers from backend
  useEffect(() => {
    apiFetch("/api/suppliers")
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSuppliers(data);
          localStorage.setItem("app_suppliers", JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<PurchaseOrder | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<PurchaseOrder | null>(null);
  const [receivedItems, setReceivedItems] = useState<Array<{
    originalIndex: number;
    originalName: string;
    originalProductId?: string;
    orderedQty: number;
    receivedQty: number;
    actualProductId: string;
    actualName: string;
    actualColorVariant: string;
    actualPriceBuy: number;
    discrepancyNotes: string;
    imeiText: string;
  }>>([]);
  const [showImeiModal, setShowImeiModal] = useState<PurchaseOrder | null>(null);
  const [editImeiItems, setEditImeiItems] = useState<Array<{
    itemIndex: number;
    productName: string;
    productId?: string;
    orderedQty: number;
    imeiText: string;
  }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("app_purchase_orders", JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  // New PO Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContactPerson, setSupplierContactPerson] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [deliveryDateTarget, setDeliveryDateTarget] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PurchaseOrder["paymentTerms"]>("TEMPO_14");
  const [poNotes, setPoNotes] = useState("Mohon barang dikemas rapi dengan garansi resmi. Sertakan Faktur Pembelian.");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPpnPercentage, setTaxPpnPercentage] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Items list in form
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productId: products[0]?.id || "",
      name: products[0]?.name || "iPhone 15 Pro Max 256GB Black Titanium",
      brand: products[0]?.brand || "Apple",
      category: products[0]?.category || "Smartphone",
      qty: 2,
      priceBuy: products[0]?.priceBuy || 19500000,
      subtotal: (products[0]?.priceBuy || 19500000) * 2,
      notes: "Garansi Resmi iBox / TAM"
    }
  ]);

  // When selecting a supplier from dropdown
  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    if (!id) return;
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      setSupplierName(sup.name);
      setSupplierContactPerson(sup.contactPerson || "");
      setSupplierPhone(sup.phone || "");
      setSupplierAddress(sup.address || "");
    }
  };

  // Add Item row to form
  const handleAddItem = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd?.id || "",
        name: firstProd?.name || "",
        brand: firstProd?.brand || "",
        category: firstProd?.category || "Smartphone",
        qty: 1,
        priceBuy: firstProd?.priceBuy || 0,
        subtotal: firstProd?.priceBuy || 0,
        notes: ""
      }
    ]);
  };

  // Update item from product select or price/qty change
  const handleItemProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setItems((prev) => {
      const updated = [...prev];
      if (prod) {
        updated[index] = {
          ...updated[index],
          productId: prod.id,
          name: prod.name,
          brand: prod.brand,
          category: prod.category || "Smartphone",
          priceBuy: prod.priceBuy,
          subtotal: prod.priceBuy * updated[index].qty
        };
      } else {
        updated[index].productId = "";
      }
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      if (field === "qty" || field === "priceBuy") {
        const q = Number(current.qty) || 0;
        const p = Number(current.priceBuy) || 0;
        current.subtotal = q * p;
      }
      updated[index] = current;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Subtotal & Grand total calculations
  const subtotalAmount = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const taxPpnAmount = Math.round((subtotalAmount - discountAmount) * (taxPpnPercentage / 100));
  const grandTotal = Math.max(0, subtotalAmount - discountAmount + taxPpnAmount + shippingFee);

  // Generate Auto PO Number
  const generatePoNumber = () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(purchaseOrders.length + 1).padStart(3, "0");
    return `PO-${todayStr}-${seq}`;
  };

  // Reset form
  const handleOpenCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || "");
    if (suppliers[0]) {
      setSupplierName(suppliers[0].name);
      setSupplierContactPerson(suppliers[0].contactPerson || "");
      setSupplierPhone(suppliers[0].phone || "");
      setSupplierAddress(suppliers[0].address || "");
    } else {
      setSupplierName("");
      setSupplierContactPerson("");
      setSupplierPhone("");
      setSupplierAddress("");
    }
    const today = new Date();
    const next3Days = new Date(today);
    next3Days.setDate(today.getDate() + 3);
    setDeliveryDateTarget(next3Days.toISOString().slice(0, 10));
    setPaymentTerms("TEMPO_14");
    setPoNotes("Mohon barang dikemas rapi dengan garansi resmi. Sertakan Faktur Pembelian.");
    setDiscountAmount(0);
    setTaxPpnPercentage(0);
    setShippingFee(0);

    if (products.length > 0) {
      setItems([
        {
          productId: products[0].id,
          name: products[0].name,
          brand: products[0].brand,
          category: products[0].category || "Smartphone",
          qty: 2,
          priceBuy: products[0].priceBuy,
          subtotal: products[0].priceBuy * 2,
          notes: "Garansi Resmi TAM / SEIN"
        }
      ]);
    }
    setShowCreateModal(true);
  };

  // Submit PO
  const handleSavePO = (status: PurchaseOrder["status"]) => {
    if (!supplierName.trim()) {
      alert("Nama Supplier wajib diisi!");
      return;
    }
    if (items.length === 0 || items.some((it) => !it.name.trim() || it.qty <= 0)) {
      alert("Harap lengkapi item produk dan jumlah kuantitas pesanan!");
      return;
    }

    // Auto-save supplier to global supplier database if not present
    const existingSupplier = suppliers.find(s => s.name.toLowerCase() === supplierName.trim().toLowerCase());
    if (!existingSupplier) {
      const newSupplierObj: Supplier = {
        id: selectedSupplierId || `SPL-${Date.now()}`,
        tenantId: "tenant_demo_1",
        name: supplierName.trim(),
        contactPerson: supplierContactPerson || "Kontak PO",
        phone: supplierPhone || "",
        address: supplierAddress || "",
        category: "Distributor PO"
      };
      setSuppliers(prev => {
        const next = [newSupplierObj, ...prev];
        localStorage.setItem("app_suppliers", JSON.stringify(next));
        return next;
      });
      apiFetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplierObj)
      }).catch(() => {});
    }

    const newPO: PurchaseOrder = {
      id: generatePoNumber(),
      tenantId: "tenant_demo_1",
      supplierId: selectedSupplierId,
      supplierName,
      supplierContactPerson,
      supplierPhone,
      supplierAddress,
      date: new Date().toISOString().slice(0, 10),
      deliveryDateTarget,
      paymentTerms,
      items,
      subtotalAmount,
      discountAmount,
      taxPpnPercentage,
      taxPpnAmount,
      shippingFee,
      totalAmount: grandTotal,
      status,
      notes: poNotes,
      createdBy: currentUser?.id || "EMP001",
      createdByName: currentUser?.name || "Ricky Commedan",
      createdAt: new Date().toISOString()
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    setShowCreateModal(false);

    // If status is SENT_TO_SUPPLIER, ask user if want to send via WA right away
    if (status === "SENT_TO_SUPPLIER") {
      sendWhatsAppPO(newPO);
    }
  };

  // Format WhatsApp Text
  const formatWhatsAppText = (po: PurchaseOrder) => {
    const formattedDate = new Date(po.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const formattedDelivery = po.deliveryDateTarget
      ? new Date(po.deliveryDateTarget).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      : "-";

    let text = `*SURAT PESANAN PEMBELIAN (PURCHASE ORDER)*\n`;
    text += `*No. PO:* ${po.id}\n`;
    text += `*Tanggal:* ${formattedDate}\n`;
    text += `*Kepada Yth:* ${po.supplierName}\n`;
    if (po.supplierContactPerson) text += `*UP/Attn:* ${po.supplierContactPerson}\n`;
    text += `\nHalo, kami dari *Smartphone POS & Inventory Store* ingin melakukan pemesanan stok barang dengan rincian berikut:\n\n`;
    text += `==================================\n`;
    text += `*DAFTAR RINCIAN PESANAN BARANG:*\n`;

    po.items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}*\n`;
      text += `   Qty: ${item.qty} unit x Rp ${item.priceBuy.toLocaleString("id-ID")} = *Rp ${item.subtotal.toLocaleString("id-ID")}*\n`;
      if (item.notes) text += `   Catatan: _${item.notes}_\n`;
    });

    text += `==================================\n`;
    text += `*Subtotal Barang:* Rp ${po.subtotalAmount.toLocaleString("id-ID")}\n`;
    if (po.discountAmount && po.discountAmount > 0) {
      text += `*Diskon Grosir:* -Rp ${po.discountAmount.toLocaleString("id-ID")}\n`;
    }
    if (po.taxPpnPercentage && po.taxPpnPercentage > 0) {
      text += `*PPN (${po.taxPpnPercentage}%):* Rp ${(po.taxPpnAmount || 0).toLocaleString("id-ID")}\n`;
    }
    if (po.shippingFee && po.shippingFee > 0) {
      text += `*Estimasi Ongkir:* Rp ${po.shippingFee.toLocaleString("id-ID")}\n`;
    }
    text += `*TOTAL NILAI PO:* *Rp ${po.totalAmount.toLocaleString("id-ID")}*\n\n`;

    text += `*Syarat Pembayaran:* ${
      po.paymentTerms === "CASH" ? "Cash / Tunai" :
      po.paymentTerms === "COD" ? "COD (Bayar saat barang sampai)" :
      po.paymentTerms === "TRANSFER" ? "Transfer Bank Langsung" :
      po.paymentTerms === "TEMPO_14" ? "Tempo 14 Hari" :
      po.paymentTerms === "TEMPO_30" ? "Tempo 30 Hari" : "Tempo 60 Hari"
    }\n`;
    text += `*Target Pengiriman:* ${formattedDelivery}\n`;

    if (po.notes) {
      text += `\n*Instruksi Khusus:* ${po.notes}\n`;
    }

    text += `\n*Alamat Pengiriman:*
Smartphone POS & Inventory Store
Mall Ambassador Lt. 2 No. 15, Jl. Prof. DR. Satrio, Kuningan, Jakarta Selatan
HP/WA: 0812-9876-5432

Mohon konfirmasi ketersediaan stok & jadwal pengiriman. Terima kasih!`;

    return text;
  };

  // Open WhatsApp Web Link
  const sendWhatsAppPO = (po: PurchaseOrder) => {
    let rawPhone = po.supplierPhone.replace(/[^0-9]/g, "");
    if (rawPhone.startsWith("0")) {
      rawPhone = "62" + rawPhone.slice(1);
    }
    const message = encodeURIComponent(formatWhatsAppText(po));
    const waUrl = `https://wa.me/${rawPhone}?text=${message}`;
    window.open(waUrl, "_blank");

    // Auto mark as SENT_TO_SUPPLIER if was draft
    if (po.status === "DRAFT") {
      setPurchaseOrders((prev) =>
        prev.map((item) => (item.id === po.id ? { ...item, status: "SENT_TO_SUPPLIER" } : item))
      );
    }
  };

  const copyToClipboard = (po: PurchaseOrder) => {
    const text = formatWhatsAppText(po);
    navigator.clipboard.writeText(text);
    setCopiedId(po.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Receive Modal & Initialize Item Adjustments
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setShowReceiveModal(po);
    setReceivedItems(
      po.items.map((it, idx) => ({
        originalIndex: idx,
        originalName: it.name,
        originalProductId: it.productId,
        orderedQty: it.qty,
        receivedQty: it.qty,
        actualProductId: it.productId || "",
        actualName: it.name,
        actualColorVariant: "",
        actualPriceBuy: it.priceBuy,
        discrepancyNotes: "",
        imeiText: (it.imeis || []).join("\n")
      }))
    );
  };

  // Open IMEI Management Modal for Received PO
  const handleOpenImeiModal = (po: PurchaseOrder) => {
    setShowImeiModal(po);
    setEditImeiItems(
      po.items.map((it, idx) => ({
        itemIndex: idx,
        productName: it.name,
        productId: it.productId,
        orderedQty: it.qty,
        imeiText: (it.imeis || []).join("\n")
      }))
    );
  };

  // Save IMEIs directly to PO & Sync to Inventory Products
  const handleSaveImeisFromPo = () => {
    if (!showImeiModal) return;
    const po = showImeiModal;

    // Parse IMEIs and update PO items
    const updatedItems = po.items.map((it, idx) => {
      const editObj = editImeiItems.find(e => e.itemIndex === idx);
      if (!editObj) return it;
      const parsedImeis = editObj.imeiText
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(s => s.length >= 3);
      return { ...it, imeis: parsedImeis };
    });

    // Update PO in purchaseOrders state & LocalStorage
    const updatedPO = { ...po, items: updatedItems };
    setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updatedPO : p));

    // Sync to Inventory Products
    try {
      const savedProds = localStorage.getItem("app_products");
      let currentProducts: Product[] = savedProds ? JSON.parse(savedProds) : products;
      let syncedCount = 0;

      editImeiItems.forEach(editObj => {
        const parsedImeis = editObj.imeiText
          .split(/[\n,;]+/)
          .map(s => s.trim())
          .filter(s => s.length >= 3);

        if (parsedImeis.length === 0) return;

        let targetIdx = -1;
        if (editObj.productId) {
          targetIdx = currentProducts.findIndex(p => p.id === editObj.productId);
        }
        if (targetIdx === -1) {
          targetIdx = currentProducts.findIndex(
            p => p.name.toLowerCase().trim() === editObj.productName.toLowerCase().trim()
          );
        }

        if (targetIdx !== -1) {
          const prod = { ...currentProducts[targetIdx] };
          const existingImeis = new Set(prod.imeis || []);
          parsedImeis.forEach(im => existingImeis.add(im));
          prod.imeis = Array.from(existingImeis);
          currentProducts[targetIdx] = prod;
          syncedCount += parsedImeis.length;
        }
      });

      localStorage.setItem("app_products", JSON.stringify(currentProducts));
      if (onProductsChange) onProductsChange();
      alert(`Sukses! ${syncedCount} nomor IMEI untuk PO ${po.id} berhasil disimpan dan disinkronkan ke Katalog Inventaris Toko!`);
    } catch (e) {
      console.error("Error saving PO IMEIs:", e);
    }

    setShowImeiModal(null);
  };

  // Handle Mark as Received & Add Stock (With Discrepancy, Substitution & IMEI Support)
  const handleConfirmReceiveStock = (po: PurchaseOrder) => {
    try {
      const savedProds = localStorage.getItem("app_products");
      let currentProducts: Product[] = savedProds ? JSON.parse(savedProds) : products;

      let newlyCreatedProductsCount = 0;
      let updatedProductsCount = 0;
      let totalImeisAdded = 0;
      const discrepancyLogs: string[] = [];

      // Create a map of updated PO items to preserve imeis
      const updatedPoItems = [...po.items];

      receivedItems.forEach((recItem, idx) => {
        if (recItem.receivedQty <= 0) return;

        // Parse IMEIs entered during receive
        const parsedImeis = (recItem.imeiText || "")
          .split(/[\n,;]+/)
          .map(s => s.trim())
          .filter(s => s.length >= 3);

        if (updatedPoItems[idx]) {
          updatedPoItems[idx] = { ...updatedPoItems[idx], imeis: parsedImeis };
        }

        // Log discrepancy if received item name or color differs
        if (
          recItem.actualName !== recItem.originalName ||
          recItem.actualColorVariant ||
          recItem.receivedQty !== recItem.orderedQty ||
          recItem.discrepancyNotes
        ) {
          discrepancyLogs.push(
            `Pesan: "${recItem.originalName}" (${recItem.orderedQty} unit) -> Diterima: "${recItem.actualName}"${recItem.actualColorVariant ? ` [Varian: ${recItem.actualColorVariant}]` : ''} (${recItem.receivedQty} unit)${parsedImeis.length > 0 ? ` [${parsedImeis.length} IMEI Input]` : ''}${recItem.discrepancyNotes ? `. Catatan: ${recItem.discrepancyNotes}` : ''}`
          );
        }

        // Try to find target product in inventory
        let targetIdx = -1;

        if (recItem.actualProductId && recItem.actualProductId !== "NEW_PRODUCT") {
          targetIdx = currentProducts.findIndex((p) => p.id === recItem.actualProductId);
        }

        // If not found by ID, search by actual name (case insensitive)
        if (targetIdx === -1) {
          targetIdx = currentProducts.findIndex(
            (p) => p.name.toLowerCase().trim() === recItem.actualName.toLowerCase().trim()
          );
        }

        if (targetIdx !== -1) {
          // Existing product found -> Update stock & HPP & IMEIs
          const targetProd = { ...currentProducts[targetIdx] };
          targetProd.stock += Number(recItem.receivedQty);
          targetProd.priceBuy = Number(recItem.actualPriceBuy) || targetProd.priceBuy;
          if (recItem.actualColorVariant && !(targetProd as any).color) {
            (targetProd as any).color = recItem.actualColorVariant;
          }
          if (parsedImeis.length > 0) {
            const existingImeis = new Set(targetProd.imeis || []);
            parsedImeis.forEach(im => existingImeis.add(im));
            targetProd.imeis = Array.from(existingImeis);
            totalImeisAdded += parsedImeis.length;
          }
          currentProducts[targetIdx] = targetProd;
          updatedProductsCount++;
        } else {
          // Product substituted or new variant -> Create new product in inventory automatically!
          const newProdId = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const brandMatch = recItem.actualName.match(/iPhone|Samsung|Xiaomi|Oppo|Vivo|Realme|Infinix|POCO|Asus|Nokia|Apple/i);
          const brand = brandMatch ? brandMatch[0] : "Lainnya";

          const newProductObj: any = {
            id: newProdId,
            tenantId: "tenant_demo_1",
            code: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
            name: recItem.actualName + (recItem.actualColorVariant ? ` (${recItem.actualColorVariant})` : ''),
            category: "HP Baru",
            brand: brand,
            priceBuy: Number(recItem.actualPriceBuy) || 1000000,
            priceSell: Math.round((Number(recItem.actualPriceBuy) || 1000000) * 1.15),
            stock: Number(recItem.receivedQty),
            minStock: 2,
            isSecond: false,
            conditionGrade: "NEW",
            color: recItem.actualColorVariant || "Sesuai Pengiriman PO",
            storage: "Sesuai Pengiriman",
            ram: "Sesuai Pengiriman",
            guaranteeMonths: 12,
            imeis: parsedImeis,
            supplierId: po.supplierId,
            supplierName: po.supplierName,
            createdAt: new Date().toISOString()
          };

          if (parsedImeis.length > 0) totalImeisAdded += parsedImeis.length;
          currentProducts.unshift(newProductObj);
          newlyCreatedProductsCount++;
        }
      });

      // Update PO status & save discrepancy history
      const receiveNotes = discrepancyLogs.length > 0
        ? `[PENERIMAAN BARANG DENGAN PENYESUAIAN/SUBSTITUSI VARIAN]:\n${discrepancyLogs.join("\n")}`
        : po.notes;

      setPurchaseOrders((prev) =>
        prev.map((item) =>
          item.id === po.id
            ? {
                ...item,
                items: updatedPoItems,
                status: "RECEIVED",
                receivedAt: new Date().toISOString(),
                notes: po.notes ? `${po.notes}\n\n${receiveNotes}` : receiveNotes
              }
            : item
        )
      );

      localStorage.setItem("app_products", JSON.stringify(currentProducts));
      if (onProductsChange) onProductsChange();

      let summaryMsg = `Sukses! Penerimaan barang untuk PO ${po.id} berhasil ditandai sebagai DITERIMA!\n\n`;
      if (updatedProductsCount > 0) summaryMsg += `• Stok ${updatedProductsCount} produk eksisting berhasil ditambahkan.\n`;
      if (newlyCreatedProductsCount > 0) summaryMsg += `• ${newlyCreatedProductsCount} varian/produk pengganti baru otomatis dibuat & ditambahkan ke Katalog Inventaris.\n`;
      if (totalImeisAdded > 0) summaryMsg += `• ${totalImeisAdded} Nomor IMEI baru disinkronkan ke unit HP di inventaris.\n`;
      if (discrepancyLogs.length > 0) summaryMsg += `\n*Catatan Penyesuaian Varian/Beda Kirim telah disimpan di riwayat PO.`;

      alert(summaryMsg);
    } catch (e) {
      console.error("Error updating product stock on PO receive:", e);
      alert("Terjadi kesalahan saat memperbarui stok inventaris.");
    }

    setShowReceiveModal(null);
  };

  // Filtered POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Analytics Stats
  const totalPOCount = purchaseOrders.length;
  const activePOAmount = purchaseOrders
    .filter((p) => p.status === "SENT_TO_SUPPLIER" || p.status === "CONFIRMED")
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingCount = purchaseOrders.filter(
    (p) => p.status === "SENT_TO_SUPPLIER" || p.status === "DRAFT"
  ).length;
  const receivedCount = purchaseOrders.filter((p) => p.status === "RECEIVED").length;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Order Pembelian (Purchase Order)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Standar Indonesia 🇮🇩
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pesan stok hp & aksesoris langsung ke supplier & kirim dokumen via WhatsApp
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Surat Pesanan (PO) Baru
        </button>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Surat Pesanan</span>
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalPOCount} <span className="text-xs font-normal text-slate-400">Dokumen PO</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Tercatat di sistem toko</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PO Aktif / Menunggu</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{pendingCount} <span className="text-xs font-normal text-slate-400">PO Pending</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Menunggu pengiriman supplier</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Nilai Pesanan Aktif</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            Rp {activePOAmount.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Modal pembelian terikat</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Barang Diterima</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{receivedCount} <span className="text-xs font-normal text-slate-400">Selesai</span></div>
          <p className="text-[11px] text-slate-500 mt-1">Stok sudah masuk inventaris</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari No. PO, Supplier, atau Produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "Semua" },
            { key: "DRAFT", label: "Draft" },
            { key: "SENT_TO_SUPPLIER", label: "Dikirim WA" },
            { key: "CONFIRMED", label: "Dikonfirmasi" },
            { key: "RECEIVED", label: "Diterima (Stok +)" },
            { key: "CANCELLED", label: "Dibatalkan" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PURCHASE ORDERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">No. PO & Tanggal</th>
                <th className="py-3.5 px-4">Supplier & Kontak WA</th>
                <th className="py-3.5 px-4">Rincian Barang</th>
                <th className="py-3.5 px-4">Syarat Bayar</th>
                <th className="py-3.5 px-4">Total Nilai PO</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi & Kirim WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    Belum ada dokumen Surat Pesanan Pembelian (PO).
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const getStatusBadge = (status: PurchaseOrder["status"]) => {
                    switch (status) {
                      case "DRAFT":
                        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">DRAFT</span>;
                      case "SENT_TO_SUPPLIER":
                        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1 w-fit"><Send className="h-3 w-3" /> DIKIRIM KE SUPPLIER</span>;
                      case "CONFIRMED":
                        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> DIKONFIRMASI</span>;
                      case "RECEIVED":
                        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> BARANG DITERIMA</span>;
                      case "CANCELLED":
                        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">DIBATALKAN</span>;
                    }
                  };

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium">
                        <div className="text-cyan-400 font-bold">{po.id}</div>
                        <div className="text-[11px] text-slate-500">{new Date(po.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{po.supplierName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          {po.supplierPhone || "-"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {po.items.map((it, idx) => (
                            <div key={idx} className="text-slate-200 text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"></span>
                              <span className="font-medium">{it.name}</span>
                              <span className="text-slate-400 text-[11px]">x{it.qty}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-[11px] font-medium text-slate-300 border border-slate-700">
                          {po.paymentTerms === "TEMPO_14" ? "Tempo 14 Hari" :
                           po.paymentTerms === "TEMPO_30" ? "Tempo 30 Hari" :
                           po.paymentTerms === "TEMPO_60" ? "Tempo 60 Hari" :
                           po.paymentTerms === "TRANSFER" ? "Transfer" :
                           po.paymentTerms === "COD" ? "COD" : "Cash"}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-white">
                        Rp {po.totalAmount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(po.status)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* KIRIM WA BUTTON */}
                          <button
                            onClick={() => sendWhatsAppPO(po)}
                            title="Kirim dokumen Surat Pesanan PO langsung via WhatsApp Supplier"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-600/20"
                          >
                            <MessageSquare className="h-3.5 w-3.5 fill-current" />
                            WA Supplier
                          </button>

                          {/* CETAK PO */}
                          <button
                            onClick={() => setShowPrintModal(po)}
                            title="Cetak Cetak Surat Pesanan (PO)"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-all border border-slate-700"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* COPY WA TEXT */}
                          <button
                            onClick={() => copyToClipboard(po)}
                            title="Salin teks PO untuk dikirim manual"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-all border border-slate-700"
                          >
                            {copiedId === po.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>

                          {/* ACTION TERIMA BARANG */}
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-blue-600/20"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Terima Stok
                            </button>
                          )}

                          {/* ACTION INPUT / KELOLA IMEI UNTUK PO YANG SUDAH DITERIMA */}
                          {po.status === "RECEIVED" && (
                            <button
                              onClick={() => handleOpenImeiModal(po)}
                              title="Input / Kelola Nomor IMEI unit HP PO ini"
                              className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                              Input IMEI
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BUAT PO BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600/20 text-cyan-400 rounded-xl">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Buat Surat Pesanan Pembelian (Purchase Order)</h2>
                  <p className="text-xs text-slate-400">Standar Format Pengadaan Stok Indonesia</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* SECTION 1: INFORMASI SUPPLIER */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> 1. Informasi Supplier / Distributor
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pilih dari Daftar Supplier
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="">-- Ketik Supplier Baru / Bebas --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Perusahaan Supplier *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PT Teletama Artha Mandiri"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Person (UP / Sales)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pak Hendra (Sales Manager)"
                      value={supplierContactPerson}
                      onChange={(e) => setSupplierContactPerson(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      No. WhatsApp / Telepon Supplier *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 081298765432"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TANGGAL & PAYMENT TERMS */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> 2. Syarat & Target Pengiriman
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Tanggal Pengiriman
                    </label>
                    <input
                      type="date"
                      value={deliveryDateTarget}
                      onChange={(e) => setDeliveryDateTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Syarat Pembayaran (Payment Terms)
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="CASH">Cash / Tunai</option>
                      <option value="COD">COD (Bayar saat sampai)</option>
                      <option value="TRANSFER">Transfer Bank Direct</option>
                      <option value="TEMPO_14">Tempo 14 Hari</option>
                      <option value="TEMPO_30">Tempo 30 Hari</option>
                      <option value="TEMPO_60">Tempo 60 Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DAFTAR BARANG BARANG */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="h-4 w-4" /> 3. Rincian Item Barang Pembelian
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Baris Produk
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        {/* Pilih Produk dari Inventaris */}
                        <div className="md:col-span-5">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Produk ({index + 1})
                          </label>
                          <select
                            value={item.productId || ""}
                            onChange={(e) => handleItemProductSelect(index, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500/50 mb-1"
                          >
                            <option value="">-- Pilih dari Stok Inventaris --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (HPP: Rp {p.priceBuy.toLocaleString("id-ID")})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Atau Ketik Nama Barang Manual..."
                            value={item.name}
                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                          />
                        </div>

                        {/* Qty */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Jumlah (Qty)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500/50 text-center font-bold"
                          />
                        </div>

                        {/* Harga Beli / HPP */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Harga Satuan (Rp)
                          </label>
                          <input
                            type="number"
                            value={item.priceBuy}
                            onChange={(e) => handleItemChange(index, "priceBuy", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500/50 text-right font-mono"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Subtotal
                          </label>
                          <div className="py-2 px-3 bg-slate-800/80 rounded-lg text-xs text-emerald-400 font-bold font-mono text-right">
                            Rp {(item.subtotal || 0).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Hapus */}
                        <div className="md:col-span-1 flex justify-end">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Catatan Item */}
                      <div>
                        <input
                          type="text"
                          placeholder="Catatan spesifikasi / garansi item ini..."
                          value={item.notes || ""}
                          onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                          className="w-full px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[11px] text-slate-300 placeholder-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: KALKULASI & INSTRUKSI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Instruksi Khusus ke Supplier
                  </h3>
                  <textarea
                    rows={4}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Ringkasan Nilai PO
                  </h3>

                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal Barang:</span>
                    <span className="font-mono font-bold">Rp {subtotalAmount.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Diskon Grosir (Rp):</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)}
                      className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">PPN (%):</span>
                    <select
                      value={taxPpnPercentage}
                      onChange={(e) => setTaxPpnPercentage(parseInt(e.target.value) || 0)}
                      className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-white"
                    >
                      <option value={0}>0% (Non-PPN)</option>
                      <option value={11}>11% (PPN Standard)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Estimasi Ongkir (Rp):</span>
                    <input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(parseInt(e.target.value) || 0)}
                      className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-white"
                    />
                  </div>

                  <div className="border-t border-slate-700 pt-3 mt-2 flex justify-between items-center text-sm font-bold text-white">
                    <span>TOTAL NILAI PO:</span>
                    <span className="text-emerald-400 font-mono text-base">
                      Rp {grandTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTON ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800 pt-6 mt-6">
              <button
                onClick={() => handleSavePO("DRAFT")}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 cursor-pointer"
              >
                Simpan sebagai Draft
              </button>

              <button
                onClick={() => handleSavePO("SENT_TO_SUPPLIER")}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25"
              >
                <Send className="h-4 w-4" />
                Simpan & Kirim WA ke Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK / PRINT PO */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Printer className="h-5 w-5 text-cyan-400" /> Cetak Surat Pesanan (PO)
              </h2>
              <button onClick={() => setShowPrintModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PRINTABLE AREA */}
            <div id="printable-po" className="bg-white text-slate-900 p-8 rounded-xl space-y-6 text-xs">
              {/* KOP SURAT */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">SMARTPHONE POS & INVENTORY STORE</h1>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Mall Ambassador Lt. 2 No. 15, Jl. Prof. DR. Satrio, Jakarta Selatan
                  </p>
                  <p className="text-[11px] text-slate-600">Telp/WA: 0812-9876-5432 | Email: purchasing@phonepos.id</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded">
                    SURAT PESANAN (PO)
                  </div>
                  <div className="mt-2 font-mono font-bold text-slate-900">{showPrintModal.id}</div>
                  <div className="text-[11px] text-slate-600">Tanggal: {showPrintModal.date}</div>
                </div>
              </div>

              {/* SUPPLIER INFO */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Kepada Yth Supplier:</div>
                  <div className="font-bold text-sm text-slate-900 mt-1">{showPrintModal.supplierName}</div>
                  <div className="text-slate-600 mt-0.5">Attn: {showPrintModal.supplierContactPerson || "-"}</div>
                  <div className="text-slate-600">Telp/WA: {showPrintModal.supplierPhone}</div>
                  <div className="text-slate-600">{showPrintModal.supplierAddress}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Syarat Pembelian:</div>
                  <div className="text-slate-700 mt-1">Syarat Bayar: <strong>{showPrintModal.paymentTerms}</strong></div>
                  <div className="text-slate-700">Target Kirim: <strong>{showPrintModal.deliveryDateTarget || "-"}</strong></div>
                  <div className="text-slate-700">Pembuat PO: <strong>{showPrintModal.createdByName}</strong></div>
                </div>
              </div>

              {/* RINCIAN TABEL */}
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border border-slate-300">No</th>
                    <th className="p-2 border border-slate-300">Nama Barang & Spesifikasi</th>
                    <th className="p-2 border border-slate-300 text-center">Qty</th>
                    <th className="p-2 border border-slate-300 text-right">Harga Satuan (Rp)</th>
                    <th className="p-2 border border-slate-300 text-right">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {showPrintModal.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-medium">
                        {item.name}
                        {item.notes && <div className="text-[10px] text-slate-500 italic">{item.notes}</div>}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">{item.qty}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">Rp {item.priceBuy.toLocaleString("id-ID")}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold">Rp {item.subtotal.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTALS */}
              <div className="flex justify-between items-start pt-2">
                <div className="w-1/2 text-[11px] text-slate-600">
                  <span className="font-bold">Instruksi / Catatan:</span>
                  <p className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded italic">{showPrintModal.notes || "-"}</p>
                </div>

                <div className="w-2/5 space-y-1 text-right text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rp {showPrintModal.subtotalAmount.toLocaleString("id-ID")}</span>
                  </div>
                  {showPrintModal.discountAmount ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Diskon:</span>
                      <span className="font-mono">-Rp {showPrintModal.discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}
                  {showPrintModal.taxPpnAmount ? (
                    <div className="flex justify-between text-slate-600">
                      <span>PPN ({showPrintModal.taxPpnPercentage}%):</span>
                      <span className="font-mono">Rp {showPrintModal.taxPpnAmount.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}
                  {showPrintModal.shippingFee ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Ongkir:</span>
                      <span className="font-mono">Rp {showPrintModal.shippingFee.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-2">
                    <span>TOTAL PO:</span>
                    <span className="font-mono">Rp {showPrintModal.totalAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* TANDA TANGAN */}
              <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-500">Pemasok / Supplier,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{showPrintModal.supplierContactPerson || showPrintModal.supplierName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Hormat Kami (Pembuat PO),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{showPrintModal.createdByName}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Cetak / Print PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TERIMA STOK BARANG DENGAN PENYESUAIAN VARIAN / SUBSTITUSI PRODUK */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Form Penerimaan Barang & Pemeriksaan Fisik PO</h2>
                  <p className="text-xs text-slate-400">
                    No. PO: <span className="font-mono text-cyan-400 font-bold">{showReceiveModal.id}</span> • Supplier: <strong>{showReceiveModal.supplierName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReceiveModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-[11px] flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <strong>Fitur Penyesuaian Pengiriman Supplier:</strong> Jika barang yang datang dari supplier mengalami <strong>perbedaan warna, varian storage/RAM, ukuran, atau diganti dengan produk pengganti/substitusi</strong>, silakan sesuaikan rincian di bawah. Sistem akan otomatis memasukkan stok ke produk/varian yang benar di Katalog Inventaris.
                </div>
              </div>

              {/* LIST ITEMS UNTUK DISESUAIKAN */}
              <div className="space-y-4">
                {receivedItems.map((rec, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dipesan di PO:</span>
                        <div className="font-bold text-sm text-white">{rec.originalName}</div>
                        <div className="text-[11px] text-slate-400">Qty Dipesan: <strong className="text-cyan-400">{rec.orderedQty} Unit</strong></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-300">Qty Fisik Diterima:</label>
                        <input
                          type="number"
                          min="0"
                          value={rec.receivedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, receivedQty: val } : item));
                          }}
                          className="w-20 px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-white text-center font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* FORM PERBEDAAN VARIAN / PENYESUAIAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Nama Produk / Varian Real */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Nama Produk / Tipe Diterima (Jika Ganti Produk):
                        </label>
                        <input
                          type="text"
                          value={rec.actualName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, actualName: val } : item));
                          }}
                          placeholder="e.g. iPhone 15 Pro Max 256GB"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>

                      {/* Warna / Varian Real */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Warna / Varian Fisik Diterima:
                        </label>
                        <input
                          type="text"
                          value={rec.actualColorVariant}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, actualColorVariant: val } : item));
                          }}
                          placeholder="e.g. Blue Titanium / Black / 8GB+256GB"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>

                      {/* Harga Beli / HPP Real */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Harga Beli / HPP Real (Rp):
                        </label>
                        <input
                          type="number"
                          value={rec.actualPriceBuy}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, actualPriceBuy: val } : item));
                          }}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-xs"
                        />
                      </div>

                      {/* Catatan Ketidaksesuaian */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Catatan Beda Kirim Supplier:
                        </label>
                        <input
                          type="text"
                          value={rec.discrepancyNotes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, discrepancyNotes: val } : item));
                          }}
                          placeholder="e.g. Warna hitam kosong, disetujui ganti warna biru"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 text-xs"
                        />
                      </div>

                      {/* Input IMEI Unit Diterima */}
                      <div className="md:col-span-2 bg-slate-900/60 p-3 border border-slate-700/60 rounded-xl space-y-1.5 mt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5" />
                            Input / Scan Nomor IMEI Unit Diterima (Opsional / Scan Barcode):
                          </label>
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            {rec.imeiText ? rec.imeiText.split(/[\n,;]+/).map(s=>s.trim()).filter(s=>s.length>=3).length : 0} IMEI Diinput
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={rec.imeiText || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReceivedItems(prev => prev.map((item, i) => i === idx ? { ...item, imeiText: val } : item));
                          }}
                          placeholder="Scan barcode / ketik nomor IMEI per baris atau pisahkan koma (Contoh: 358190283719201, 358190283719202)"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  Ketika Anda mengonfirmasi, stok fisik akan langsung bertambah di produk terkait (atau varian produk baru otomatis dibuat di Katalog Inventaris jika tipe/warna berbeda).
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowReceiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleConfirmReceiveStock(showReceiveModal)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Konfirmasi Terima & Masukkan ke Stok Inventaris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA & INPUT IMEI PO YANG SUDAH DITERIMA */}
      {showImeiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Input / Kelola Nomor IMEI PO Diterima</h2>
                  <p className="text-xs text-slate-400">
                    No. PO: <span className="font-mono text-cyan-400 font-bold">{showImeiModal.id}</span> • Supplier: <strong>{showImeiModal.supplierName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowImeiModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 text-[11px] flex items-start gap-2.5">
                <Barcode className="h-4 w-4 flex-shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  Masukkan atau scan barcode IMEI untuk setiap unit HP yang datang di PO ini. Semua IMEI yang diinput di sini akan otomatis disinkronkan ke unit HP di Katalog Inventaris Toko.
                </div>
              </div>

              <div className="space-y-4">
                {editImeiItems.map((editItem, idx) => {
                  const parsed = editItem.imeiText.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length >= 3);
                  return (
                    <div key={idx} className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <div>
                          <h4 className="font-bold text-sm text-white">{editItem.productName}</h4>
                          <p className="text-[11px] text-slate-400">Total Dipesan: <strong className="text-cyan-400">{editItem.orderedQty} Unit</strong></p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${parsed.length === editItem.orderedQty ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {parsed.length} / {editItem.orderedQty} IMEI Terdeteksi
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Daftar Nomor IMEI (1 IMEI per baris atau pisahkan koma):
                        </label>
                        <textarea
                          rows={3}
                          value={editItem.imeiText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditImeiItems(prev => prev.map((item, i) => i === idx ? { ...item, imeiText: val } : item));
                          }}
                          placeholder="Scan barcode / tempel nomor IMEI di sini (Contoh: 358190283719201)..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowImeiModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveImeisFromPo}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Simpan & Sinkronkan IMEI ke Inventaris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
