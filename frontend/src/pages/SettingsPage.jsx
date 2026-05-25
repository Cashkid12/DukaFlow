import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/api';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Form';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Building2, CreditCard, Shield, Package, Store, Pencil, Trash2, Plus, Download, FileText, 
  AlertTriangle, CheckCircle, GripVertical, Upload, X, ChevronRight, Archive, 
  Bell, Smartphone, Shirt, ShoppingBag, Utensils, Pill, Wrench, Sparkles, MoreHorizontal,
} from 'lucide-react';

const TABS = [
  { id: 'shop', label: 'Shop Profile', icon: Store },
  { id: 'categories', label: 'Categories & Attributes', icon: Package },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
  { id: 'branches', label: 'Multi-Branch', icon: Building2 },
  { id: 'data', label: 'Data & Privacy', icon: Shield },
];

const BUSINESS_TYPE_CONFIG = {
  clothing: { icon: Shirt, label: 'Clothing Boutique' },
  electronics: { icon: Smartphone, label: 'Electronics Shop' },
  grocery: { icon: ShoppingBag, label: 'Grocery Store' },
  pharmacy: { icon: Pill, label: 'Pharmacy' },
  hardware: { icon: Wrench, label: 'Hardware Store' },
  cosmetics: { icon: Sparkles, label: 'Cosmetics Shop' },
  other: { icon: MoreHorizontal, label: 'General Store' },
};

