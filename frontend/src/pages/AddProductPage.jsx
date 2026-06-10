import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, Upload, Camera, ChevronDown,
  Loader2, Check, AlertTriangle, X, Download,
  TrendingUp, CheckCircle, Package, Eye, Plus,
  FileText, Ban, XCircle, FileWarning, ClipboardList,
  Trash2, Info, RefreshCw,
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
  const [csvExcluded, setCsvExcluded] = useState(new Set());
  const csvFileInputRef = useRef(null);
  const [csvImportState, setCsvImportState] = useState('idle'); // idle|preview|importing|success|error
  const [csvImportProgress, setCsvImportProgress] = useState({ current: 0, total: 0 });
  const [csvImportResult, setCsvImportResult] = useState(null); // { imported, warnings, errors, newCategories }
  const [csvProcessingLive, setCsvProcessingLive] = useState({ imported: [], current: null });
  const [csvImportSettings, setCsvImportSettings] = useState({
    skipErrors: true,
    autoCreateCategories: true,
    updateExisting: false,
  });
  const [dragOver, setDragOver] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState({});
  const [templateDownloaded, setTemplateDownloaded] = useState({});
  const [rulesExpanded, setRulesExpanded] = useState(false);

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

  // ── Auto-toast dismiss (5s for success, 3s for template/error)
  const [toastTimer, setToastTimer] = useState(null);
  useEffect(() => {
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    const duration = toast.type === 'success' || toast.type === 'csv' ? 5000 : 3000;
    const t = setTimeout(() => {
      setToast(null);
      if (toast?.type === 'success') navigate('/dashboard/inventory');
    }, duration);
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

      // Invalidate inventory and dashboard cache for real-time updates
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const productName = form.name.trim();
      if (addAnother) {
        setForm(INITIAL_FORM);
        setErrors({});
        setToast({ message: `${productName} has been added to your inventory.`, productId, productName, type: 'success' });
      } else {
        setToast({ message: `${productName} has been added to your inventory.`, productId, productName, type: 'success' });
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
      setCsvErrors([{ message: 'File must be under 5MB', row: null }]);
      return;
    }
    setCsvFile(file);
    setCsvErrors([]);
    setCsvExcluded(new Set());
    setCsvImportState('preview');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      // Remove BOM if present
      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        setCsvErrors([{ message: 'CSV must have a header row and at least one data row', row: null }]);
        setCsvImportState('error');
        return;
      }
      // Parse CSV properly (handle quoted values)
      const parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"') {
              if (i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              result.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]);
      if (headers.length === 0 || !headers.some((h) => h)) {
        setCsvErrors([{ message: 'No valid headers found in CSV', row: null }]);
        setCsvImportState('error');
        return;
      }

      const allRows = lines.slice(1).map((l) => parseCsvLine(l));
      if (allRows.length > 500) {
        setCsvErrors([{ message: 'Maximum 500 products per file. Found ' + allRows.length + '.', row: null }]);
        setCsvImportState('error');
        return;
      }

      // Column index helpers
      const colIdx = (name) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
      const nameIdx = colIdx('name');
      const catIdx = colIdx('category');
      const buyIdx = colIdx('buyingprice');
      const sellIdx = colIdx('sellingprice');
      const qtyIdx = colIdx('quantity');
      const expiryIdx = colIdx('expirydate');

      // Check required columns
      const missingCols = [];
      if (nameIdx < 0) missingCols.push('name');
      if (catIdx < 0) missingCols.push('category');
      if (buyIdx < 0) missingCols.push('buyingPrice');
      if (sellIdx < 0) missingCols.push('sellingPrice');
      if (qtyIdx < 0) missingCols.push('quantity');
      if (missingCols.length > 0) {
        setCsvErrors([{ message: `Missing required columns: ${missingCols.join(', ')}`, row: null }]);
        setCsvImportState('error');
        return;
      }

      // Detect duplicate names in the file
      const nameCounts = {};
      allRows.forEach((cells) => {
        const n = (cells[nameIdx] || '').trim().toLowerCase();
        if (n) nameCounts[n] = (nameCounts[n] || 0) + 1;
      });

      // Validate each row with detailed status
      const validatedRows = allRows.map((cells) => {
        const errors = [];
        const warnings = [];
        let status = 'valid'; // valid | warning | error

        const name = cells[nameIdx]?.trim() || '';
        const category = cells[catIdx]?.trim() || '';
        const buyingPrice = cells[buyIdx]?.trim() || '';
        const sellingPrice = cells[sellIdx]?.trim() || '';
        const quantity = cells[qtyIdx]?.trim() || '';
        const expiryDate = expiryIdx >= 0 ? (cells[expiryIdx]?.trim() || '') : '';

        // Required field checks → ERROR
        if (!name || name.length < 2) { errors.push('Product name is required (min 2 characters)'); status = 'error'; }
        else if (name.length > 100) { errors.push('Product name must be under 100 characters'); status = 'error'; }

        if (!category) { errors.push('Category is required'); status = 'error'; }

        // Price validation
        const buyNum = Number(buyingPrice);
        const sellNum = Number(sellingPrice);
        if (!buyingPrice || isNaN(buyNum) || buyNum <= 0) { errors.push('Buying price must be a number greater than 0'); status = 'error'; }
        if (!sellingPrice || isNaN(sellNum) || sellNum <= 0) { errors.push('Selling price must be a number greater than 0'); status = 'error'; }
        if (buyNum < 0) { errors.push('Buying price cannot be negative'); status = 'error'; }
        if (sellNum < 0) { errors.push('Selling price cannot be negative'); status = 'error'; }

        // Selling below cost → WARNING
        if (status !== 'error' && buyNum > 0 && sellNum > 0 && sellNum < buyNum) {
          warnings.push(`Selling price (KSh ${sellNum.toLocaleString()}) is below buying price (KSh ${buyNum.toLocaleString()})`);
          status = 'warning';
        }

        // Quantity validation
        const qtyNum = Number(quantity);
        if (quantity === '' || isNaN(qtyNum) || qtyNum < 0) { errors.push('Quantity must be a valid number (0 or greater)'); status = 'error'; }

        // Expiry date validation
        if (expiryDate) {
          let parsedDate = null;
          // Try YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
            parsedDate = new Date(expiryDate);
          }
          // Try DD/MM/YYYY
          else if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate)) {
            const [d, m, y] = expiryDate.split('/');
            parsedDate = new Date(+y, +m - 1, +d);
          }
          if (!parsedDate || isNaN(parsedDate.getTime())) {
            errors.push(`Invalid expiry date format: "${expiryDate}". Use YYYY-MM-DD`);
            status = status === 'warning' ? 'warning' : 'error';
          } else if (parsedDate < new Date()) {
            warnings.push(`Product expired on ${parsedDate.toLocaleDateString()}`);
            if (status === 'valid') status = 'warning';
          }
        }

        // Duplicate name in file → WARNING
        const nameKey = name.toLowerCase();
        if (nameKey && nameCounts[nameKey] > 1 && status !== 'error') {
          warnings.push('Duplicate product name in this file');
          if (status === 'valid') status = 'warning';
        }

        return { cells, status, errors, warnings };
      });

      const displayRows = validatedRows.slice(0, 10);
      setCsvPreview({ headers, rows: displayRows, total: validatedRows.length, allRows: validatedRows });
    };
    reader.readAsText(file);
  };

  const clearCsv = () => {
    setCsvFile(null);
    setCsvPreview(null);
    setCsvErrors([]);
    setCsvExcluded(new Set());
    setCsvImportState('idle');
    setCsvImportResult(null);
    setCsvImportProgress({ current: 0, total: 0 });
    setCsvProcessingLive({ imported: [], current: null });
  };

  const handleCsvImport = async () => {
    if (!csvFile || !csvPreview) return;
    const allRows = csvPreview.allRows || [];

    // Determine which rows to import based on settings
    let rowsToImport;
    if (csvImportSettings.skipErrors) {
      rowsToImport = allRows.filter((r, i) => r.status !== 'error' && !csvExcluded.has(i));
    } else {
      rowsToImport = allRows.filter((r, i) => !csvExcluded.has(i));
    }

    if (rowsToImport.length === 0) {
      setCsvErrors([{ message: 'No products to import. All rows have errors or are excluded.', row: null }]);
      return;
    }

    setCsvImportState('importing');
    setCsvImportProgress({ current: 0, total: rowsToImport.length });
    setCsvProcessingLive({ imported: [], current: null });
    setCsvErrors([]);

    try {
      const token = await getToken();
      // Import in batches of 25 for progress simulation
      const batchSize = 25;
      let totalImported = 0;
      let totalSkipped = 0;
      let totalWarnings = 0;
      let totalErrors = 0;
      const newCategories = [];
      let allValidationErrors = [];
      const importedNames = [];

      for (let i = 0; i < rowsToImport.length; i += batchSize) {
        const batch = rowsToImport.slice(i, i + batchSize);
        const products = batch.map((r) => {
          const obj = {};
          csvPreview.headers.forEach((h, j) => { obj[h.toLowerCase()] = r.cells[j] || ''; });
          return {
            name: obj.name,
            category: obj.category,
            buyingPrice: obj.buyingprice || obj.buyingprice,
            sellingPrice: obj.sellingprice,
            quantity: obj.quantity,
            size: obj.size,
            color: obj.color,
            brand: obj.brand,
            material: obj.material,
            unit: obj.unit,
            expiryDate: obj.expirydate,
            description: obj.description,
            sku: obj.sku,
          };
        });

        // Show the first product of this batch as "currently importing"
        const currentProductName = products[0]?.name || '...';
        setCsvProcessingLive((prev) => ({ imported: prev.imported, current: currentProductName }));

        const res = await fetch(`${API_BASE_URL}/products/import`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products,
            autoCreateCategories: csvImportSettings.autoCreateCategories,
            updateExisting: csvImportSettings.updateExisting,
          }),
        });
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.message || 'Import failed');
        }

        totalImported += result.data?.imported || 0;
        totalSkipped += result.data?.skipped || 0;
        if (result.data?.newCategories) {
          newCategories.push(...result.data.newCategories);
        }
        if (result.data?.validationErrors) {
          allValidationErrors = allValidationErrors.concat(result.data.validationErrors);
        }

        // Track imported product names (last 3 for live display)
        batch.forEach((r) => {
          const name = csvPreview.headers
            .map((h, hi) => h.toLowerCase() === 'name' ? r.cells[hi]?.trim() : null)
            .find(Boolean);
          if (name) importedNames.push(name);
        });

        // Update progress + live list (keep last 3 imported)
        setCsvImportProgress({
          current: Math.min(i + batchSize, rowsToImport.length),
          total: rowsToImport.length,
        });
        setCsvProcessingLive({
          imported: importedNames.slice(-3),
          current: null,
        });
      }

      // Count warnings from the preview
      const warningRows = rowsToImport.filter((r) => r.status === 'warning');
      totalWarnings = warningRows.length;

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      setCsvImportResult({
        imported: totalImported,
        warnings: totalWarnings,
        errors: totalErrors,
        skipped: totalSkipped,
        newCategories: [...new Set(newCategories)],
        validationErrors: allValidationErrors,
      });
      setCsvImportState('success');
    } catch (err) {
      setCsvErrors([{ message: err.message || 'Import failed. Please check your file and try again.', row: null }]);
      setCsvImportState('error');
    } finally {
      // import state already handled in try/catch
    }
  };

  const handleTemplateDownload = async (btId) => {
    // Prevent double-clicks
    if (templateDownloading[btId]) return;

    setTemplateDownloading((prev) => ({ ...prev, [btId]: true }));
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/products/template?businessType=${btId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dukaflow-${btId}-template.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setTemplateDownloading((prev) => ({ ...prev, [btId]: false }));
      setTemplateDownloaded((prev) => ({ ...prev, [btId]: true }));
      setTimeout(() => {
        setTemplateDownloaded((prev) => ({ ...prev, [btId]: false }));
      }, 2000);
      setToast({ message: 'Template downloaded', type: 'template' });
    } catch (err) {
      console.error('Template download error:', err);
      setTemplateDownloading((prev) => ({ ...prev, [btId]: false }));
      setToast({ message: 'Failed to download template', type: 'error' });
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
        <div className={`
          fixed top-4 right-4 z-50 flex flex-col gap-3 px-5 py-4 rounded-[14px] shadow-xl animate-branchDropdownIn max-w-sm border
          ${toast.type === 'error'
            ? 'bg-[#FEF2F2] border-[#FECACA]'
            : toast.type === 'template'
              ? 'bg-white border-[#A7F3D0]'
              : 'bg-white border-[#D1FAE5]'
          }
        `} style={toast.type !== 'error' ? { borderLeft: '4px solid #10B981' } : {}}>
          <div className="flex items-start gap-3">
            {toast.type === 'error' ? (
              <AlertTriangle size={20} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={20} className="text-[#10B981] flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${toast.type === 'error' ? 'text-[#991B1B]' : 'text-neutral-900'}`}>
                {toast.type === 'error'
                  ? 'Download Failed'
                  : toast.type === 'csv'
                    ? 'Import Complete!'
                    : toast.type === 'template'
                      ? 'Template Downloaded'
                      : 'Product Added Successfully!'}
              </p>
              <p className={`text-[14px] mt-0.5 ${toast.type === 'error' ? 'text-[#991B1B]' : 'text-neutral-600'}`}>
                {toast.message || toast}
              </p>
            </div>
          </div>
          {(toast.type === 'success' || toast.type === 'csv') && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearTimeout(toastTimer);
                  setToast(null);
                  if (toast.type === 'success' && toast.productId) {
                    navigate(`/dashboard/inventory/${toast.productId}`);
                  } else {
                    navigate('/dashboard/inventory');
                  }
                }}
                className="flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Eye size={15} />
                {toast.type === 'csv' ? 'View Inventory' : 'View Product'}
              </button>
              <button
                onClick={() => {
                  clearTimeout(toastTimer);
                  setToast(null);
                  if (toast.type === 'success') {
                    setForm(INITIAL_FORM);
                    setErrors({});
                  } else {
                    setCsvFile(null);
                    setCsvPreview(null);
                    setCsvErrors([]);
                    setCsvExcluded(new Set());
                  }
                }}
                className="flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-white bg-[#312E81] rounded-lg hover:bg-[#1E1B4B] transition-colors"
              >
                <Plus size={15} />
                {toast.type === 'csv' ? 'Import More' : 'Add Another'}
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
      {activeTab === 'csv' && (() => {
        const importStep =
          csvImportState === 'success' ? 3 :
          (csvImportState === 'preview' || csvImportState === 'importing') ? 2 : 1;

        return (
        <div className="space-y-6">
          {/* ── 3-Step Progress Indicator ── */}
          <div className="flex items-center justify-center gap-0 mb-2">
            {['Upload File', 'Review', 'Complete'].map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = importStep === stepNum;
              const isDone = importStep > stepNum;
              return (
                <div key={label} className="flex items-center">
                  {idx > 0 && (
                    <div className={`h-0.5 w-6 sm:w-16 mx-1 rounded-full transition-colors ${isDone ? 'bg-[#312E81]' : 'bg-neutral-200'}`} />
                  )}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone ? 'bg-[#312E81] text-white' : isActive ? 'bg-[#312E81] text-white ring-4 ring-[#EEF2FF]' : 'bg-neutral-100 text-neutral-400'}`}>
                      {isDone ? <Check size={13} /> : stepNum}
                    </div>
                    <span className={`text-[10px] mt-1.5 whitespace-nowrap font-medium hidden sm:inline ${isActive ? 'text-[#312E81]' : isDone ? 'text-neutral-600' : 'text-neutral-400'}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ────────────────────────────────────────
             STEP 1: UPLOAD FILE
             ──────────────────────────────────────── */}
          {(importStep === 1 || (csvImportState === 'error' && !csvPreview)) && (
          <>
            {/* Dropzone */}
            {!csvFile && (
              <div
                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-neutral-50 cursor-pointer transition-all duration-200 py-6 sm:py-14 px-4 sm:px-6 ${dragOver ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-neutral-300 hover:border-[#312E81] hover:bg-[#EEF2FF]'}`}
                onClick={() => csvFileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const fakeEvent = { target: { files: [file] } };
                    handleCsvSelect(fakeEvent);
                  }
                }}
              >
                <Upload size={48} className="text-neutral-300 mb-4" />
                <p className="text-[15px] text-neutral-600 font-medium">Drag and drop your CSV file here</p>
                <p className="text-[15px] text-neutral-500 mt-0.5">or click to browse</p>
                <p className="text-[13px] text-neutral-400 mt-3">CSV or XLSX up to 5 MB</p>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleCsvSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Global CSV Errors */}
            {csvImportState === 'error' && csvErrors.length > 0 && !csvPreview && (
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-5">
                  <XCircle size={48} className="text-[#EF4444]" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 mb-2">Import Failed</h2>
                <p className="text-sm text-neutral-500 mb-5 max-w-xs mx-auto">{csvErrors[0]?.message || 'Something went wrong while importing your file.'}</p>

                {/* Checklist */}
                <div className="bg-[#F8FAFC] rounded-xl border border-neutral-100 p-4 sm:p-5 mb-6 text-left">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Please check:</p>
                  <ul className="space-y-2">
                    {[
                      'Your file is in CSV or XLSX format',
                      'All required columns are present',
                      'No more than 500 rows',
                      'File size is under 5MB',
                      'All prices are valid numbers',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-600">
                        <span className="text-neutral-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => { clearCsv(); csvFileInputRef.current?.click(); }}
                    className="w-full h-[52px] bg-[#312E81] text-white rounded-xl text-[15px] font-semibold hover:bg-[#1E1B4B] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#312E81]/20"
                  >
                    <RefreshCw size={18} /> Try Again
                  </button>
                  <button
                    onClick={() => { businessTypeIds.length > 0 && handleTemplateDownload(businessTypeIds[0]); }}
                    className="w-full h-[52px] border border-neutral-300 text-neutral-700 rounded-xl text-[15px] font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Download Correct Template
                  </button>
                </div>
              </div>
            )}

            {/* Before you upload — Rules Panel (collapsible on mobile) */}
            {!csvFile && csvImportState !== 'error' && (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
              <button
                onClick={() => setRulesExpanded(!rulesExpanded)}
                className="w-full flex items-center gap-2 cursor-pointer sm:cursor-default"
              >
                <ClipboardList size={18} className="text-[#312E81]" />
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide flex-1 text-left">Before you upload</h3>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform sm:hidden ${rulesExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div className={`${rulesExpanded ? 'block' : 'hidden'} sm:block`}>
              <div className="space-y-4 mt-4">
                {/* File Requirements */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">📋 File Requirements</p>
                  <ul className="space-y-1.5">
                    {[
                      'File must be CSV (comma-separated) or XLSX format',
                      'Maximum 500 products per file',
                      'File size must be under 5MB',
                      'First row must contain column headers (name, category, etc.)',
                      'Required columns: name, category, buyingPrice, sellingPrice, quantity',
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-600">
                        <Check size={14} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Important Notes */}
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide mb-2">⚠️ Important</p>
                  <ul className="space-y-1.5">
                    {[
                      'All prices should be in Kenyan Shillings (KSh) — no commas or symbols',
                      'Category names must match your existing categories or new ones will be created',
                      'Dates should be in YYYY-MM-DD format (e.g., 2026-12-15)',
                      'Products with the same name will be skipped (no duplicates)',
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-600">
                        <span className="text-[11px] text-neutral-400 flex-shrink-0 mt-0.5">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              </div>
            </div>
            )}

            {/* Download Template */}
            {!csvFile && csvImportState !== 'error' && (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-2">
                <Download size={18} className="text-[#312E81]" />
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Don&apos;t have a CSV file?</h3>
              </div>
              <p className="text-sm text-neutral-500 mb-5">Download a pre-formatted CSV template matching your business type{businessTypeIds.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {businessTypeIds.map((btId) => {
                  const cfg = BUSINESS_TYPE_CONFIG[btId];
                  const isDownloading = templateDownloading[btId];
                  const isDownloaded = templateDownloaded[btId];
                  return (
                    <button
                      key={btId}
                      onClick={() => handleTemplateDownload(btId)}
                      disabled={isDownloading}
                      className={`flex items-center gap-3 sm:gap-3.5 px-4 sm:px-5 py-3.5 sm:py-[18px] bg-white border-[1.5px] rounded-[14px] text-left transition-all duration-150 group ${isDownloaded ? 'border-[#10B981] bg-[#ECFDF5]' : isDownloading ? 'border-[#312E81] bg-[#EEF2FF] cursor-wait' : 'border-neutral-300 hover:border-[#312E81] hover:bg-[#EEF2FF] hover:shadow-sm'}`}
                    >
                      {isDownloading ? (
                        <Loader2 size={20} className="sm:size-6 text-[#312E81] flex-shrink-0 animate-spin" />
                      ) : isDownloaded ? (
                        <Check size={20} className="sm:size-6 text-[#10B981] flex-shrink-0" />
                      ) : (
                        <Download size={20} className="sm:size-6 text-[#312E81] flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[15px] sm:text-base font-semibold text-neutral-900 truncate">{cfg?.name || btId}</p>
                        <p className={`text-xs sm:text-[13px] ${isDownloaded ? 'text-[#10B981] font-medium' : 'text-neutral-500'}`}>
                          {isDownloading ? 'Downloading…' : isDownloaded ? 'Downloaded!' : 'CSV template'}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {businessTypeIds.length === 0 && (
                  <p className="text-sm text-neutral-400 col-span-full">No business types configured. Please complete onboarding.</p>
                )}
              </div>
            </div>
            )}
          </>
          )}

          {/* ────────────────────────────────────────
             PROCESSING STATE (importing)
             ──────────────────────────────────────── */}
          {csvImportState === 'importing' && (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8">
              {/* Spinner + Header */}
              <div className="flex items-center gap-3 mb-5">
                <Loader2 size={22} className="text-[#312E81] animate-spin flex-shrink-0" />
                <div>
                  <p className="text-[18px] font-semibold text-neutral-900">Importing your products...</p>
                  <p className="text-sm text-neutral-500 mt-0.5">Adding products to your inventory</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#312E81] rounded-full transition-all duration-500"
                  style={{ width: csvImportProgress.total > 0 ? `${Math.round((csvImportProgress.current / csvImportProgress.total) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-[13px] text-neutral-600 font-medium mb-5">
                {csvImportProgress.current} of {csvImportProgress.total}
              </p>

              {/* Live Product List */}
              <div className="space-y-2 mb-5">
                {csvProcessingLive.imported.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 animate-fade-in">
                    <div className="w-5 h-5 rounded-full bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-[#10B981]" />
                    </div>
                    <span className="text-[14px] text-neutral-600">{name} added</span>
                  </div>
                ))}
                {csvProcessingLive.current && (
                  <div className="flex items-center gap-2.5">
                    <Loader2 size={16} className="text-[#312E81] animate-spin flex-shrink-0" />
                    <span className="text-[14px] text-neutral-400">Importing {csvProcessingLive.current}...</span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-center gap-2 text-[13px] text-neutral-400 pt-3 border-t border-neutral-100">
                <Info size={14} className="flex-shrink-0" />
                Please don&apos;t close this page while importing.
              </div>
            </div>
          )}

          {/* ── File Info Card (after file selected, during preview) ── */}
          {csvFile && csvImportState === 'preview' && (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-[#312E81]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-neutral-900 truncate">{csvFile.name}</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {csvPreview ? `${csvPreview.total} products found` : 'Processing...'}{csvFile.size ? ` · ${(csvFile.size / 1024).toFixed(0)}KB` : ''}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => csvFileInputRef.current?.click()}
                    className="h-9 px-3.5 text-[13px] font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={clearCsv}
                    className="h-9 px-3.5 text-[13px] font-medium text-[#EF4444] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors"
                  >
                    Remove File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CSV Preview (after validation) ── */}
          {csvPreview && csvImportState === 'preview' && (() => {
            const allRows = csvPreview.allRows || [];
            const validCount = allRows.filter((r) => r.status === 'valid').length;
            const warningCount = allRows.filter((r) => r.status === 'warning').length;
            const errorCount = allRows.filter((r) => r.status === 'error').length;
            const importableCount = allRows.filter((r, i) => {
              if (csvImportSettings.skipErrors && r.status === 'error') return false;
              return !csvExcluded.has(i);
            }).length;
            const allSelected = allRows.every((r, i) => {
              if (csvImportSettings.skipErrors && r.status === 'error') return true;
              return !csvExcluded.has(i);
            });

            return (
              <>
                {/* Validation Summary */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Validation Summary</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-[#ECFDF5] rounded-xl p-3 sm:p-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <CheckCircle size={18} className="text-[#10B981]" />
                        <span className="text-2xl sm:text-[28px] font-bold text-[#10B981]">{validCount}</span>
                      </div>
                      <p className="text-[11px] sm:text-[13px] font-medium text-[#065F46] mt-1">Valid</p>
                      <p className="text-[10px] sm:text-[12px] text-[#065F46]/70 mt-0.5">Will be imported</p>
                    </div>
                    <div className="bg-[#FFFBEB] rounded-xl p-3 sm:p-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <AlertTriangle size={18} className="text-[#F59E0B]" />
                        <span className="text-2xl sm:text-[28px] font-bold text-[#F59E0B]">{warningCount}</span>
                      </div>
                      <p className="text-[11px] sm:text-[13px] font-medium text-[#92400E] mt-1">Warnings</p>
                      <p className="text-[10px] sm:text-[12px] text-[#92400E]/70 mt-0.5">Will be imported (with issues)</p>
                    </div>
                    <div className="bg-[#FEF2F2] rounded-xl p-3 sm:p-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Ban size={18} className="text-[#EF4444]" />
                        <span className="text-2xl sm:text-[28px] font-bold text-[#EF4444]">{errorCount}</span>
                      </div>
                      <p className="text-[11px] sm:text-[13px] font-medium text-[#991B1B] mt-1">Errors</p>
                      <p className="text-[10px] sm:text-[12px] text-[#991B1B]/70 mt-0.5">Will be skipped</p>
                    </div>
                  </div>
                </div>

                {/* Product Preview Table */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6 overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Product Preview</h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          setCsvExcluded((prev) => {
                            const next = new Set(prev);
                            allRows.forEach((r, i) => {
                              if (csvImportSettings.skipErrors && r.status === 'error') {
                                next.delete(i);
                              } else if (allSelected) {
                                next.add(i);
                              } else {
                                next.delete(i);
                              }
                            });
                            return next;
                          });
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-[#312E81] focus:ring-[#312E81]/20"
                      />
                      <span className="text-[12px] font-medium text-neutral-600">Select All</span>
                    </label>
                  </div>
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left px-2 py-2.5 font-medium text-neutral-500 whitespace-nowrap w-8"></th>
                          {csvPreview.headers.slice(0, 7).map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 font-medium text-neutral-500 whitespace-nowrap">{h}</th>
                          ))}
                          {csvPreview.headers.length > 7 && (
                            <th className="text-left px-3 py-2.5 font-medium text-neutral-500 whitespace-nowrap">...</th>
                          )}
                          <th className="text-left px-2 py-2.5 font-medium text-neutral-500 whitespace-nowrap w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.map((row, i) => {
                          const statusColors = row.status === 'valid'
                            ? { bg: 'bg-[#ECFDF5]', text: 'text-[#065F46]', dot: 'bg-[#10B981]' }
                            : row.status === 'warning'
                              ? { bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', dot: 'bg-[#F59E0B]' }
                              : { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', dot: 'bg-[#EF4444]' };
                          const statusLabel = row.status === 'valid' ? '✅ Valid' : row.status === 'warning' ? '⚠️ Warning' : '❌ Error';
                          return (
                            <tr key={i} className={`border-b border-neutral-100 ${row.status === 'error' ? 'bg-red-50/30' : row.status === 'warning' ? 'bg-amber-50/20' : ''}`}>
                              <td className="px-2 py-2.5">
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
                              {row.cells.slice(0, 7).map((cell, j) => (
                                <td key={j} className={`px-3 py-2.5 whitespace-nowrap ${row.status === 'error' ? 'text-neutral-400' : 'text-neutral-700'}`}>{cell}</td>
                              ))}
                              {csvPreview.headers.length > 7 && (
                                <td className="px-3 py-2.5 whitespace-nowrap text-neutral-400">+{csvPreview.headers.length - 7} more</td>
                              )}
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-1.5 group relative">
                                  <div className={`w-4 h-4 rounded-full ${statusColors.bg} flex items-center justify-center`}>
                                    {row.status === 'valid' ? <Check size={10} className="text-[#10B981]" />
                                    : row.status === 'warning' ? <AlertTriangle size={10} className="text-[#F59E0B]" />
                                    : <X size={10} className="text-[#EF4444]" />}
                                  </div>
                                  <span className={`text-[11px] font-medium ${statusColors.text}`}>{statusLabel}</span>
                                  {(row.errors.length > 0 || row.warnings.length > 0) && (
                                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10">
                                      <div className="bg-neutral-800 text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg max-w-[300px]">
                                        {row.errors.map((e, ei) => <p key={ei}>❌ {e}</p>)}
                                        {row.warnings.map((w, wi) => <p key={wi}>⚠️ {w}</p>)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {csvPreview.total > 10 && (
                    <p className="text-xs text-neutral-400 mt-3 text-center">Showing first 10 of {csvPreview.total} rows</p>
                  )}
                </div>

                {/* Warnings & Errors Details */}
                {(warningCount > 0 || errorCount > 0) && (
                  <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Warnings & Errors</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {csvPreview.allRows.map((row, i) => {
                        if (row.status === 'valid') return null;
                        const name = csvPreview.headers.map((h, hi) => h.toLowerCase() === 'name' ? row.cells[hi] : null).find(Boolean) || `Row ${i + 2}`;
                        return (
                          <div key={i} className={`p-3 rounded-lg text-[13px] ${row.status === 'error' ? 'bg-[#FEF2F2] border border-[#FECACA]' : 'bg-[#FFFBEB] border border-[#FDE68A]'}`}>
                            <div className="flex items-start gap-2">
                              {row.status === 'error' ? <XCircle size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />}
                              <div>
                                <p className="font-semibold text-neutral-800">{name}</p>
                                {row.errors.map((e, ei) => <p key={ei} className="text-[#991B1B] mt-0.5">{e}</p>)}
                                {row.warnings.map((w, wi) => <p key={wi} className="text-[#92400E] mt-0.5">{w}</p>)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Global CSV Errors */}
                {csvErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    {csvErrors.map((err, i) => (
                      <p key={i} className="text-sm text-red-700 leading-relaxed">{err.message || err}</p>
                    ))}
                  </div>
                )}

                {/* Import Settings */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Import Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csvImportSettings.skipErrors}
                        onChange={(e) => setCsvImportSettings((s) => ({ ...s, skipErrors: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#312E81]"
                      />
                      <div>
                        <span className="text-sm text-neutral-700 font-medium">Skip rows with errors</span>
                        <span className="text-xs text-neutral-400 ml-1">(recommended)</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"    
                        checked={csvImportSettings.autoCreateCategories}
                        onChange={(e) => setCsvImportSettings((s) => ({ ...s, autoCreateCategories: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#312E81]"
                      />
                      <span className="text-sm text-neutral-700">Auto-create new categories if not found</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csvImportSettings.updateExisting}
                        onChange={(e) => setCsvImportSettings((s) => ({ ...s, updateExisting: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#312E81]"
                      />
                      <span className="text-sm text-neutral-700">Update existing products with same name</span>
                    </label>
                  </div>
                </div>

                {/* Import Button */}
                <button
                  onClick={handleCsvImport}
                  disabled={importableCount === 0}
                  className="w-full h-[52px] bg-[#312E81] text-white rounded-xl text-[15px] font-semibold hover:bg-[#1E1B4B] transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-[#312E81]/20"
                >
                  <Upload size={18} />
                  Import {importableCount} Product{importableCount !== 1 ? 's' : ''}
                </button>

                {/* Cancel */}
                <button
                  onClick={clearCsv}
                  className="w-full h-12 border border-neutral-200 text-neutral-500 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            );
          })()}

          {/* ────────────────────────────────────────
             STEP 3: COMPLETE
             ──────────────────────────────────────── */}
          {activeTab === 'csv' && csvImportState === 'success' && csvImportResult && (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8 text-center">
              {/* Success Icon */}
              <div className="w-24 h-24 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={56} className="text-[#10B981]" strokeWidth={2.5} />
              </div>
              <h2 className="text-[22px] font-bold text-neutral-900 mb-1">Import Complete!</h2>
              <p className="text-sm text-neutral-500 mb-6">{csvImportResult.imported} products added to your inventory</p>

              {/* Summary Card */}
              <div className="bg-[#F8FAFC] rounded-xl border border-neutral-100 p-5 mb-6 text-left">
                <div className="space-y-2.5">
                  {/* Imported successfully */}
                  <div className="flex items-center gap-2.5">
                    <CheckCircle size={16} className="text-[#10B981] flex-shrink-0" />
                    <span className="text-sm text-neutral-700 font-medium">{csvImportResult.imported} product{csvImportResult.imported !== 1 ? 's' : ''} imported successfully</span>
                  </div>
                  {/* Warnings */}
                  {csvImportResult.warnings > 0 && (
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle size={16} className="text-[#F59E0B] flex-shrink-0" />
                      <span className="text-sm text-neutral-700 font-medium">{csvImportResult.warnings} product{csvImportResult.warnings !== 1 ? 's' : ''} imported with warnings</span>
                    </div>
                  )}
                  {/* Skipped */}
                  {csvImportResult.skipped > 0 && (
                    <div className="flex items-center gap-2.5">
                      <XCircle size={16} className="text-[#EF4444] flex-shrink-0" />
                      <span className="text-sm text-neutral-700 font-medium">{csvImportResult.skipped} product{csvImportResult.skipped !== 1 ? 's' : ''} skipped (errors)</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-neutral-200 my-3" />

                  {/* Added to inventory */}
                  <div className="flex items-center gap-2.5">
                    <Package size={16} className="text-[#312E81] flex-shrink-0" />
                    <span className="text-sm text-neutral-700 font-medium">{csvImportResult.imported} new product{csvImportResult.imported !== 1 ? 's' : ''} added to your inventory</span>
                  </div>
                  {/* New categories */}
                  {csvImportResult.newCategories?.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <Info size={16} className="text-[#312E81] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-neutral-700 font-medium">
                        {csvImportResult.newCategories.length} new categor{csvImportResult.newCategories.length === 1 ? 'y' : 'ies'} created: <span className="text-[#312E81]">{csvImportResult.newCategories.join(', ')}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => { clearCsv(); navigate('/dashboard/inventory'); }}
                  className="w-full h-[52px] bg-[#312E81] text-white rounded-xl text-[15px] font-semibold hover:bg-[#1E1B4B] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#312E81]/20"
                >
                  <Eye size={18} /> View in Inventory
                </button>
                <button
                  onClick={clearCsv}
                  className="w-full h-[52px] border border-neutral-300 text-neutral-700 rounded-xl text-[15px] font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Import More Products
                </button>
              </div>
            </div>
          )}
        </div>
        );
      })()}

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
 