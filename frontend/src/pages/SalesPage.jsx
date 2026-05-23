import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, Banknote, Smartphone,
  Loader2, AlertCircle, X, User, CheckCircle, Printer, Share2, XCircle, Info,
  Zap, Hash, Phone, Calendar, ArrowRight, Package,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useSalesQuery, useWorkersQuery } from '../hooks/useSalesQuery';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import ReceiptView, { printReceipt, generateWhatsAppMessage } from '../components/sales/ReceiptView';
import TransactionHistory from '../components/sales/TransactionHistory';
import { markFirstSale } from '../hooks/usePwaInstall';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getStockLabel = (product) => {
  if (product.stock <= 0) return { label: 'Out of Stock', color: 'bg-[#EF4444]', text: 'text-[#EF4444]' };
  if (product.status === 'low_stock' || product.stock <= (product.lowStockThreshold || 10))
    return { label: `Low Stock (${product.stock})`, color: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' };
  return { label: `In Stock (${product.stock})`, color: 'bg-[#10B981]', text: 'text-[#10B981]' };
};

const getAttrSummary = (product) => {
  const attrs = [];
  if (product.attributes?.size) attrs.push(product.attributes.size);
  if (product.attributes?.color) attrs.push(product.attributes.color);
  if (product.attributes?.material) attrs.push(product.attributes.material);
  return attrs.join(', ');
};

const PosSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-4 animate-pulse">
    <div className="lg:w-[60%] space-y-4">
      <div className="h-12 bg-neutral-200 rounded-xl" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (<div key={i} className="h-9 w-20 bg-neutral-200 rounded-full" />))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(9)].map((_, i) => (<div key={i} className="h-28 bg-neutral-200 rounded-xl" />))}
      </div>
    </div>
    <div className="lg:w-[40%]">
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 h-96" />
    </div>
  </div>
);

const PosError = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
      <AlertCircle size={32} className="text-[#EF4444]" />
    </div>
    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Failed to Load Products</h2>
    <p className="text-sm text-[#64748B] max-w-md mb-6">Unable to load products for sale. Please check your connection.</p>
    <button onClick={onRetry} className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium">Try Again</button>
  </div>
);

const PosEmpty = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main empty state */}
      <div className="lg:w-[60%] flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] py-8 sm:py-10 lg:py-16 px-4 sm:px-5 lg:px-6 text-center">
        <ShoppingCart size={64} className="text-neutral-300 mb-4 sm:mb-5 lg:mb-6 hidden sm:block" />
        <ShoppingCart size={48} className="text-neutral-300 mb-5 sm:hidden" />
        <h2 className="text-lg sm:text-xl lg:text-[22px] font-bold text-neutral-900 mb-2 sm:mb-3">No products to sell yet</h2>
        <p className="text-sm sm:text-sm lg:text-[15px] text-neutral-500 max-w-[300px] sm:max-w-[360px] lg:max-w-[400px] mb-6 sm:mb-7 lg:mb-8 leading-relaxed sm:leading-relaxed lg:leading-[1.6]">
          Add products to your inventory first, then come back here to record sales.
        </p>
        <div className="flex flex-col items-center gap-3 sm:gap-3 lg:gap-4 w-full max-w-[320px] sm:max-w-[320px] lg:max-w-xs">
          <button
            onClick={() => navigate('/dashboard/inventory')}
            className="w-full sm:w-auto lg:w-auto h-12 px-6 sm:px-7 lg:px-7 bg-[#312E81] text-white rounded-xl font-semibold text-[15px] sm:text-sm lg:text-base flex items-center justify-center gap-2 sm:gap-3 shadow-sm hover:bg-[#1E1B4B] hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-[#EEF2FF] focus:outline-none transition-all duration-200 cursor-pointer"
          >
            <Package size={18} /> Go to Inventory →
          </button>
          <button
            onClick={() => navigate('/dashboard/inventory/add')}
            className="text-sm text-[#312E81] hover:underline font-medium transition-all duration-150"
          >
            Add your first product →
          </button>
        </div>
      </div>
      {/* Right panel — cart empty */}
      <div className="lg:w-[40%]">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
          <ShoppingCart size={40} className="text-neutral-200 mb-4" />
          <p className="text-[15px] text-neutral-500 font-medium">Cart is empty</p>
          <p className="text-[13px] text-neutral-400 mt-1 max-w-[200px] text-center">Add products from inventory</p>
        </div>
      </div>
    </div>
  );
};