const PLAN_FEATURES = {
  starta: ['1 User', '1 Shop Location', '500 Products', 'Basic Reports', 'Email Support'],
  kuuza: ['3 Users', '1 Shop Location', '2,000 Products', 'Advanced Reports', 'Credit Tracking', 'Priority Support'],
  biashara: ['10 Users', 'Unlimited Branches', 'Unlimited Products', 'All Reports + Analytics', 'Credit Tracking', 'Priority Support', 'Custom Branding', 'API Access'],
};
const PLAN_PRICES = { starta: 750, kuuza: 1500, biashara: 3000 };
const PLAN_LABELS = { starta: 'Starta', kuuza: 'Kuuza', biashara: 'Biashara' };

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('shop');
  const [toast, setToast] = useState(null);

  // Tab-specific state (non-server-synced)
  const [shopForm, setShopForm] = useState({ name: '', description: '', phone: '', email: '', address: '' });
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryEditValue, setCategoryEditValue] = useState('');
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [attrEditName, setAttrEditName] = useState('');
  const [attrEditValues, setAttrEditValues] = useState('');
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', location: '', assignedWorkers: [] });
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [notifPrefs, setNotifPrefs] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const settings = settingsData?.data;

  // Derive initial values from server data, sync when settings identity changes
  useEffect(() => {
    if (settings) {
      setShopForm({
        name: settings.name || '',
        description: settings.description || '',
        phone: settings.contact?.phone || '',
        email: settings.contact?.email || '',
        address: settings.contact?.address || '',
      });
      setCategories(settings.settings?.categories || []);
      setAttributes(settings.settings?.attributes || []);
      setNotifPrefs(settings.notificationPreferences || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?._id]);

  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: (data) => settingsService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('✓ Shop profile updated');
    },
    onError: () => showToast('× Failed to update profile'),
  });

  // Categories mutation
  const categoriesMutation = useMutation({
    mutationFn: (cats) => settingsService.updateCategories(cats),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('✓ Categories updated');
    },
    onError: () => showToast('× Failed to update categories'),
  });

  // Attributes mutation
  const attributesMutation = useMutation({
    mutationFn: (attrs) => settingsService.updateAttributes(attrs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('✓ Attributes updated');
    },
    onError: () => showToast('× Failed to update attributes'),
  });

  // Plan mutation
  const planMutation = useMutation({
    mutationFn: (plan) => settingsService.changePlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowChangePlan(false);
      setSelectedPlan(null);
      showToast('✓ Plan changed successfully');
    },
    onError: () => showToast('× Failed to change plan'),
  });

  // Multi-branch mutation
  const branchMutation = useMutation({
    mutationFn: (data) => settingsService.manageMultiBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowBranchModal(false);
      setEditingBranch(null);
      showToast('✓ Branch updated');
    },
    onError: () => showToast('× Failed to manage branches'),
  });

  // Notification preferences mutation
  const notifMutation = useMutation({
    mutationFn: (prefs) => settingsService.updateNotifications(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('✓ Notification preferences saved');
    },
    onError: () => showToast('× Failed to save preferences'),
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: () => settingsService.deleteAccount(),
    onSuccess: () => {
      showToast('✓ Your shop has been deleted');
      setTimeout(() => window.location.href = '/', 2000);
    },
    onError: () => showToast('× Failed to delete account'),
  });

  // Export handler
  const handleExport = async (type, dateFrom, dateTo) => {
    try {
      const response = await settingsService.exportData({ type, dateFrom, dateTo });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('✓ Export downloaded');
    } catch { showToast('× Export failed'); }
  };

  // Handlers
  const handleSaveProfile = (e) => { e.preventDefault(); profileMutation.mutate(shopForm); };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const updated = [...categories, newCategory.trim()];
    setCategories(updated);
    setNewCategory('');
    categoriesMutation.mutate(updated);
  };

  const handleUpdateCategory = (index) => {
    const updated = [...categories];
    updated[index] = categoryEditValue.trim();
    setCategories(updated);
    setEditingCategory(null);
    categoriesMutation.mutate(updated);
  };

  const handleDeleteCategory = (index) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    categoriesMutation.mutate(updated);
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    const updated = [...attributes, { name: newAttrName.trim(), values: newAttrValues.split(',').map(v => v.trim()).filter(Boolean) }];
    setAttributes(updated);
    setNewAttrName('');
    setNewAttrValues('');
    attributesMutation.mutate(updated);
  };

  const handleUpdateAttribute = (index) => {
    const updated = [...attributes];
    updated[index] = { name: attrEditName.trim(), values: attrEditValues.split(',').map(v => v.trim()).filter(Boolean) };
    setAttributes(updated);
    setEditingAttribute(null);
    attributesMutation.mutate(updated);
  };

  const handleDeleteAttribute = (index) => {
    const updated = attributes.filter((_, i) => i !== index);
    setAttributes(updated);
    attributesMutation.mutate(updated);
  };

  const handleToggleMultiBranch = () => {
    branchMutation.mutate({ action: 'toggle' });
  };

  const handleSaveBranch = () => {
    if (editingBranch) {
      branchMutation.mutate({ action: 'update', branchId: editingBranch, ...branchForm });
    } else {
      branchMutation.mutate({ action: 'add', ...branchForm });
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch._id);
    setBranchForm({ name: branch.name, location: branch.location, assignedWorkers: branch.assignedWorkers || [] });
    setShowBranchModal(true);
  };

  const handleDeleteBranch = (branchId) => {
    branchMutation.mutate({ action: 'delete', branchId });
  };

  const handleSaveNotifications = () => {
    notifMutation.mutate(notifPrefs);
  };

  const canDelete = deleteConfirmText === 'DELETE' && deletePassword.length > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-neutral-200 rounded mb-2" />
        <div className="h-5 w-64 bg-neutral-200 rounded mb-8" />
        <div className="flex gap-6">
          <div className="w-64 h-64 bg-neutral-200 rounded-xl" />
          <div className="flex-1 h-96 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const businessConfig = BUSINESS_TYPE_CONFIG[settings?.businessType] || BUSINESS_TYPE_CONFIG.other;
  const BusinessIcon = businessConfig.icon;
  const currentPlan = settings?.subscription?.plan || 'starta';

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Settings</h1>
        <p className="text-sm text-[#64748B]">Manage your shop preferences and account settings</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-white border border-neutral-200 shadow-lg rounded-xl px-5 py-3 flex items-center gap-2 animate-[slideIn_0.3s_ease] text-sm text-[#1E293B]">
          <CheckCircle size={18} className="text-[#10B981] flex-shrink-0" />
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Tabs — Vertical (Desktop) / Horizontal Scroll (Mobile) */}
        <div className="lg:w-[250px] flex-shrink-0">
          <nav className="hidden lg:block bg-white rounded-2xl shadow-sm p-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-[18px] py-[14px] rounded-[10px] text-left transition-all duration-200 my-[2px] ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#312E81] font-medium border-l-[3px] border-[#312E81]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[15px]">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="lg:hidden overflow-x-auto -mx-3 px-3 pb-1">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-[#312E81] text-white shadow-md'
                        : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:border-[#312E81]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* ── TAB 1: SHOP PROFILE ── */}
          {activeTab === 'shop' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
              <h3 className="text-lg font-semibold text-[#1E293B] mb-6">Shop Profile</h3>
              <form onSubmit={handleSaveProfile}>
                {/* Logo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#334155] mb-2">Shop Logo</label>
                  <div className="flex items-center gap-4">
                    {settings?.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center">
                        <Upload size={24} className="text-[#CBD5E1]" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" type="button">Change Logo</Button>
                      <Button variant="ghost" size="sm" type="button" className="text-[#EF4444] hover:bg-red-50">Remove</Button>
                    </div>
                  </div>
                </div>

                <Input label="Shop Name" type="text" value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />

                {/* Business Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#334155] mb-1.5">Business Type</label>
                  <div className="flex items-center gap-2 h-11 px-4 bg-neutral-50 border border-[#CBD5E1] rounded-xl">
                    <BusinessIcon size={18} className="text-[#64748B]" />
                    <span className="text-[15px] text-[#1E293B]">{businessConfig.label}</span>
                  </div>
                  <button type="button" className="text-xs text-[#312E81] mt-1 hover:underline">Request Change</button>
                </div>

                <Input label="Contact Phone" type="tel" value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
                <Input label="Contact Email" type="email" value={shopForm.email}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} />
                <TextArea label="Physical Address" value={shopForm.address} rows={3}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} />
                <TextArea label="Shop Description (Optional)" value={shopForm.description} rows={3}
                  placeholder="Brief description of your shop..."
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
                <p className="text-xs text-[#64748B] -mt-2 mb-4">{shopForm.description.length}/200</p>

                <Button type="submit" variant="primary" className="w-full sm:w-[200px]"
                  disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          )}

          {/* ── TAB 2: CATEGORIES & ATTRIBUTES ── */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Categories */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <h3 className="text-base font-semibold text-[#1E293B] mb-1">Product Categories</h3>
                <p className="text-[13px] text-[#64748B] mb-4">These appear as filters in your inventory</p>
                <div className="space-y-2 mb-4">
                  {categories.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 py-2.5 px-3 bg-[#F8FAFC] rounded-lg group">
                      <GripVertical size={16} className="text-[#CBD5E1] flex-shrink-0" />
                      {editingCategory === i ? (
                        <div className="flex-1 flex gap-2">
                          <input type="text" value={categoryEditValue}
                            onChange={(e) => setCategoryEditValue(e.target.value)}
                            className="flex-1 h-9 px-3 border border-[#312E81] rounded-lg text-sm focus:outline-none" />
                          <Button variant="primary" size="sm" onClick={() => handleUpdateCategory(i)}>Save</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingCategory(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-[15px] font-medium text-[#1E293B]">{cat}</span>
                          <Badge variant="default" className="text-xs">12 products</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingCategory(i); setCategoryEditValue(cat); }}
                              className="p-1.5 hover:bg-neutral-200 rounded"><Pencil size={14} className="text-[#64748B]" /></button>
                            <button onClick={() => handleDeleteCategory(i)}
                              className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} className="text-[#EF4444]" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 h-11 px-4 bg-white border border-[#CBD5E1] rounded-[12px] text-sm focus:outline-none focus:border-[#312E81]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                  <Button variant="primary" icon={Plus} onClick={handleAddCategory}>Add</Button>
                </div>
              </div>

              {/* Attributes */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <h3 className="text-base font-semibold text-[#1E293B] mb-1">Custom Attributes</h3>
                <p className="text-[13px] text-[#64748B] mb-4">Extra fields for your products</p>
                <div className="space-y-3 mb-4">
                  {attributes.map((attr, i) => (
                    <div key={i} className="flex items-start gap-2 py-2.5 px-3 bg-[#F8FAFC] rounded-lg group">
                      <GripVertical size={16} className="text-[#CBD5E1] flex-shrink-0 mt-0.5" />
                      {editingAttribute === i ? (
                        <div className="flex-1 space-y-2">
                          <input type="text" value={attrEditName}
                            onChange={(e) => setAttrEditName(e.target.value)}
                            placeholder="Attribute name"
                            className="w-full h-9 px-3 border border-[#312E81] rounded-lg text-sm focus:outline-none" />
                          <input type="text" value={attrEditValues}
                            onChange={(e) => setAttrEditValues(e.target.value)}
                            placeholder="Values (comma separated)"
                            className="w-full h-9 px-3 border border-[#312E81] rounded-lg text-sm focus:outline-none" />
                          <div className="flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleUpdateAttribute(i)}>Save</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingAttribute(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="text-[15px] font-medium text-[#1E293B] block mb-1">{attr.name}</span>
                            <div className="flex flex-wrap gap-1">
                              {(attr.values || []).map((v, j) => (
                                <span key={j} className="inline-block px-2 py-0.5 bg-white border border-neutral-200 rounded-full text-xs text-[#1E293B]">{v}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingAttribute(i); setAttrEditName(attr.name); setAttrEditValues((attr.values || []).join(', ')); }}
                              className="p-1.5 hover:bg-neutral-200 rounded"><Pencil size={14} className="text-[#64748B]" /></button>
                            <button onClick={() => handleDeleteAttribute(i)}
                              className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} className="text-[#EF4444]" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <input type="text" value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    placeholder="e.g., Season"
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] rounded-[12px] text-sm focus:outline-none focus:border-[#312E81]" />
                  <input type="text" value={newAttrValues}
                    onChange={(e) => setNewAttrValues(e.target.value)}
                    placeholder="Summer, Winter, Spring (comma separated)"
                    className="w-full h-11 px-4 bg-white border border-[#CBD5E1] rounded-[12px] text-sm focus:outline-none focus:border-[#312E81]" />
                  <Button variant="primary" icon={Plus} onClick={handleAddAttribute}>Add Attribute</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: BILLING & SUBSCRIPTION ── */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className={`bg-white rounded-2xl shadow-sm p-6 lg:p-7 ${settings?.subscription?.status === 'active' ? 'border-2 border-[#312E81]' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-[22px] font-bold text-[#1E293B]">{PLAN_LABELS[currentPlan]} Plan</h3>
                    <p className="text-lg text-[#312E81] font-semibold mt-1">KSh {PLAN_PRICES[currentPlan].toLocaleString()}/month</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PLAN_FEATURES[currentPlan].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#1E293B]">
                      <CheckCircle size={16} className="text-[#10B981] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-[#64748B]">Next billing date</p>
                    <p className="font-semibold text-[#1E293B]">
                      {settings?.subscription?.currentPeriodEnd
                        ? new Date(settings.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Payment method</p>
                    <p className="font-semibold text-[#1E293B]">
                      {settings?.subscription?.paymentMethod === 'mpesa' ? 'M-Pesa Autopay' : 'Card'} • {shopForm.phone || '+254 712 345 678'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="primary" onClick={() => setShowChangePlan(true)}>Change Plan</Button>
                  <Button variant="secondary" onClick={() => settingsService.updatePayment({ paymentMethod: 'mpesa' }).then(() => { queryClient.invalidateQueries({ queryKey: ['settings'] }); showToast('✓ Payment method updated'); })}>
                    Update Payment Method
                  </Button>
                </div>
              </div>

              {/* Invoice History */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <h3 className="text-base font-semibold text-[#1E293B] mb-4">Invoice History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#CBD5E1]">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Invoice #</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#64748B]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {((settingsData?.data?.invoices) || []).map((inv) => (
                        <tr key={inv.id} className="border-b border-neutral-100">
                          <td className="py-3 px-4 text-sm text-[#1E293B]">{inv.date}</td>
                          <td className="py-3 px-4 text-sm font-mono text-[#64748B]">#{inv.id}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-[#1E293B]">{typeof inv.amount === 'number' ? `KSh ${inv.amount.toLocaleString()}` : inv.amount}</td>
                          <td className="py-3 px-4"><Badge variant="success">Paid</Badge></td>
                          <td className="py-3 px-4">
                            <button className="text-sm text-[#312E81] hover:underline flex items-center gap-1">
                              <Download size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: MULTI-BRANCH ── */}
          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-lg font-semibold text-[#1E293B]">Multi-Branch Management</h3>
                  <Badge variant="premium">Biashara Plan Only</Badge>
                </div>

                {currentPlan !== 'biashara' ? (
                  <div className="text-center py-10">
                    <Building2 size={48} className="text-[#CBD5E1] mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-[#1E293B] mb-2">Available on Biashara Plan</h4>
                    <p className="text-sm text-[#64748B] mb-4 max-w-md mx-auto">
                      Upgrade to Biashara to manage multiple shop branches from one account.
                    </p>
                    <Button variant="primary" onClick={() => { setActiveTab('billing'); setShowChangePlan(true); setSelectedPlan('biashara'); }}>
                      Upgrade to Biashara <ChevronRight size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <button
                          onClick={handleToggleMultiBranch}
                          className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${settings?.multiBranchEnabled ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${settings?.multiBranchEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                        <span className="ml-3 text-sm font-medium text-[#1E293B]">
                          {settings?.multiBranchEnabled ? 'Multi-Branch Enabled' : 'Enable Multi-Branch'}
                        </span>
                      </label>
                    </div>

                    {(settings?.branches || []).map((branch) => (
                      <div key={branch._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8FAFC] rounded-xl mb-3 gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#1E293B]">{branch.name}</p>
                          <p className="text-sm text-[#64748B]">{branch.location || 'No location'}</p>
                          <p className="text-[13px] text-[#64748B] mt-1">{(branch.assignedWorkers || []).length} workers assigned</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Active</Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleEditBranch(branch)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteBranch(branch._id)}
                            className="text-[#EF4444] hover:bg-red-50"><Trash2 size={14} /></Button>
                        </div>
                      </div>
                    ))}

                    <Button variant="secondary" className="w-full mt-2" icon={Plus}
                      onClick={() => { setEditingBranch(null); setBranchForm({ name: '', location: '', assignedWorkers: [] }); setShowBranchModal(true); }}>
                      + Add Branch
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: DATA & PRIVACY ── */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Export Data */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <h3 className="text-base font-semibold text-[#1E293B] mb-1">Export Your Data</h3>
                <p className="text-sm text-[#64748B] mb-4">Download a copy of your shop data anytime.</p>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8FAFC] rounded-xl gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Products (CSV)</p>
                      <p className="text-xs text-[#64748B]">All products with categories, prices, and stock levels</p>
                    </div>
                    <Button variant="secondary" size="sm" icon={Download} onClick={() => handleExport('products')}>
                      Export Products
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8FAFC] rounded-xl gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Transactions (CSV)</p>
                      <p className="text-xs text-[#64748B]">Sales history with optional date range</p>
                    </div>
                    <Button variant="secondary" size="sm" icon={Download} onClick={() => handleExport('transactions')}>
                      Export Transactions
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8FAFC] rounded-xl gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">Complete Data (ZIP)</p>
                      <p className="text-xs text-[#64748B]">Products, transactions, workers, and settings</p>
                    </div>
                    <Button variant="secondary" size="sm" icon={Archive}>Export All Data</Button>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-4">Exports may take a few minutes for large shops. We'll email you when it's ready.</p>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7">
                <h3 className="text-base font-semibold text-[#1E293B] mb-4">Notification Preferences</h3>
                {notifPrefs && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B] mb-3">Email Reports</p>
                      <div className="space-y-3">
                        {[
                          { key: 'daily', label: 'Daily Summary', path: ['emailReports', 'daily'] },
                          { key: 'weekly', label: 'Weekly Report', path: ['emailReports', 'weekly'] },
                          { key: 'monthly', label: 'Monthly P&L', path: ['emailReports', 'monthly'] },
                        ].map(({ key, label, path }) => (
                          <label key={key} className="flex items-center justify-between py-2">
                            <span className="text-sm text-[#1E293B]">{label}</span>
                            <button
                              onClick={() => {
                                const updated = { ...notifPrefs };
                                let obj = updated;
                                for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
                                obj[path[path.length - 1]] = !obj[path[path.length - 1]];
                                setNotifPrefs(updated);
                              }}
                              className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${notifPrefs.emailReports[key] ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifPrefs.emailReports[key] ? 'left-6' : 'left-1'}`} />
                            </button>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E293B] mb-3">Alerts</p>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between py-2">
                          <span className="text-sm text-[#1E293B]">Low Stock Alert</span>
                          <button
                            onClick={() => setNotifPrefs(prev => ({ ...prev, alerts: { ...prev.alerts, lowStock: !prev.alerts.lowStock } }))}
                            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${notifPrefs.alerts.lowStock ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifPrefs.alerts.lowStock ? 'left-6' : 'left-1'}`} />
                          </button>
                        </label>
                        <label className="flex items-center justify-between py-2">
                          <span className="text-sm text-[#1E293B]">Expiry Alert</span>
                          <button
                            onClick={() => setNotifPrefs(prev => ({ ...prev, alerts: { ...prev.alerts, expiry: !prev.alerts.expiry } }))}
                            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${notifPrefs.alerts.expiry ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifPrefs.alerts.expiry ? 'left-6' : 'left-1'}`} />
                          </button>
                        </label>
                        <label className="flex items-center justify-between py-2">
                          <span className="text-sm text-[#1E293B]">Worker Login Alert</span>
                          <button
                            onClick={() => setNotifPrefs(prev => ({ ...prev, alerts: { ...prev.alerts, workerLogin: !prev.alerts.workerLogin } }))}
                            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${notifPrefs.alerts.workerLogin ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifPrefs.alerts.workerLogin ? 'left-6' : 'left-1'}`} />
                          </button>
                        </label>
                        <label className="flex items-center justify-between py-2">
                          <span className="text-sm text-[#1E293B]">Large Sale Alert</span>
                          <button
                            onClick={() => setNotifPrefs(prev => ({ ...prev, alerts: { ...prev.alerts, largeSale: !prev.alerts.largeSale } }))}
                            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${notifPrefs.alerts.largeSale ? 'bg-[#10B981]' : 'bg-neutral-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${notifPrefs.alerts.largeSale ? 'left-6' : 'left-1'}`} />
                          </button>
                        </label>
                      </div>
                    </div>
                    <Button variant="primary" onClick={handleSaveNotifications} className="w-full sm:w-auto"
                      disabled={notifMutation.isPending}>
                      {notifMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-7 border border-[#EF4444]">
                <div className="flex items-start gap-4">
                  <AlertTriangle size={24} className="text-[#EF4444] flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#EF4444] mb-2">Delete Shop Account</h3>
                    <p className="text-sm text-[#475569] mb-4">
                      This will permanently delete your shop, all products, transactions, workers, and settings. This action cannot be undone.
                    </p>
                    <Button variant="danger" icon={Trash2}
                      onClick={() => setShowDeleteModal(true)}>Delete My Shop</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHANGE PLAN MODAL ── */}
      <Modal isOpen={showChangePlan} onClose={() => { setShowChangePlan(false); setSelectedPlan(null); }} title="Change Your Plan" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['starta', 'kuuza', 'biashara'].map((plan) => (
            <div
              key={plan}
              className={`relative border-2 rounded-2xl p-5 text-center transition-all cursor-pointer ${
                selectedPlan === plan ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-[#CBD5E1] hover:border-[#312E81]'
              } ${currentPlan === plan ? 'bg-[#F8FAFC]' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {currentPlan === plan && (
                <Badge variant="success" className="absolute top-3 left-3">Current</Badge>
              )}
              {plan === 'kuuza' && (
                <Badge variant="premium" className="absolute top-3 right-3">Most Popular</Badge>
              )}
              <h4 className="text-lg font-bold text-[#1E293B] mt-4">{PLAN_LABELS[plan]}</h4>
              <p className="text-2xl font-bold text-[#312E81] mt-1">KSh {PLAN_PRICES[plan]}<span className="text-sm font-normal text-[#64748B]">/mo</span></p>
              <ul className="text-left mt-4 space-y-2 text-sm">
                {PLAN_FEATURES[plan].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[#1E293B]">
                    <CheckCircle size={14} className="text-[#10B981] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {currentPlan !== plan && (
                <Button
                  variant={plan === 'biashara' ? 'primary' : 'secondary'}
                  size="sm" className="w-full mt-4"
                  onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}>
                  {plan === 'biashara' ? 'Upgrade' : currentPlan === 'biashara' ? 'Downgrade' : 'Select'}
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-[#64748B] mt-4 text-center">
          Your plan will change immediately. You'll be charged the new amount on your next billing date.
        </p>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => { setShowChangePlan(false); setSelectedPlan(null); }}>Cancel</Button>
          <Button variant="primary"
            disabled={!selectedPlan || selectedPlan === currentPlan || planMutation.isPending}
            onClick={() => planMutation.mutate(selectedPlan)}>
            {planMutation.isPending ? 'Changing...' : 'Confirm Change'}
          </Button>
        </div>
      </Modal>

      {/* ── ADD/EDIT BRANCH MODAL ── */}
      <Modal isOpen={showBranchModal} onClose={() => { setShowBranchModal(false); setEditingBranch(null); }}
        title={editingBranch ? 'Edit Branch' : 'Add New Branch'} size="md">
        <div className="space-y-4">
          <Input label="Branch Name" type="text" value={branchForm.name}
            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
            placeholder="e.g., Cecilia Fashions — CBD" />
          <Input label="Location" type="text" value={branchForm.location}
            onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
            placeholder="e.g., Moi Avenue, Nairobi" />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowBranchModal(false); setEditingBranch(null); }}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveBranch}
              disabled={!branchForm.name.trim() || branchMutation.isPending}>
              {branchMutation.isPending ? 'Saving...' : 'Save Branch'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── DELETE ACCOUNT MODAL ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Shop Account" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 border border-[#EF4444] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#EF4444] mb-2">Are you absolutely sure?</p>
            <ul className="text-sm text-[#475569] space-y-1">
              <li>✓ {settings?.counts?.products || 0} products permanently deleted</li>
              <li>✓ {settings?.counts?.sales || 0} transactions permanently deleted</li>
              <li>✓ {settings?.counts?.workers || 0} workers removed</li>
              <li>✓ All reports and settings deleted</li>
              <li>✓ Your subscription cancelled immediately</li>
            </ul>
            <p className="text-sm font-semibold text-[#EF4444] mt-2">This cannot be undone.</p>
          </div>
          <p className="text-sm text-[#1E293B]">Type <strong>DELETE</strong> to confirm:</p>
          <Input type="text" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE" />
          <Input type="password" value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password" />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeletePassword(''); }}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1"
              onClick={() => deleteMutation.mutate()}
              disabled={!canDelete || deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete My Shop'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
