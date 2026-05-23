import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, Upload, Camera, ChevronDown,
  Loader2, Check, AlertTriangle, X, Download,
  TrendingUp,
} from 'lucide-react';
import { BUSINESS_TYPE_CONFIG } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ──────────────────────────────────────────────
   INITIAL FORM STATE
   ────────────────────────────────────────────── */
const INITIAL_FORM = {
  name: '',
  category: '',
  buyingPrice: '',
  sellingPrice: '',
  stock: '',
  lowStockThreshold: '5',
  sku: '',
  barcode: '',
  supplier: '',
  notes: '',
  image: null,
  imagePreview: null,
  attributes: {},
};

/* ──────────────────────────────────────────────
   CATEGORY SHORT CODES (for auto-generated SKU)
   ────────────────────────────────────────────── */
const CAT_CODES = {
  'Trousers': 'TRO', 'Shirts': 'SHT', 'Dresses': 'DRS', 'Jackets': 'JKT',
  'Shoes': 'SHO', 'Accessories': 'ACC', 'Phones': 'PHN', 'Laptops': 'LPT',
  'Parts': 'PRT', 'Cables': 'CBL', 'Audio': 'AUD', 'Beverages': 'BEV',
  'Dry Foods': 'DRY', 'Fresh Produce': 'FRS', 'Dairy': 'DAY', 'Snacks': 'SNK',
  'Household': 'HSE', 'Makeup': 'MKP', 'Skincare': 'SKN', 'Hair': 'HAI',
  'Fragrance': 'FRG', 'Nails': 'NLS', 'Tools': 'TLS', 'Paint': 'PNT',
  'Electrical': 'ELC', 'Plumbing': 'PLM', 'Fasteners': 'FST', 'Building': 'BLD',
  'Prescription': 'PRX', 'OTC': 'OTC', 'First Aid': 'FAD', 'Vitamins': 'VIT',
  'Personal Care': 'PCR', 'Baby': 'BBY',
};