const SalesPage = () => {
  const { userId, getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const filters = useMemo(() => ({ search: debouncedSearch, category: selectedCategory, sortBy: 'name', sortOrder: 'asc' }), [debouncedSearch, selectedCategory]);
  const { data: posData, isLoading, isError, refetch } = useSalesQuery(filters);
  const { data: workers = [] } = useWorkersQuery();

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState({ type: 'amount', value: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [soldBy, setSoldBy] = useState(userId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaConfirmed, setMpesaConfirmed] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Credit customer autocomplete
  const [creditCustomers, setCreditCustomers] = useState([]);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const creditDropdownRef = useRef(null);

  // Checkout flow states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [saleResult, setSaleResult] = useState(null);
  const [saleErrorMsg, setSaleErrorMsg] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  // Shop info for receipt
  const [shopInfo, setShopInfo] = useState(null);

  const fetchShopInfo = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/shop/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        if (result.success) setShopInfo(result.data);
      }
    } catch { /* non-critical */ }
  }, [getToken]);

  // Fetch credit customers for autocomplete
  const fetchCreditCustomers = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/sales/customers`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const result = await res.json();
        if (result.success) setCreditCustomers(result.data || []);
      }
    } catch { /* non-critical */ }
  }, [getToken]);

  // Click outside to close credit dropdown
  useEffect(() => {
    if (!showCreditDropdown) return;
    const handler = (e) => {
      if (creditDropdownRef.current && !creditDropdownRef.current.contains(e.target)) {
        setShowCreditDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCreditDropdown]);

  const products = posData?.products || [];
  const categories = posData?.categories || [];
  const hasProducts = posData?.hasProducts ?? false;

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socket.on('product:updated', () => queryClient.invalidateQueries({ queryKey: ['sales', 'products'] }));
    socket.on('stock:updated', () => queryClient.invalidateQueries({ queryKey: ['sales', 'products'] }));
    socket.on('product:deleted', () => queryClient.invalidateQueries({ queryKey: ['sales', 'products'] }));
    return () => { if (socket.connected) socket.disconnect(); };
  }, [queryClient]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > product.stock) return prev;
        return prev.map((item) => item.productId === product._id ? { ...item, quantity: newQty, subtotal: newQty * item.price } : item);
      }
      return [...prev, { productId: product._id, name: product.name, price: product.price, quantity: 1, subtotal: product.price, stock: product.stock, attrs: getAttrSummary(product) }];
    });
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productId !== productId);
      if (newQty > item.stock) return prev;
      return prev.map((i) => i.productId === productId ? { ...i, quantity: newQty, subtotal: newQty * i.price } : i);
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = discount.type === 'percent' && discount.value ? subtotal * (Number(discount.value) / 100) : Number(discount.value) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Initiate checkout → show confirmation modal
  const handleInitiateCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (paymentMethod === 'card' && !customerName.trim()) {
      setSaleErrorMsg('Customer name is required for credit sales');
      return;
    }
    if (paymentMethod === 'mpesa' && !mpesaConfirmed) {
      setSaleErrorMsg('Please confirm you have verified the M-Pesa payment on your phone');
      return;
    }
    setSaleErrorMsg('');
    fetchShopInfo();
    setShowConfirmModal(true);
  }, [cart, paymentMethod, customerName, mpesaConfirmed, fetchShopInfo]);

  // Confirm and process sale
  const handleConfirmSale = useCallback(async () => {
    setShowConfirmModal(false);
    setShowProcessing(true);
    try {
      const token = await getToken();
      const body = {
        items: cart.map((item) => ({
          productId: item.productId, name: item.name, quantity: item.quantity, price: item.price,
        })),
        subtotal, discount: discountAmount, total,
        paymentMethod, paymentStatus: paymentMethod === 'card' ? 'pending' : 'paid',
        amountPaid: paymentMethod === 'card' ? 0 : total,
        soldBy,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        dueDate: paymentMethod === 'card' && dueDate ? new Date(dueDate).toISOString() : undefined,
        paymentDetails: paymentMethod === 'mpesa' ? { mpesaCode, phone: mpesaPhone } : {},
        notes: [creditNotes, mpesaCode ? `M-Pesa: ${mpesaCode}` : ''].filter(Boolean).join(' | ') || undefined,
      };
      const res = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to complete sale');
      }
      const result = await res.json();
      setSaleResult(result.data);
      setShowProcessing(false);
      setShowSuccessModal(true);

      // Notify PWA install trigger that first sale was recorded
      markFirstSale();
      // Clear cart
      setCart([]);
      setDiscount({ type: 'amount', value: '' });
      setCustomerName('');
      setCustomerPhone('');
      setMpesaCode('');
      setMpesaPhone('');
      setDueDate('');
      setCreditNotes('');
      setMpesaConfirmed(false);
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['sales', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      setShowProcessing(false);
      setSaleErrorMsg(err.message || 'Failed to complete sale');
      setShowErrorModal(true);
    }
  }, [cart, subtotal, discountAmount, total, paymentMethod, soldBy, customerName, customerPhone, dueDate, mpesaCode, mpesaPhone, creditNotes, getToken, queryClient]);

  // Reset everything for a new sale
  const handleNewSale = useCallback(() => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setSaleResult(null);
    setSaleErrorMsg('');
    setCart([]);
    setDiscount({ type: 'amount', value: '' });
    setCustomerName('');
    setCustomerPhone('');
    setMpesaCode('');
    setMpesaPhone('');
    setDueDate('');
    setCreditNotes('');
    setMpesaConfirmed(false);
    setPaymentMethod('cash');
  }, []);

  const workerName = workers.find((w) => w._id === soldBy)?.fullName || '';

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); document.querySelector('[placeholder*="Search products"]')?.focus(); }
      if (e.key === 'F8') { e.preventDefault(); handleInitiateCheckout(); }
      if (e.key === 'Escape') { if (showConfirmModal) setShowConfirmModal(false); else if (showSuccessModal) handleNewSale(); else if (showErrorModal) setShowErrorModal(false); }
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) setPaymentMethod('cash');
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) setPaymentMethod('mpesa');
      if (e.key === '3' && !e.ctrlKey && !e.metaKey) setPaymentMethod('card');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleInitiateCheckout, showConfirmModal, showSuccessModal, showErrorModal, handleNewSale]);

  // Default due date for credit
  useEffect(() => {
    if (paymentMethod === 'card' && !dueDate) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [paymentMethod, dueDate]);

  if (activeTab === 'history') {
    return (
      <TransactionHistory
        shopInfo={shopInfo}
        workers={workers}
        onBackToNew={() => setActiveTab('new')}
      />
    );
  }

  if (isLoading) return <PosSkeleton />;
  if (isError) return <PosError onRetry={() => refetch()} />;
  if (!hasProducts) return <PosEmpty />;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-0">
        <button className="px-5 py-3 text-sm font-medium text-[#312E81] border-b-[3px] border-[#312E81]">New Sale</button>
        <button onClick={() => setActiveTab('history')} className="px-5 py-3 text-sm font-medium text-[#64748B] border-b-[3px] border-transparent hover:text-[#334155]">Transaction History</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-[60%] space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Search products by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-12 pl-11 pr-4 bg-white border-[1.5px] border-[#CBD5E1] rounded-xl focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF] outline-none text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${selectedCategory === 'all' ? 'bg-[#312E81] text-white border-[#312E81]' : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#312E81] hover:bg-[#EEF2FF]'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${selectedCategory === cat ? 'bg-[#312E81] text-white border-[#312E81]' : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#312E81] hover:bg-[#EEF2FF]'}`}>{cat}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => {
              const stockInfo = getStockLabel(product);
              const cartQty = cart.find((i) => i.productId === product._id)?.quantity || 0;
              const outOfStock = product.stock <= 0;
              return (
                <button key={product._id} onClick={() => !outOfStock && addToCart(product)} disabled={outOfStock}
                  className={`relative bg-white border rounded-xl p-3 text-left transition-all duration-150 ${outOfStock ? 'opacity-50 border-neutral-100 cursor-default' : cartQty > 0 ? 'border-[#312E81] shadow-sm' : 'border-neutral-100 hover:border-[#312E81] hover:shadow-sm active:scale-[0.98]'}`}>
                  {cartQty > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#312E81] text-white text-xs font-bold flex items-center justify-center animate-fadeIn">{cartQty}</span>}
                  <p className="text-[15px] font-semibold text-[#1E293B] line-clamp-1">{product.name}</p>
                  {getAttrSummary(product) && <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{getAttrSummary(product)}</p>}
                  <p className="text-[11px] text-neutral-400 mt-1">{product.category}</p>
                  <p className="text-base font-bold text-[#312E81] mt-2 number-font">{formatCurrency(product.price)}</p>
                  <div className="flex items-center gap-1.5 mt-1"><span className={`w-2 h-2 rounded-full ${stockInfo.color}`} /><span className={`text-xs ${stockInfo.text}`}>{stockInfo.label}</span></div>
                  {outOfStock && <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#FEE2E2] text-[#EF4444] text-[10px] font-semibold rounded-full">Out of Stock</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:block lg:w-[40%]">
          <CartPanel cart={cart} cartCount={cartCount} subtotal={subtotal} discount={discount} setDiscount={setDiscount} discountAmount={discountAmount} total={total} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} soldBy={soldBy} setSoldBy={setSoldBy} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} mpesaCode={mpesaCode} setMpesaCode={setMpesaCode} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone} mpesaConfirmed={mpesaConfirmed} setMpesaConfirmed={setMpesaConfirmed} dueDate={dueDate} setDueDate={setDueDate} creditNotes={creditNotes} setCreditNotes={setCreditNotes} creditCustomers={creditCustomers} showCreditDropdown={showCreditDropdown} setShowCreditDropdown={setShowCreditDropdown} fetchCreditCustomers={fetchCreditCustomers} creditDropdownRef={creditDropdownRef} workers={workers} onUpdateQty={updateQty} onRemove={removeFromCart} onComplete={handleInitiateCheckout} />
        </div>
      </div>

      <button onClick={() => setMobileCartOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#312E81] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-[#1E1B4B] transition-colors">
        <ShoppingCart size={22} />
        {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs font-bold flex items-center justify-center">{cartCount}</span>}
      </button>

      {mobileCartOpen && (<>
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileCartOpen(false)} />
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col animate-slideRight">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-neutral-300 rounded-full" /></div>
          <div className="overflow-y-auto flex-1">
            <CartPanel cart={cart} cartCount={cartCount} subtotal={subtotal} discount={discount} setDiscount={setDiscount} discountAmount={discountAmount} total={total} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} soldBy={soldBy} setSoldBy={setSoldBy} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} mpesaCode={mpesaCode} setMpesaCode={setMpesaCode} mpesaPhone={mpesaPhone} setMpesaPhone={setMpesaPhone} mpesaConfirmed={mpesaConfirmed} setMpesaConfirmed={setMpesaConfirmed} dueDate={dueDate} setDueDate={setDueDate} creditNotes={creditNotes} setCreditNotes={setCreditNotes} creditCustomers={creditCustomers} showCreditDropdown={showCreditDropdown} setShowCreditDropdown={setShowCreditDropdown} fetchCreditCustomers={fetchCreditCustomers} creditDropdownRef={creditDropdownRef} workers={workers} onUpdateQty={updateQty} onRemove={removeFromCart} onComplete={handleInitiateCheckout} isMobile />
          </div>
        </div>
      </>)}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] p-7 max-w-[420px] w-full shadow-2xl animate-fadeIn">
              <h2 className="text-xl font-bold text-[#1E293B] mb-5">Confirm Sale</h2>
              <div className="space-y-3 mb-6">
                <p className="text-sm text-[#475569]">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                <p className="text-[22px] font-bold text-[#E8835C]">{formatCurrency(total)}</p>
                <div className="flex items-center gap-2 text-sm text-[#475569]">
                  {paymentMethod === 'cash' && <><Banknote size={18} className="text-[#10B981]" /> Cash</>}
                  {paymentMethod === 'mpesa' && <><Smartphone size={18} className="text-[#3B82F6]" /> M-Pesa</>}
                  {paymentMethod === 'card' && <><User size={18} className="text-[#F59E0B]" /> Credit</>}
                </div>
                {workerName && <p className="text-sm text-[#475569]">Sold by: <span className="font-medium">{workerName}</span></p>}
                {paymentMethod === 'card' && customerName && <p className="text-sm text-[#475569]">Customer: <span className="font-medium">{customerName}</span></p>}
                {discountAmount > 0 && <p className="text-sm text-[#E8835C]">Discount: −{formatCurrency(discountAmount)}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={handleConfirmSale} className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors">Confirm Sale</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Processing Overlay */}
      {showProcessing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-fadeIn">
            <Loader2 size={32} className="text-[#312E81] animate-spin mb-4" />
            <p className="text-base text-[#334155] font-medium">Processing sale...</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && saleResult && (
        <>
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-[440px] w-full text-center animate-fadeIn">
              {!showReceipt ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-5 animate-bounce-short">
                    <CheckCircle size={44} className="text-[#10B981]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1E293B] mb-4">Sale Complete!</h2>
                  <p className="text-base font-mono text-[#64748B] mb-1">{saleResult.saleNumber}</p>
                  <p className="text-[28px] font-bold text-[#E8835C] mb-5">{formatCurrency(saleResult.total)}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-[#64748B] mb-2">
                    {paymentMethod === 'cash' && <><Banknote size={16} className="text-[#10B981]" /> Cash</>}
                    {paymentMethod === 'mpesa' && <><Smartphone size={16} className="text-[#3B82F6]" /> M-Pesa</>}
                    {paymentMethod === 'card' && <><User size={16} className="text-[#F59E0B]" /> Credit</>}
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-[#64748B] mb-8">
                    <span>{cartCount} item{cartCount !== 1 ? 's' : ''} sold</span>
                    {saleResult.totalProfit != null && <span>Profit: {formatCurrency(saleResult.totalProfit)}</span>}
                  </div>
                  <div className="flex flex-col gap-2 max-w-[280px] mx-auto">
                    <button onClick={() => setShowReceipt(true)} className="w-full py-3 border-2 border-[#CBD5E1] text-[#334155] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"><Printer size={18} /> Print Receipt</button>
                    <button onClick={() => {
                      const msg = generateWhatsAppMessage(saleResult, shopInfo);
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }} className="w-full py-3 border-2 border-[#CBD5E1] text-[#334155] rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"><Share2 size={18} /> Share via WhatsApp</button>
                    <button onClick={handleNewSale} className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E1B4B] transition-colors mt-1"><Plus size={18} /> New Sale</button>
                    <button onClick={() => { handleNewSale(); setActiveTab('history'); }} className="text-sm text-[#312E81] hover:underline font-medium mt-1">View All Sales</button>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b border-neutral-200">
                    <h3 className="font-semibold text-[#1E293B]">Receipt</h3>
                    <button onClick={() => setShowReceipt(false)} className="p-1 hover:bg-neutral-100 rounded-lg"><X size={20} /></button>
                  </div>
                  <ReceiptView sale={saleResult} shop={shopInfo} workerName={workerName} />
                  <div className="p-4 flex gap-3 border-t border-neutral-200">
                    <button onClick={() => printReceipt(saleResult, shopInfo, workerName)} className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1E1B4B]"><Printer size={18} /> Print</button>
                    <button onClick={() => setShowReceipt(false)} className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm">Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowErrorModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] p-7 max-w-[420px] w-full shadow-2xl text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
                <XCircle size={36} className="text-[#EF4444]" />
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">Sale Failed</h2>
              <p className="text-sm text-[#64748B] mb-2">Unable to process this sale. Please try again.</p>
              {saleErrorMsg && (
                <details className="text-left mb-5">
                  <summary className="text-xs text-[#64748B] cursor-pointer hover:text-[#334155]">Error details</summary>
                  <p className="text-xs text-[#EF4444] mt-1 p-2 bg-[#FEF2F2] rounded-lg">{saleErrorMsg}</p>
                </details>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={handleNewSale} className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm hover:bg-neutral-50">Cancel Sale</button>
                <button onClick={() => { setShowErrorModal(false); handleInitiateCheckout(); }} className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B]">Try Again</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CartPanel = ({ cart, cartCount, subtotal, discount, setDiscount, discountAmount, total, paymentMethod, setPaymentMethod, soldBy, setSoldBy, customerName, setCustomerName, customerPhone, setCustomerPhone, mpesaCode, setMpesaCode, mpesaPhone, setMpesaPhone, mpesaConfirmed, setMpesaConfirmed, dueDate, setDueDate, creditNotes, setCreditNotes, creditCustomers, showCreditDropdown, setShowCreditDropdown, fetchCreditCustomers, creditDropdownRef, workers, onUpdateQty, onRemove, onComplete, isMobile }) => (
  <div className={`bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col ${isMobile ? 'min-h-0' : 'min-h-[400px]'}`}>
    <div className="p-5 border-b border-neutral-200 flex justify-between">
      <h3 className="text-lg font-semibold text-[#1E293B]">Current Sale</h3>
      {cartCount > 0 && <span className="text-sm text-[#64748B]">({cartCount} items)</span>}
    </div>
    <div className="flex-1 overflow-y-auto max-h-[350px]">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <ShoppingCart size={48} className="text-neutral-200 mb-4" />
          <p className="text-base text-[#64748B] font-medium">Cart is empty</p>
          <p className="text-[13px] text-neutral-400 mt-1">Click products from the left to add them</p>
        </div>
      ) : cart.map((item) => (
        <div key={item.productId} className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-[#1E293B] truncate">{item.name}</p>
            {item.attrs && <p className="text-xs text-[#64748B]">{item.attrs}</p>}
            <p className="text-[13px] text-[#64748B]">{formatCurrency(item.price)}</p>
          </div>
          <div className="flex items-center">
            <button onClick={() => onUpdateQty(item.productId, -1)} className="w-7 h-7 flex items-center justify-center border border-[#CBD5E1] rounded-l-lg hover:bg-neutral-100"><Minus size={14} /></button>
            <span className="w-7 h-7 flex items-center justify-center border-t border-b border-[#CBD5E1] text-sm font-medium">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.productId, 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 flex items-center justify-center border border-[#CBD5E1] rounded-r-lg hover:bg-neutral-100 disabled:opacity-40"><Plus size={14} /></button>
          </div>
          <span className="text-[15px] font-semibold text-[#1E293B] w-20 text-right number-font">{formatCurrency(item.subtotal)}</span>
          <button onClick={() => onRemove(item.productId)} className="p-1 text-neutral-400 hover:text-[#EF4444] transition-colors"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
    {cart.length > 0 && (
      <div className="border-t border-neutral-200 p-5 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-[#64748B]">Subtotal</span><span className="text-base font-semibold text-[#1E293B] number-font">{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#64748B]">Discount</span>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#CBD5E1] overflow-hidden text-xs">
              <button onClick={() => setDiscount({ ...discount, type: 'amount' })} className={`px-2 py-1 ${discount.type === 'amount' ? 'bg-[#312E81] text-white' : 'bg-white text-[#64748B]'}`}>KSh</button>
              <button onClick={() => setDiscount({ ...discount, type: 'percent' })} className={`px-2 py-1 ${discount.type === 'percent' ? 'bg-[#312E81] text-white' : 'bg-white text-[#64748B]'}`}>%</button>
            </div>
            <input type="number" min="0" value={discount.value} onChange={(e) => setDiscount({ ...discount, value: e.target.value })} placeholder={discount.type === 'percent' ? '%' : 'KSh'} className="w-20 text-right px-2 py-1.5 border border-[#CBD5E1] rounded-lg text-sm number-font" />
            {discountAmount > 0 && <span className="text-sm text-[#E8835C] font-medium">-{formatCurrency(discountAmount)}</span>}
          </div>
        </div>
        <div className="flex justify-between items-center bg-[#FDF2EC] rounded-lg px-4 py-3"><span className="text-base font-semibold text-[#1E293B]">Total</span><span className="text-2xl font-bold text-[#E8835C] number-font">{formatCurrency(total)}</span></div>

        <div>
          <p className="text-sm font-medium text-[#334155] mb-3">Payment Method</p>
          <div className="flex gap-2">
            <button onClick={() => setPaymentMethod('cash')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-[1.5px] text-sm font-medium transition-all ${paymentMethod === 'cash' ? 'border-[#10B981] bg-[#D1FAE5]' : 'border-[#CBD5E1] bg-white hover:border-[#10B981]'}`}>
              <Banknote size={20} className={paymentMethod === 'cash' ? 'text-[#10B981]' : 'text-[#64748B]'} />
              <span className={paymentMethod === 'cash' ? 'text-[#10B981]' : 'text-[#1E293B]'}>Cash</span>
            </button>
            <button onClick={() => setPaymentMethod('mpesa')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-[1.5px] text-sm font-medium transition-all ${paymentMethod === 'mpesa' ? 'border-[#3B82F6] bg-[#DBEAFE]' : 'border-[#CBD5E1] bg-white hover:border-[#3B82F6]'}`}>
              <Smartphone size={20} className={paymentMethod === 'mpesa' ? 'text-[#3B82F6]' : 'text-[#64748B]'} />
              <span className={paymentMethod === 'mpesa' ? 'text-[#3B82F6]' : 'text-[#1E293B]'}>M-Pesa</span>
            </button>
            <button onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-[1.5px] text-sm font-medium transition-all ${paymentMethod === 'card' ? 'border-[#F59E0B] bg-[#FEF3C7]' : 'border-[#CBD5E1] bg-white hover:border-[#F59E0B]'}`}>
              <User size={20} className={paymentMethod === 'card' ? 'text-[#F59E0B]' : 'text-[#64748B]'} />
              <span className={paymentMethod === 'card' ? 'text-[#F59E0B]' : 'text-[#1E293B]'}>Credit</span>
            </button>
          </div>
        </div>

        {paymentMethod === 'mpesa' && (
          <div className="space-y-3">
            <div className="relative">
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">M-Pesa Transaction ID</label>
              <div className="relative">
                <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value)} placeholder="e.g., QWE1234567" className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]" />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 ml-1">Enter the confirmation code from the M-Pesa message</p>
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">Customer Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="+254 712 345 678" className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]" />
              </div>
            </div>

            {/* Confirm Checkbox */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${mpesaConfirmed ? 'border-[#10B981] bg-[#D1FAE5]' : 'border-[#FDE68A] bg-[#FFFBEB]'}`}>
              <input type="checkbox" checked={mpesaConfirmed} onChange={(e) => setMpesaConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#10B981]" />
              <div>
                <span className={`text-sm font-medium ${mpesaConfirmed ? 'text-[#065F46]' : 'text-[#92400E]'}`}>
                  {mpesaConfirmed ? '✓ Payment confirmed on phone' : "I've confirmed the payment on my phone ✓"}
                </span>
                {!mpesaConfirmed && (
                  <p className="text-xs text-[#D97706] mt-0.5">Please verify the M-Pesa payment before completing</p>
                )}
              </div>
            </label>

            {/* Coming Soon Card */}
            <div className="p-4 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#312E81] flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#312E81]">Auto-Verification Coming Soon</p>
                  <p className="text-[13px] text-[#64748B] mt-0.5">Soon DukaFlow will automatically verify M-Pesa payments via Safaricom Daraja API. No more manual checking!</p>
                  <a href="#" className="inline-block text-[13px] text-[#312E81] hover:underline font-medium mt-1.5">Learn more about M-Pesa integration →</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="space-y-3">
            {/* Customer Name with Auto-Complete */}
            <div className="relative" ref={creditDropdownRef}>
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">Customer Name <span className="text-[#EF4444]">*</span></label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.length > 0) setShowCreditDropdown(true);
                  }}
                  onFocus={() => {
                    fetchCreditCustomers();
                    if (customerName.length > 0) setShowCreditDropdown(true);
                  }}
                  placeholder="Enter customer's full name"
                  required
                  className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
                />
              </div>

              {/* Auto-Complete Dropdown */}
              {showCreditDropdown && creditCustomers.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-[10px] shadow-lg border border-neutral-200 max-h-[200px] overflow-y-auto">
                  {creditCustomers
                    .filter((c) => c.name.toLowerCase().includes(customerName.toLowerCase()))
                    .slice(0, 6)
                    .map((cust) => (
                      <button
                        key={cust.name}
                        type="button"
                        onClick={() => {
                          setCustomerName(cust.name);
                          if (cust.phone) setCustomerPhone(cust.phone);
                          setShowCreditDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 text-left border-b border-neutral-100 last:border-b-0 transition-colors"
                      >
                        <span className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#F59E0B] text-xs font-bold flex items-center justify-center shrink-0">
                          {cust.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E293B]">{cust.name}</p>
                          <p className="text-[11px] text-neutral-400">Last purchase: {formatDateTime(cust.lastPurchase)}</p>
                        </div>
                        <span className={`text-[13px] font-medium ${cust.totalCredit > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                          {cust.totalCredit > 0 ? formatCurrency(cust.totalCredit) : 'Paid'}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+254 712 345 678" className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]" />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">Payment Due Date</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#334155] mb-1.5 block">Notes (Optional)</label>
              <textarea value={creditNotes} onChange={(e) => setCreditNotes(e.target.value)} placeholder="Any additional details about this credit..." rows={2} className="w-full px-4 py-2.5 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF] resize-none h-[60px]" />
            </div>

            <div className="flex items-start gap-2 p-[10px_14px] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
              <Info size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#92400E]">⚠️ This sale will be recorded as credit. {customerName ? `${customerName} will` : 'The customer will'} owe {formatCurrency(total)}. You can track all outstanding credits in Reports.</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-[#334155] mb-1.5">Sold By <span className="text-[#EF4444]">*</span></p>
          <select value={soldBy} onChange={(e) => setSoldBy(e.target.value)} className="w-full h-12 px-3 border-[1.5px] border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] bg-white">
            {workers.map((w) => <option key={w._id} value={w._id}>{w.fullName}{w.role ? ` · ${w.role}` : ''}</option>)}
          </select>
        </div>

        <button onClick={onComplete} disabled={cart.length === 0} className="w-full flex items-center justify-center gap-2 h-[52px] bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] hover:shadow-lg transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed">
          Complete Sale · {formatCurrency(total)}
        </button>
      </div>
    )}
  </div>
);

export default SalesPage;
