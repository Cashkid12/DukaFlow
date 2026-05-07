import React, { useState, useMemo } from 'react';
import { Button } from '../components/Button';
import { Input, Select, TextArea } from '../components/Form';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Upload, Edit2, Trash2, Plus, Download, AlertTriangle, CreditCard, Building2, Shield, Database } from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const tabs = [
    { id: 'shop', label: 'Shop Profile', icon: Building2 },
    { id: 'categories', label: 'Categories & Attributes', icon: Database },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
    { id: 'branches', label: 'Multi-Branch', icon: Building2 },
    { id: 'data', label: 'Data & Privacy', icon: Shield },
  ];

  // Get shop data from onboarding
  const initialShopData = useMemo(() => {
    const onboardingData = localStorage.getItem('onboarding_step2');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      return {
        name: data.shopName || '',
        businessType: data.businessType || '',
        subdomain: data.subdomain || '',
        phone: '',
        email: '',
        address: '',
      };
    }
    return {
      name: '',
      businessType: '',
      subdomain: '',
      phone: '',
      email: '',
      address: '',
    };
  }, []);

  const [shopData, setShopData] = useState(initialShopData);

  const [categories, setCategories] = useState(['Trousers', 'Shirts', 'Dresses', 'Shoes', 'Accessories']);
  const [attributes, setAttributes] = useState(['Size', 'Color', 'Brand', 'Material']);
  const [newCategory, setNewCategory] = useState('');
  const [newAttribute, setNewAttribute] = useState('');

  const invoices = [
    { id: 'INV-2026-003', date: 'Apr 1, 2026', amount: 'KSh 750', status: 'paid' },
    { id: 'INV-2026-002', date: 'Mar 1, 2026', amount: 'KSh 750', status: 'paid' },
    { id: 'INV-2026-001', date: 'Feb 1, 2026', amount: 'KSh 750', status: 'paid' },
  ];

  const branches = [
    { id: 1, name: 'Main Branch', location: 'Nairobi CBD', workers: 3 },
    { id: 2, name: 'Westlands Branch', location: 'Westlands Mall', workers: 2 },
  ];

  const handleSaveShop = (e) => {
    e.preventDefault();
    console.log('Save shop:', shopData);
    alert('Shop profile updated successfully!');
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleAddAttribute = () => {
    if (newAttribute.trim()) {
      setAttributes([...attributes, newAttribute.trim()]);
      setNewAttribute('');
    }
  };

  const handleDeleteCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleDeleteAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm === 'DELETE') {
      console.log('Delete account');
      setShowDeleteModal(false);
      alert('Account deletion requested. This action cannot be undone.');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="h2 text-neutral-900 mb-2">Settings</h1>
        <p className="text-neutral-600">Manage your shop preferences and account settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Vertical Tabs — Desktop / Horizontal Scroll — Mobile */}
        <div className="lg:w-64 flex-shrink-0">
          {/* Desktop: vertical tabs */}
          <nav className="hidden lg:block bg-white rounded-xl shadow-sm p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-subtle text-primary font-medium'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          {/* Mobile: horizontal scrollable tabs */}
          <div className="lg:hidden overflow-x-auto -mx-3 px-3 pb-1">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-[#312E81] text-white shadow-md'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
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
        <div className="flex-1">
          {/* Tab 1: Shop Profile */}
          {activeTab === 'shop' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Shop Profile</h3>
              <form onSubmit={handleSaveShop}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Shop Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <Upload size={24} className="text-neutral-400" />
                    </div>
                    <Button variant="secondary" size="sm">Upload New Logo</Button>
                  </div>
                </div>

                <Input
                  label="Shop Name"
                  type="text"
                  value={shopData.name}
                  onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                />

                <div className="mb-4">
                  <Input
                    label="Business Type"
                    type="text"
                    value="Clothing"
                    disabled
                  />
                  <a href="#" className="text-sm text-primary hover:text-primary-deep mt-1 inline-block">
                    Request Change
                  </a>
                </div>

                <Input
                  label="Contact Phone"
                  type="tel"
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                />

                <Input
                  label="Contact Email"
                  type="email"
                  value={shopData.email}
                  onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                />

                <TextArea
                  label="Physical Address"
                  value={shopData.address}
                  onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                  rows={3}
                />

                <Button type="submit" variant="primary">Save Changes</Button>
              </form>
            </div>
          )}

          {/* Tab 2: Categories & Attributes */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Categories */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Product Categories</h3>
                <div className="space-y-2 mb-4">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                      <span className="text-sm text-neutral-900">{category}</span>
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-neutral-200 rounded">
                          <Edit2 size={14} className="text-neutral-600" />
                        </button>
                        <button onClick={() => handleDeleteCategory(index)} className="p-1 hover:bg-danger-bg rounded">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 h-10 px-3 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button variant="primary" onClick={handleAddCategory} icon={Plus}>Add</Button>
                </div>
              </div>

              {/* Attributes */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Custom Attributes</h3>
                <div className="space-y-2 mb-4">
                  {attributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                      <span className="text-sm text-neutral-900">{attr}</span>
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-neutral-200 rounded">
                          <Edit2 size={14} className="text-neutral-600" />
                        </button>
                        <button onClick={() => handleDeleteAttribute(index)} className="p-1 hover:bg-danger-bg rounded">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    placeholder="New attribute name"
                    className="flex-1 h-10 px-3 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAttribute()}
                  />
                  <Button variant="primary" onClick={handleAddAttribute} icon={Plus}>Add</Button>
                </div>
                <p className="text-xs text-neutral-500 mt-4">
                  Note: Changes affect the Add Product form.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Billing & Subscription */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Current Plan</h3>
                <div className="bg-primary-soft rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-primary">Starta Plan</h4>
                      <p className="text-sm text-neutral-600">KSh 750/month</p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Next Billing Date</p>
                    <p className="font-semibold text-neutral-900">May 1, 2026</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Payment Method</p>
                    <p className="font-semibold text-neutral-900">M-Pesa Autopay</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary">Change Plan</Button>
                  <Button variant="ghost">Update Payment Method</Button>
                </div>
              </div>

              {/* Invoice History */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Invoice History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Invoice</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-neutral-100">
                          <td className="py-3 px-4 text-sm font-medium text-neutral-900">{invoice.id}</td>
                          <td className="py-3 px-4 text-sm text-neutral-600">{invoice.date}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-neutral-900">{invoice.amount}</td>
                          <td className="py-3 px-4">
                            <Badge variant="success">Paid</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-sm text-primary hover:text-primary-deep flex items-center gap-1">
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

          {/* Tab 4: Multi-Branch */}
          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900">Multi-Branch Management</h3>
                  <Badge variant="premium">Pro Plan Required</Badge>
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded border-neutral-300 text-primary focus:ring-primary" />
                    <span className="text-sm text-neutral-700">Enable Multi-Branch Management</span>
                  </label>
                </div>

                <div className="space-y-3">
                  {branches.map((branch) => (
                    <div key={branch.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">{branch.name}</h4>
                        <p className="text-xs text-neutral-500">{branch.location} • {branch.workers} workers</p>
                      </div>
                      <Button variant="secondary" size="sm">Switch to Branch</Button>
                    </div>
                  ))}
                </div>

                <Button variant="primary" className="mt-4" icon={Plus}>Add New Branch</Button>
              </div>
            </div>
          )}

          {/* Tab 5: Data & Privacy */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Export Data */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Export Data</h3>
                <div className="space-y-3">
                  <Button variant="secondary" icon={Download} className="w-full justify-start">
                    Export All Products (CSV)
                  </Button>
                  <Button variant="secondary" icon={Download} className="w-full justify-start">
                    Export Transactions (Date Range)
                  </Button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-danger">
                <div className="flex items-start gap-4">
                  <AlertTriangle size={24} className="text-danger flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-danger mb-2">Delete Shop Account</h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      This action is permanent and cannot be undone. All your products, transactions, and worker data will be deleted.
                    </p>
                    <Button
                      variant="danger"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Shop Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-danger-bg border-l-4 border-danger rounded-md p-4">
            <p className="text-sm text-neutral-700">
              <strong>Warning:</strong> This action is permanent. All data will be lost.
            </p>
          </div>
          <p className="text-sm text-neutral-700">
            Type <strong>DELETE</strong> to confirm:
          </p>
          <Input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