const SAMPLE_SUPPLIERS = ['General Supplier', 'Wholesale Ltd', 'Direct Import'];

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
const AddProductPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // ── Tab state
  const [activeTab, setActiveTab] = useState('manual');

  // ── Form state
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Shop data
  const [shopData, setShopData] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  // ── Category management
  const [customCategories, setCustomCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // ── CSV
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvExcluded, setCsvExcluded] = useState(new Set());

  // ── Success toast
  const [toast, setToast] = useState(null);

  // ── Fetch shop data
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/shop/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success) setShopData(result.data);
        }
      } catch (err) {
        console.error('Fetch shop error:', err);
      } finally {
        setShopLoading(false);
      }
    };
    fetchShop();
  }, [getToken]);

  // ── Derived: business types, categories, dynamic fields
  const businessTypeIds = useMemo(() => {
    if (!shopData) return [];
    const types = shopData.businessTypes?.length
      ? shopData.businessTypes
      : shopData.businessType ? [shopData.businessType] : [];
    return types.filter((t) => t !== 'other');
  }, [shopData]);

  const categories = useMemo(() => {
    const cats = [];
    businessTypeIds.forEach((btId) => {
      const cfg = BUSINESS_TYPE_CONFIG[btId];
      if (cfg) cats.push(...cfg.categories);
    });
    cats.push(...customCategories);
    return [...new Set(cats)].sort();
  }, [businessTypeIds, customCategories]);

  const dynamicFields = useMemo(() => {
    const fieldKeys = new Set();
    businessTypeIds.forEach((btId) => {
      const cfg = BUSINESS_TYPE_CONFIG[btId];
      if (cfg?.fields) Object.keys(cfg.fields).forEach((k) => fieldKeys.add(k));
    });
    // Build merged field definitions
    const merged = {};
    fieldKeys.forEach((key) => {
      for (const btId of businessTypeIds) {
        const cfg = BUSINESS_TYPE_CONFIG[btId];
        if (cfg?.fields?.[key]) { merged[key] = cfg.fields[key]; break; }
      }
    });
    return merged;
  }, [businessTypeIds]);

  // ── Auto-toast dismiss (3s for success unless user interacts)
  const [toastTimer, setToastTimer] = useState(null);
  useEffect(() => {
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => {
      setToast(null);
      if (toast?.type === 'success') navigate('/dashboard/inventory');
    }, 3000);
    setToastTimer(t);
    return () => clearTimeout(t);
  }, [toast]);

  /* ────────────────────────────────────────────
     HELPERS
     ──────────────────────────────────────────── */

  const generateSku = useCallback((cat) => {
    const code = CAT_CODES[cat] || cat?.substring(0, 3).toUpperCase() || 'PRD';
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `${code}-${rand}`;
  }, []);

  const marginCalc = useMemo(() => {
    const buy = parseFloat(form.buyingPrice) || 0;
    const sell = parseFloat(form.sellingPrice) || 0;
    if (buy === 0 && sell === 0) return null;
    const margin = sell - buy;
    const pct = buy > 0 ? (margin / sell) * 100 : 0;
    return { margin, pct: Math.round(pct * 10) / 10 };
  }, [form.buyingPrice, form.sellingPrice]);

  const marginColor = useMemo(() => {
    if (!marginCalc) return 'neutral-400';
    if (marginCalc.margin < 0) return '#EF4444';
    if (marginCalc.pct > 20) return '#10B981';
    if (marginCalc.pct >= 10) return '#F59E0B';
    return '#EF4444';
  }, [marginCalc]);

  /* ────────────────────────────────────────────
     FORM HANDLERS
     ──────────────────────────────────────────── */

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateAttr = (key, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image must be under 5MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
        imagePreview: reader.result,
      }));
      if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null, imagePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ────────────────────────────────────────────
     VALIDATION
     ──────────────────────────────────────────── */

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Product name is required (min 2 characters)';
    if (!form.category) errs.category = 'Category is required';
    const buy = parseFloat(form.buyingPrice);
    if (!form.buyingPrice || isNaN(buy) || buy <= 0) errs.buyingPrice = 'Buying price must be greater than 0';
    const sell = parseFloat(form.sellingPrice);
    if (!form.sellingPrice || isNaN(sell) || sell <= 0) errs.sellingPrice = 'Selling price must be greater than 0';
    const stock = parseInt(form.stock);
    if (form.stock === '' || isNaN(stock) || stock < 0) errs.stock = 'Valid stock quantity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ────────────────────────────────────────────
     SUBMIT — ADD MANUALLY
     ──────────────────────────────────────────── */

  const handleSubmit = async (addAnother = false) => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.sellingPrice),
        costPrice: parseFloat(form.buyingPrice),
        stock: parseInt(form.stock),
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        sku: form.sku?.trim() || generateSku(form.category),
        barcode: form.barcode?.trim() || undefined,
        supplier: form.supplier?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        image: form.image || undefined,
        attributes: {},
      };

      // Map form attribute keys to Product model attribute keys
      const attr = form.attributes;
      if (attr.size) payload.attributes.size = attr.size;
      if (attr.color) payload.attributes.color = attr.color;
      if (attr.material) payload.attributes.material = attr.material;
      if (attr.brand) payload.attributes.brand = attr.brand;
      if (attr.model) payload.attributes.model = attr.model;
      if (attr.condition) payload.attributes.condition = attr.condition.toLowerCase();
      if (attr.warranty) payload.attributes.warranty = attr.warranty;
      if (attr.weight) payload.attributes.weight = attr.weight;
      if (attr.organic) payload.attributes.organic = attr.organic === 'Yes';
      if (attr.shade) payload.attributes.shade = attr.shade;
      if (attr.skinType) payload.attributes.skinType = attr.skinType;
      if (attr.expiryDate) payload.attributes.expiryDate = new Date(attr.expiryDate);
      if (attr.strength) payload.attributes.strength = attr.strength;
      if (attr.form) payload.attributes.form = attr.form.toLowerCase();
      if (attr.prescriptionRequired) payload.attributes.prescriptionRequired = attr.prescriptionRequired === 'Yes';
      if (attr.batchNumber) payload.attributes.batchNumber = attr.batchNumber;
      if (attr.specifications) payload.attributes.specifications = attr.specifications;
      if (attr.unit) payload.attributes.unit = attr.unit.toLowerCase();

      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save product');
      }
      const saved = await res.json();
      const productId = saved?.data?._id;

      // Invalidate inventory cache
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      if (addAnother) {
        setForm(INITIAL_FORM);
        setErrors({});
        setToast({ message: '✓ Product added successfully!', productId, type: 'success' });
      } else {
        setToast({ message: '✓ Product added successfully!', productId, type: 'success' });
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message }));
      setToast(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ────────────────────────────────────────────
     CSV IMPORT
     ──────────────────────────────────────────── */

  const handleCsvSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setCsvErrors(['File must be under 5MB']);
      return;
    }
    setCsvFile(file);
    setCsvErrors([]);
    setCsvExcluded(new Set());

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        setCsvErrors(['CSV must have a header row and at least one data row']);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim());
      const allRows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim()));
      // Validate each row
      const validatedRows = allRows.map((cells) => {
        const errs = [];
        const nameIdx = headers.indexOf('name');
        const catIdx = headers.indexOf('category');
        const buyIdx = headers.indexOf('buyingPrice');
        const sellIdx = headers.indexOf('sellingPrice');
        if (nameIdx >= 0 && (!cells[nameIdx] || cells[nameIdx].length < 2)) errs.push('Name required (min 2 chars)');
        if (catIdx >= 0 && !cells[catIdx]) errs.push('Category required');
        if (buyIdx >= 0 && (!cells[buyIdx] || isNaN(Number(cells[buyIdx])) || Number(cells[buyIdx]) <= 0)) errs.push('Invalid buying price');
        if (sellIdx >= 0 && (!cells[sellIdx] || isNaN(Number(cells[sellIdx])) || Number(cells[sellIdx]) <= 0)) errs.push('Invalid selling price');
        return { cells, valid: errs.length === 0, errors: errs };
      });
      const displayRows = validatedRows.slice(0, 10);
      setCsvPreview({ headers, rows: displayRows, total: validatedRows.length, allRows: validatedRows });
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvFile || !csvPreview) return;
    setCsvImporting(true);
    setCsvErrors([]);
    try {
      const token = await getToken();
      // Use all validated rows, excluding unchecked and invalid ones
      const allRows = csvPreview.allRows || [];
      const validRows = allRows.filter((r, i) => r.valid && !csvExcluded.has(i));
      if (validRows.length === 0) {
        setCsvErrors(['No valid products to import']);
        setCsvImporting(false);
        return;
      }

      const products = validRows.map((r) => {
        const obj = {};
        csvPreview.headers.forEach((h, i) => { obj[h] = r.cells[i] || ''; });
        return {
          name: obj.name,
          category: obj.category,
          buyingPrice: obj.buyingPrice,
          sellingPrice: obj.sellingPrice,
          quantity: obj.quantity,
          size: obj.size,
          color: obj.color,
          brand: obj.brand,
          material: obj.material,
          unit: obj.unit,
          expiryDate: obj.expiryDate,
          description: obj.description,
          sku: obj.sku,
        };
      });

      const res = await fetch(`${API_BASE_URL}/products/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Import failed');

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      const imported = result.data?.imported || products.length;
      const skipped = result.data?.skipped || 0;

      if (skipped > 0) {
        setCsvErrors(result.data.validationErrors?.map((e) => `Row ${e.row}: ${e.errors.join(', ')}`) || []);
        setToast({ message: `${imported} products imported! 🎉 ${skipped} skipped.`, type: 'csv' });
      } else {
        setToast({ message: `${imported} products imported successfully! 🎉`, type: 'csv' });
        setTimeout(() => navigate('/dashboard/inventory'), 1500);
      }
    } catch (err) {
      setCsvErrors([err.message]);
    } finally {
      setCsvImporting(false);
    }
  };

  const handleTemplateDownload = async (btId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/products/template?type=${btId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dukaflow_${btId}_template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error:', err);
    }
  };

  /* ────────────────────────────────────────────
     CATEGORY MANAGEMENT
     ──────────────────────────────────────────── */

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      setForm((prev) => ({ ...prev, category: name }));
      setShowNewCategory(false);
      setNewCategoryName('');
      return;
    }
    setCustomCategories((prev) => [...prev, name]);
    setForm((prev) => ({ ...prev, category: name }));
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  /* ────────────────────────────────────────────
     FIELD RENDERERS
     ──────────────────────────────────────────── */

  const renderSelectField = (key, def, value) => (
    <div className="relative">
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {def.label} {def.required !== false && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => {
          if (e.target.value === '__custom__') return;
          updateAttr(key, e.target.value);
        }}
        className="w-full h-[52px] px-4 pr-10 border-[1.5px] border-neutral-300 rounded-xl bg-white text-[15px] text-neutral-900 appearance-none focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
      >
        <option value="">Select {def.label}...</option>
        {def.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        {def.allowCustom && <option value="__custom__">+ Add custom...</option>}
      </select>
      <ChevronDown size={18} className="absolute right-3.5 top-[46px] text-neutral-400 pointer-events-none" />
    </div>
  );

  const renderTextInput = (key, def, value) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{def.label}</label>
      <input
        type={def.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => updateAttr(key, e.target.value)}
        placeholder={def.placeholder}
        className="w-full h-[52px] px-4 border-[1.5px] border-neutral-300 rounded-xl text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
      />
    </div>
  );

  const renderDateField = (key, def, value) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {def.label} <span className="text-red-500">*</span>
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => updateAttr(key, e.target.value)}
        className="w-full h-[52px] px-4 border-[1.5px] border-neutral-300 rounded-xl text-[15px] text-neutral-900 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
      />
    </div>
  );

  const renderRadioField = (key, def, value) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">{def.label}</label>
      <div className="flex gap-4">
        {def.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => updateAttr(key, opt)}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                value === opt ? 'border-[#312E81]' : 'border-neutral-300'
              }`}
            >
              {value === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#312E81]" />}
            </div>
            <span className="text-sm text-neutral-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderField = (key, def) => {
    const value = form.attributes[key];
    switch (def.type) {
      case 'select': return renderSelectField(key, def, value);
      case 'date': return renderDateField(key, def, value);
      case 'radio': return renderRadioField(key, def, value);
      default: return renderTextInput(key, def, value);
    }
  };

  /* ────────────────────────────────────────────
     LOADING STATE
     ──────────────────────────────────────────── */
  if (shopLoading) {
    return (
      <div className="px-6 py-8 max-w-[800px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-36 bg-neutral-100 rounded" />
          <div className="h-8 w-48 bg-neutral-100 rounded" />
          <div className="h-12 w-64 bg-neutral-100 rounded-[14px]" />
          <div className="h-80 bg-neutral-100 rounded-[20px]" />
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────── */
  return (
    <div className="px-6 py-8 max-w-[800px] mx-auto pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 px-4 py-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl shadow-lg animate-branchDropdownIn max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
            <span className="text-sm text-[#065F46]">{toast.message || toast}</span>
          </div>
          {toast.type === 'success' && toast.productId && (
            <div className="flex gap-2">
              <button
                onClick={() => { clearTimeout(toastTimer); setToast(null); navigate(`/dashboard/inventory/${toast.productId}`); }}
                className="flex-1 h-9 text-xs font-medium text-[#065F46] bg-[#A7F3D0]/40 rounded-lg hover:bg-[#A7F3D0]/60 transition-colors"
              >
                View Product
              </button>
              <button
                onClick={() => { clearTimeout(toastTimer); setToast(null); setForm(INITIAL_FORM); setErrors({}); }}
                className="flex-1 h-9 text-xs font-medium text-[#065F46] bg-[#A7F3D0]/40 rounded-lg hover:bg-[#A7F3D0]/60 transition-colors"
              >
                Add Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => navigate('/dashboard/inventory')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#312E81] mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Inventory
      </button>
      <h1 className="text-[28px] font-bold text-neutral-900 mb-7">Add Product</h1>

      {/* Tab Switcher — Pill-Style Segmented Control */}
      <div className="flex gap-0 bg-neutral-100 rounded-[14px] p-1 w-fit mb-8">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm transition-all duration-200 ${
            activeTab === 'manual'
              ? 'bg-white shadow-sm text-[#312E81] font-semibold'
              : 'bg-transparent text-neutral-500 font-medium hover:text-neutral-700'
          }`}
        >
          <Pencil size={18} /> Add Manually
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm transition-all duration-200 ${
            activeTab === 'csv'
              ? 'bg-white shadow-sm text-[#312E81] font-semibold'
              : 'bg-transparent text-neutral-500 font-medium hover:text-neutral-700'
          }`}
        >
          <Upload size={18} /> Import CSV
        </button>
      </div>

      {/* ══════════════════════════════════════════
         TAB: ADD MANUALLY
         ══════════════════════════════════════════ */}
      {activeTab === 'manual' && (
        <div className="space-y-8">
          {/* ── Section 1: Product Image ── */}
          <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
            {form.imagePreview ? (
              <div className="relative">
                <img
                  src={form.imagePreview}
                  alt="Preview"
                  className="w-full h-[200px] object-cover rounded-xl"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white shadow"
                >
                  <X size={16} className="text-neutral-700" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-[#312E81] font-medium hover:underline"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-[200px] border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 cursor-pointer hover:border-[#312E81] hover:bg-[#EEF2FF] transition-all duration-200"
              >
                <Camera size={40} className="text-neutral-300 mb-3" />
                <p className="text-[15px] text-neutral-500">Click to upload product image</p>
                <p className="text-xs text-neutral-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
            {errors.image && <p className="text-xs text-red-500 mt-2">{errors.image}</p>}
          </div>

          {/* ── Section 2: Basic Information ── */}
          <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-5">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Slim Fit Jeans"
                  className={`w-full h-[52px] px-4 border-[1.5px] rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all ${errors.name ? 'border-red-400' : 'border-neutral-300'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Category */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setShowNewCategory(true);
                      return;
                    }
                    updateField('category', e.target.value);
                    if (!form.sku) {
                      setForm((prev) => ({ ...prev, category: e.target.value, sku: generateSku(e.target.value) }));
                    }
                  }}
                  className={`w-full h-[52px] px-4 pr-10 border-[1.5px] rounded-xl bg-white text-base text-neutral-900 appearance-none focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all ${errors.category ? 'border-red-400' : 'border-neutral-300'}`}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="__new__">+ Add New Category...</option>
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-[46px] text-neutral-400 pointer-events-none" />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* Inline new category input */}
              {showNewCategory && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      placeholder="New category name..."
                      className="w-full h-[52px] px-4 border-[1.5px] border-[#312E81] rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleAddCategory}
                    className="h-[52px] px-4 bg-[#312E81] text-white rounded-xl text-sm font-medium hover:bg-[#1E1B4B] transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                    className="h-[52px] w-[52px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Dynamic Product Details ── */}
          {Object.keys(dynamicFields).length > 0 && (
            <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
              <h3 className="text-lg font-semibold text-neutral-900 mt-3 mb-5">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dynamicFields).map(([key, def]) => (
                  <div key={key} className={def.type === 'radio' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                    {renderField(key, def)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 4: Pricing & Stock ── */}
          <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-neutral-900 mt-3 mb-5">Pricing & Stock</h3>

            {/* Pricing row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Buying Price (KSh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.buyingPrice}
                  onChange={(e) => updateField('buyingPrice', e.target.value)}
                  placeholder="1,200"
                  min="0"
                  step="0.01"
                  className={`w-full h-[52px] px-4 border-[1.5px] rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all ${errors.buyingPrice ? 'border-red-400' : 'border-neutral-300'}`}
                />
                {errors.buyingPrice && <p className="text-xs text-red-500 mt-1">{errors.buyingPrice}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Selling Price (KSh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.sellingPrice}
                  onChange={(e) => updateField('sellingPrice', e.target.value)}
                  placeholder="1,800"
                  min="0"
                  step="0.01"
                  className={`w-full h-[52px] px-4 border-[1.5px] rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all ${errors.sellingPrice ? 'border-red-400' : 'border-neutral-300'}`}
                />
                {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Initial Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  placeholder="12"
                  min="0"
                  className={`w-full h-[52px] px-4 border-[1.5px] rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all ${errors.stock ? 'border-red-400' : 'border-neutral-300'}`}
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
              </div>
            </div>

            {/* Margin Preview — TrendingUp icon style */}
            {marginCalc && (
              <div
                className="mt-2 bg-neutral-50 rounded-xl px-[18px] py-3.5 flex items-center gap-2.5"
              >
                <TrendingUp size={20} style={{ color: marginColor }} />
                <span className="text-base font-semibold" style={{ color: marginColor }}>
                  {marginCalc.margin < 0
                    ? 'Selling at a loss!'
                    : `Margin: KSh ${marginCalc.margin.toLocaleString()} (${marginCalc.pct}%)`}
                </span>
              </div>
            )}

            {/* Low Stock Threshold */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => updateField('lowStockThreshold', e.target.value)}
                min="1"
                className="w-[120px] h-12 px-4 border-[1.5px] border-neutral-300 rounded-xl text-center text-base text-neutral-900 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
              />
              <p className="text-xs text-neutral-400 mt-1">Alert when stock falls below this</p>
            </div>
          </div>

          {/* ── Section 5: Additional Information ── */}
          <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-neutral-900 mt-3 mb-5">
              Additional Information <span className="text-sm font-normal text-neutral-400">(Optional)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">SKU / Barcode</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder={form.category ? generateSku(form.category) : 'Auto-generated if left blank'}
                  className="w-full h-12 px-4 border-[1.5px] border-neutral-300 rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
                />
                <p className="text-xs text-neutral-400 mt-1">e.g., TRO-001 or scan barcode</p>
              </div>

              {/* Supplier */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Supplier</label>
                <select
                  value={form.supplier}
                  onChange={(e) => updateField('supplier', e.target.value)}
                  className="w-full h-12 px-4 pr-10 border-[1.5px] border-neutral-300 rounded-xl bg-white text-base text-neutral-900 appearance-none focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all"
                >
                  <option value="">Select supplier...</option>
                  {SAMPLE_SUPPLIERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__custom__">+ Add New Supplier...</option>
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-[42px] text-neutral-400 pointer-events-none" />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Any additional notes about this product..."
                  rows={3}
                  className="w-full px-4 py-3 border-[1.5px] border-neutral-300 rounded-xl text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#EEF2FF] focus:border-[#312E81] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form-level error banner */}
          {(() => { const fieldErrs = Object.entries(errors).filter(([k]) => k !== 'submit'); return fieldErrs.length > 0 ? (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</p>
              <ul className="list-disc list-inside">
                {fieldErrs.map(([key, msg]) => (
                  <li key={key} className="text-xs text-red-700">{msg}</li>
                ))}
              </ul>
            </div>
          ) : null; })()}

          {/* Submit / server error */}
          {errors.submit && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons — Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-6 py-3 z-30">
            <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
              <button
                onClick={() => navigate('/dashboard/inventory')}
                className="h-12 px-6 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="h-12 px-6 border border-[#312E81] rounded-xl text-sm font-medium text-[#312E81] hover:bg-[#EEF2FF] transition-colors disabled:opacity-50 order-3 sm:order-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}
                Save & Add Another
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="h-12 px-6 bg-[#312E81] text-white rounded-xl text-sm font-medium hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 flex items-center gap-2 order-1 sm:order-3 shadow-lg shadow-[#312E81]/20"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
         TAB: IMPORT CSV
         ══════════════════════════════════════════ */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className="h-[200px] border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 cursor-pointer hover:border-[#312E81] hover:bg-[#EEF2FF] transition-all duration-200"
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <Upload size={40} className="text-neutral-300 mb-3" />
            <p className="text-[15px] text-neutral-500">Upload your CSV file</p>
            <p className="text-xs text-neutral-400 mt-1">Drag and drop or click to browse — CSV up to 5MB</p>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleCsvSelect}
              className="hidden"
            />
          </div>

          {/* Template Download */}
          <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-5">Download Template</h3>
            <p className="text-sm text-neutral-500 mb-4">Download a pre-formatted CSV template matching your business type{businessTypeIds.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {businessTypeIds.map((btId) => {
                const cfg = BUSINESS_TYPE_CONFIG[btId];
                return (
                  <button
                    key={btId}
                    onClick={() => handleTemplateDownload(btId)}
                    className="flex items-center gap-3 px-4 py-3.5 border border-neutral-200 rounded-xl text-left hover:bg-[#EEF2FF]/40 hover:border-[#312E81]/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center group-hover:bg-[#312E81] transition-colors flex-shrink-0">
                      <Download size={16} className="text-[#312E81] group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{cfg?.name || btId}</p>
                      <p className="text-[11px] text-neutral-400">CSV template</p>
                    </div>
                  </button>
                );
              })}
              {businessTypeIds.length === 0 && (
                <p className="text-sm text-neutral-400 col-span-full">No business types configured. Please complete onboarding.</p>
              )}
            </div>
          </div>

          {/* CSV Preview */}
          {csvPreview && (
            <div className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-8 overflow-x-auto">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 flex-1">
                  Preview: {csvPreview.total} product{csvPreview.total !== 1 ? 's' : ''} found
                </h3>
                <button
                  onClick={() => { setCsvFile(null); setCsvPreview(null); setCsvErrors([]); setCsvExcluded(new Set()); }}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Remove
                </button>
              </div>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left px-2 py-2 font-medium text-neutral-500 whitespace-nowrap w-8"></th>
                      {csvPreview.headers.map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                      ))}
                      <th className="text-left px-2 py-2 font-medium text-neutral-500 whitespace-nowrap w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i} className={`border-b border-neutral-100 ${!row.valid ? 'bg-red-50/30' : ''}`}>
                        {/* Exclude checkbox */}
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={!csvExcluded.has(i)}
                            onChange={() => {
                              setCsvExcluded((prev) => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i); else next.add(i);
                                return next;
                              });
                            }}
                            className="w-4 h-4 rounded border-neutral-300 text-[#312E81] focus:ring-[#312E81]/20"
                          />
                        </td>
                        {row.cells.map((cell, j) => (
                          <td key={j} className={`px-3 py-2 whitespace-nowrap ${row.valid ? 'text-neutral-700' : 'text-neutral-400'}`}>{cell}</td>
                        ))}
                        {/* Status */}
                        <td className="px-2 py-2">
                          {row.valid ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                                <Check size={11} className="text-[#10B981]" />
                              </div>
                              <span className="text-[11px] text-[#065F46]">Valid</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group relative">
                              <div className="w-4 h-4 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                                <X size={11} className="text-[#EF4444]" />
                              </div>
                              <span className="text-[11px] text-[#991B1B]">Error</span>
                              {/* Tooltip */}
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10">
                                <div className="bg-neutral-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                                  {row.errors.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvPreview.total > 10 && (
                <p className="text-xs text-neutral-400 mt-2">Showing first 10 of {csvPreview.total} rows</p>
              )}

              {/* CSV Errors */}
              {csvErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  {csvErrors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700 leading-relaxed">{err}</p>
                  ))}
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleCsvImport}
                disabled={csvImporting}
                className="mt-4 h-12 px-6 bg-[#312E81] text-white rounded-xl text-sm font-medium hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {csvImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Import {(() => { const all = csvPreview.allRows || []; return all.filter((r, i) => r.valid && !csvExcluded.has(i)).length; })()} Products
              </button>
            </div>
          )}
        </div>
      )}

      {/* Animation keyframe */}
      <style>{`
        @keyframes branchDropdownIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AddProductPage;
