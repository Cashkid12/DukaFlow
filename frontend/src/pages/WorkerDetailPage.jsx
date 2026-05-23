import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, TrendingUp, BarChart3, Mail, Phone, Shield,
  UserCheck, User, Pencil, MessageSquare, MoreVertical, Clock, Receipt,
  Loader2, AlertCircle, X, CheckCircle, Banknote, Smartphone, CreditCard,
  Trash2, AlertTriangle, Monitor, Tablet, LogOut, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSocket } from '../hooks/useSocket';
import {
  ROLES, PERMISSION_DEFINITIONS, getRolePermissions, getImmutablePermissions,
  canEditWorkers, canRemoveWorkers,
} from '../utils/permissions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Config ──────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: '#312E81', bg: '#EEF2FF' },
  manager: { label: 'Manager', icon: UserCheck, color: '#312E81', bg: '#EEF2FF' },
  cashier: { label: 'Cashier', icon: User, color: '#312E81', bg: '#EEF2FF' },
};

const PAYMENT_CONFIG = {
  cash: { label: 'Cash', icon: Banknote, color: '#10B981' },
  mpesa: { label: 'M-Pesa', icon: Smartphone, color: '#4F46E5' },
  card: { label: 'Card', icon: CreditCard, color: '#F59E0B' },
};

const ACTIVITY_DOT = {
  sale: 'bg-blue-500',
  login: 'bg-green-500',
  joined: 'bg-purple-500',
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const WorkerDetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Back button */}
    <div className="h-5 w-36 bg-neutral-200 rounded" />
    {/* Header */}
    <div className="flex items-center gap-4">
      <div className="w-[72px] h-[72px] rounded-full bg-neutral-200" />
      <div className="flex-1">
        <div className="h-7 w-48 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-32 bg-neutral-200 rounded mb-2" />
        <div className="h-3 w-24 bg-neutral-200 rounded" />
      </div>
    </div>
    {/* Stat cards */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 bg-white rounded-xl border border-neutral-100 p-5" />
      ))}
    </div>
    {/* Two columns */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <div className="h-[340px] bg-white rounded-2xl border border-neutral-200 p-6" />
        <div className="h-[400px] bg-white rounded-2xl border border-neutral-200 p-6" />
      </div>
      <div className="space-y-5">
        <div className="h-[380px] bg-white rounded-2xl border border-neutral-200 p-6" />
        <div className="h-[500px] bg-white rounded-2xl border border-neutral-200 p-6" />
      </div>
    </div>
  </div>
);

// ─── Error State ─────────────────────────────────────────────────────────────
const WorkerDetailError = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
      <AlertCircle size={32} className="text-[#EF4444]" />
    </div>
    <h2 className="text-xl font-bold text-neutral-900 mb-2">Failed to Load Worker</h2>
    <p className="text-sm text-neutral-500 max-w-md mb-6">{message || 'Unable to load worker details. Please try again.'}</p>
    <button onClick={onRetry} className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium">Try Again</button>
  </div>
);

// ─── Edit Worker Modal ───────────────────────────────────────────────────────
const EditWorkerModal = ({ show, onClose, worker, onSubmit, submitting }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier');
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && worker) {
      setFullName(worker.fullName || '');
      setPhone(worker.phone || '');
      setRole(worker.role || 'cashier');
      setPermissions(worker.permissions || []);
      setError('');
    }
  }, [show, worker]);

  const rolePermissions = {
    admin: ['view_sales', 'record_sales', 'edit_inventory', 'view_reports', 'manage_workers'],
    manager: ['view_sales', 'record_sales', 'edit_inventory', 'view_reports'],
    cashier: ['view_sales', 'record_sales', 'view_reports'],
  };

  const handleRoleChange = (r) => {
    setRole(r);
    setPermissions(rolePermissions[r] || []);
  };

  const handleSubmit = () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    setError('');
    onSubmit({ fullName: fullName.trim(), phone: phone.trim(), role, permissions });
  };

  if (!show) return null;

  const allPermissions = ['view_sales', 'record_sales', 'edit_inventory', 'view_reports', 'manage_workers'];
  const permLabels = {
    view_sales: 'View Sales',
    record_sales: 'Record Sales',
    edit_inventory: 'Edit Inventory',
    view_reports: 'View Reports',
    manage_workers: 'Manage Workers',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-white rounded-[20px] p-8 max-w-[460px] w-full shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-neutral-900">Edit Worker</h2>
              <p className="text-sm text-neutral-500 mt-1">Update worker details and permissions</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
              <X size={20} className="text-neutral-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-sm text-[#EF4444]">{error}</div>
          )}

          {/* Full Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-neutral-700 block mb-1.5">Full Name</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 px-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="text-sm font-medium text-neutral-700 block mb-1.5">Phone</label>
            <input
              type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full h-12 px-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
            />
          </div>

          {/* Role */}
          <div className="mb-5">
            <label className="text-sm font-medium text-neutral-700 block mb-2">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleChange(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      role === key
                        ? 'border-[#312E81] bg-[#EEF2FF]'
                        : 'border-[#CBD5E1] hover:border-neutral-400'
                    }`}
                  >
                    <Icon size={20} style={{ color: role === key ? '#312E81' : '#94A3B8' }} />
                    <span className={`text-xs font-medium ${role === key ? 'text-[#312E81]' : 'text-neutral-500'}`}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <label className="text-sm font-medium text-neutral-700 block mb-2">Permissions</label>
            <div className="space-y-2">
              {allPermissions.map((p) => (
                <label key={p} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={() => {
                      setPermissions((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      );
                    }}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#312E81] focus:ring-[#312E81]"
                  />
                  <span className="text-sm text-neutral-700">{permLabels[p]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#312E81] text-white rounded-xl font-medium text-sm hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Role Change Modal ──────────────────────────────────────────────────────
const RoleChangeModal = ({ show, onClose, worker, onSubmit }) => {
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (show && worker) setSelectedRole(worker.role || 'cashier');
  }, [show, worker]);

  if (!show) return null;

  const ROLE_OPTIONS = [
    { key: 'admin', label: 'Admin — Full access', icon: Shield, desc: 'Admins can manage workers, settings, and billing', warning: true },
    { key: 'manager', label: 'Manager — Standard access', icon: UserCheck, desc: 'Can manage inventory and view reports', warning: false },
    { key: 'cashier', label: 'Cashier — Limited access', icon: User, desc: 'Sales recording only', warning: false },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 sm:pt-[5vh] overflow-y-auto">
        <div className="bg-white sm:rounded-[20px] p-6 sm:p-8 max-w-[460px] w-full sm:shadow-2xl animate-fadeIn min-h-screen sm:min-h-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-neutral-900">Change Role for {worker?.fullName?.split(' ')[0]}</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Current role: <span className="font-medium text-neutral-700">{ROLE_CONFIG[worker?.role]?.label || 'Cashier'}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
              <X size={20} className="text-neutral-500" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedRole(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-[#CBD5E1] hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#312E81]' : 'bg-neutral-100'}`}>
                      <Icon size={18} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{opt.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                      {opt.warning && (
                        <p className="text-xs text-[#F59E0B] mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={11} /> {opt.desc}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle size={18} className="text-[#312E81]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onSubmit(selectedRole); onClose(); }}
              disabled={selectedRole === worker?.role}
              className="flex-1 h-11 bg-[#312E81] text-white rounded-xl font-medium text-sm hover:bg-[#1E1B4B] transition-colors disabled:opacity-50"
            >
              Change Role to {ROLE_CONFIG[selectedRole]?.label || selectedRole}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Remove Worker Modal ────────────────────────────────────────────────────
const RemoveWorkerModal = ({ show, onClose, worker, removeStep, setRemoveStep, removeType, setRemoveType, removeConfirmText, setRemoveConfirmText, onConfirm, isRemoving }) => {
  if (!show) return null;

  const salesCount = worker?.performance?.month?.salesCount || 0;

  const handleContinue = () => {
    if (removeStep === 1) setRemoveStep(2);
    if (removeStep === 2 && removeType === 'permanent' && removeConfirmText !== 'REMOVE') return;
    if (removeStep === 2) onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-white rounded-[20px] p-8 max-w-[460px] w-full shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-neutral-900">
                {removeStep === 1 ? `Remove ${worker?.fullName?.split(' ')[0]}?` : 'Confirm Removal'}
              </h2>
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
              <X size={20} className="text-neutral-500" />
            </button>
          </div>

          {removeStep === 1 && (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-[#F59E0B]" />
                </div>
                <p className="text-sm text-neutral-600 max-w-sm">
                  This will remove {worker?.fullName?.split(' ')[0]} from your duka. Their sales history will be preserved but they won't be able to access the shop anymore.
                </p>
              </div>

              <div className="space-y-2.5 mb-6">
                <label
                  onClick={() => setRemoveType('deactivate')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${removeType === 'deactivate' ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-[#CBD5E1] hover:border-neutral-400'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${removeType === 'deactivate' ? 'border-[#312E81]' : 'border-neutral-300'}`}>
                    {removeType === 'deactivate' && <div className="w-2.5 h-2.5 rounded-full bg-[#312E81]" />}
                  </div>
                  <span className="text-sm font-medium text-neutral-700">Deactivate — They can be reactivated later</span>
                </label>
                <label
                  onClick={() => setRemoveType('permanent')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${removeType === 'permanent' ? 'border-[#EF4444] bg-[#FEF2F2]' : 'border-[#CBD5E1] hover:border-neutral-400'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${removeType === 'permanent' ? 'border-[#EF4444]' : 'border-neutral-300'}`}>
                    {removeType === 'permanent' && <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />}
                  </div>
                  <span className="text-sm font-medium text-neutral-700">Permanently Delete — All their data will be anonymized</span>
                </label>
              </div>
            </>
          )}

          {removeStep === 2 && (
            <>
              <div className="bg-[#F9FAFB] rounded-xl p-4 mb-6 space-y-2.5">
                <p className="text-sm text-neutral-700 flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#10B981]" /> Sales history preserved ({salesCount} sales)
                </p>
                <p className="text-sm text-neutral-700 flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#10B981]" /> Account {removeType === 'deactivate' ? 'deactivated' : 'removed'} immediately
                </p>
                <p className="text-sm text-neutral-700 flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#10B981]" /> Active sessions terminated
                </p>
              </div>

              {removeType === 'permanent' && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Type <span className="font-bold text-[#EF4444]">REMOVE</span> to confirm</p>
                  <input
                    type="text"
                    value={removeConfirmText}
                    onChange={(e) => setRemoveConfirmText(e.target.value)}
                    placeholder="Type REMOVE"
                    className="w-full h-12 px-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#EF4444] focus:ring-4 focus:ring-[#FEF2F2]"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={removeStep === 2 ? () => setRemoveStep(1) : handleClose}
              className="flex-1 h-11 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors"
            >
              {removeStep === 2 ? 'Back' : 'Cancel'}
            </button>
            <button
              onClick={handleContinue}
              disabled={isRemoving || (removeStep === 2 && removeType === 'permanent' && removeConfirmText !== 'REMOVE')}
              className="flex-1 h-11 bg-[#EF4444] text-white rounded-xl font-medium text-sm hover:bg-[#DC2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRemoving && <Loader2 size={16} className="animate-spin" />}
              {removeStep === 1 ? 'Continue' : removeType === 'permanent' ? 'Confirm Removal' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Permissions Tab ─────────────────────────────────────────────────────────
const PermissionsTab = ({ worker, isAdmin, permOverrides, setPermOverrides, permSaving, onSave, onRoleChange }) => {
  const role = worker?.role || 'cashier';
  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.cashier;
  const RoleIconComp = roleCfg.icon;
  const immutablePermissions = getImmutablePermissions(role);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Group permissions by category
  const categories = useMemo(() => {
    const cats = {};
    Object.entries(PERMISSION_DEFINITIONS).forEach(([key, def]) => {
      if (!cats[def.category]) cats[def.category] = [];
      cats[def.category].push({ key, ...def });
    });
    return cats;
  }, []);

  const toggleSection = (category) => {
    setCollapsedSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleToggle = (permKey) => {
    if (immutablePermissions.includes(permKey)) return;
    setPermOverrides((prev) => ({
      ...prev,
      [permKey]: !prev[permKey],
    }));
  };

  return (
    <div className="space-y-6 pb-4 md:pb-0">
      {/* Role Selector */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${roleCfg.bg}`}>
              <RoleIconComp size={22} style={{ color: roleCfg.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{roleCfg.label} Role</p>
              <p className="text-xs text-neutral-500">
                {role === 'admin' ? 'Full access to all features' : role === 'manager' ? 'Standard management access' : 'Sales recording only'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onRoleChange}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
            >
              <Shield size={15} /> Change Role
            </button>
          )}
        </div>
      </div>

      {/* Permissions Grid by Category */}
      {Object.entries(categories).map(([category, perms]) => {
        const isCollapsed = collapsedSections[category];
        return (
        <div key={category} className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection(category)}
            className="w-full flex items-center justify-between md:cursor-default"
          >
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">{category} Permissions</h3>
            <span className="md:hidden text-neutral-400 transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </span>
          </button>
          <div className={`space-y-3 mt-4 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
            {perms.map((perm) => {
              const isEnabled = permOverrides[perm.key] === true;
              const isImmutable = immutablePermissions.includes(perm.key);
              const isDisabled = isImmutable && !isAdmin;
              const isAdminOnly = ['delete_products', 'manage_workers', 'manage_settings'].includes(perm.key);
              const showOnlyToAdmin = isAdminOnly && !isAdmin;

              if (showOnlyToAdmin) return null;

              return (
                <div key={perm.key} className={`flex items-center justify-between p-3 rounded-xl ${isDisabled ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-neutral-700">{perm.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{perm.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(perm.key)}
                    disabled={isDisabled}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex items-center flex-shrink-0 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isEnabled ? 'bg-[#312E81]' : 'bg-neutral-300'}`}
                  >
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}

      {/* Save Button — fixed bottom on mobile */}
      <div className="flex justify-end md:relative">
        {/* Desktop save button */}
        <div className="hidden md:block">
          <button
            onClick={onSave}
            disabled={permSaving}
            className="px-8 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {permSaving && <Loader2 size={16} className="animate-spin" />}
            Save Permissions
          </button>
        </div>
        {/* Mobile fixed save bar */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 p-3 z-40">
          <button
            onClick={onSave}
            disabled={permSaving}
            className="w-full py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {permSaving && <Loader2 size={16} className="animate-spin" />}
            Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sessions Tab ────────────────────────────────────────────────────────────
const SessionsTab = ({ worker, isAdmin, getToken, queryClient, workerId }) => {
  const [logoutTarget, setLogoutTarget] = useState(null);
  const [logoutAll, setLogoutAll] = useState(false);
  const [logging, setLogging] = useState(false);
  const { session } = useAuth();

  const sessions = worker?.activeSessions || [];
  const currentSessionId = session?.id;

  const handleForceLogout = async (sessionId) => {
    setLogging(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/auth/workers/${workerId}/force-logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
      }
    } catch (err) {
      console.error('Force logout error:', err);
    } finally {
      setLogging(false);
      setLogoutTarget(null);
      setLogoutAll(false);
    }
  };

  const handleLogoutAll = async () => {
    setLogging(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/auth/workers/${workerId}/force-logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, except: currentSessionId }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
      }
    } catch (err) {
      console.error('Force logout all error:', err);
    } finally {
      setLogging(false);
      setLogoutTarget(null);
      setLogoutAll(false);
    }
  };

  const getDeviceIcon = (device) => {
    if (device?.toLowerCase()?.includes('mobile')) return Smartphone;
    if (device?.toLowerCase()?.includes('tablet')) return Tablet;
    return Monitor;
  };

  const formatLoginTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Active now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Active Sessions</h2>
          <p className="text-sm text-neutral-500 mt-1">Devices currently logged into this account</p>
        </div>
        {sessions.filter((s) => s.sessionId !== currentSessionId).length > 0 && isAdmin && (
          <button
            onClick={() => setLogoutAll(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#FECACA] text-[#EF4444] rounded-xl hover:bg-[#FEF2F2] transition-colors text-sm font-medium w-full sm:w-auto justify-center"
          >
            <LogOut size={15} /> Logout All Sessions
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Monitor size={48} className="mx-auto text-neutral-200 mb-4" />
          <p className="text-sm text-neutral-500">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const isCurrent = s.sessionId === currentSessionId;
            const DeviceIcon = getDeviceIcon(s.device);
            return (
              <div
                key={s.sessionId || i}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3.5 transition-colors ${isCurrent ? 'border-l-[3px] border-l-[#10B981] bg-[#F0FDF4]/40' : 'border-neutral-100'}`}
              >
                {/* Device Icon */}
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <DeviceIcon size={20} className="text-neutral-500" />
                </div>

                {/* Session Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-neutral-900">
                    {s.browser || 'Unknown'} on {s.device || 'Unknown'}
                  </p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">{s.ip || 'Unknown IP'}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {s.loginAt ? `Logged in ${formatLoginTime(s.loginAt)}` : 'Login time unknown'}
                  </p>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[11px] font-medium">
                      Current Session
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                {!isCurrent && isAdmin && (
                  <button
                    onClick={() => setLogoutTarget(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors flex-shrink-0 w-full sm:w-auto justify-center mt-2 sm:mt-0"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Force Logout Single Session Modal */}
      {logoutTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setLogoutTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
            <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-full shadow-2xl animate-fadeIn">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Logout this session?</h2>
              <p className="text-sm text-neutral-600 mb-6">
                This will immediately log out {logoutTarget.browser} on {logoutTarget.device}. They'll need to sign in again.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setLogoutTarget(null)} className="flex-1 h-11 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleForceLogout(logoutTarget.sessionId)}
                  disabled={logging}
                  className="flex-1 h-11 bg-[#EF4444] text-white rounded-xl font-medium text-sm hover:bg-[#DC2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {logging && <Loader2 size={16} className="animate-spin" />}
                  Force Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Force Logout All Modal */}
      {logoutAll && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setLogoutAll(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
            <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-full shadow-2xl animate-fadeIn">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Logout all sessions?</h2>
              <p className="text-sm text-neutral-600 mb-6">
                This will log out ALL devices except your current session. Workers will need to sign in again.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setLogoutAll(false)} className="flex-1 h-11 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleLogoutAll}
                  disabled={logging}
                  className="flex-1 h-11 bg-[#EF4444] text-white rounded-xl font-medium text-sm hover:bg-[#DC2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {logging && <Loader2 size={16} className="animate-spin" />}
                  Logout All
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, subtext, trend, icon: Icon, iconColor }) => (
  <div className="bg-white rounded-xl border border-neutral-100 p-5 shadow-sm relative">
    <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
    <p className="text-[28px] font-bold text-neutral-900 mt-1">{value}</p>
    {subtext && <p className="text-[15px] text-[#312E81] mt-0.5">{subtext}</p>}
    {trend && (
      <span className={`inline-flex items-center gap-1 text-xs mt-1 ${trend > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
      </span>
    )}
    <Icon size={20} className="absolute top-4 right-4" style={{ color: iconColor }} />
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const WorkerDetailPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [chartPeriod, setChartPeriod] = useState('7d');
  const [chartMetric, setChartMetric] = useState('count');
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'permissions' | 'sessions'
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [removeStep, setRemoveStep] = useState(1); // 1=confirm, 2=action
  const [removeType, setRemoveType] = useState('deactivate'); // 'deactivate' | 'permanent'
  const [removeConfirmText, setRemoveConfirmText] = useState('');
  const [permOverrides, setPermOverrides] = useState({});
  const [permSaving, setPermSaving] = useState(false);

  // Current user for permission checks
  const { data: currentUser } = useCurrentUser();
  const currentRole = currentUser?.role || 'admin';
  const isAdmin = currentRole === ROLES.ADMIN;

  // ── Fetch worker detail ────────────────────────────────────────────
  const {
    data: worker,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to fetch worker');
      }
      const result = await res.json();
      return result.success ? result.data : null;
    },
    staleTime: 30 * 1000,
  });

  // ── Fetch performance chart data ───────────────────────────────────
  const { data: chartData = [] } = useQuery({
    queryKey: ['worker', workerId, 'performance', chartPeriod],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}/performance?period=${chartPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch performance');
      const result = await res.json();
      return result.success ? result.data : [];
    },
    staleTime: 60 * 1000,
  });

  // ── Fetch recent transactions ──────────────────────────────────────
  const { data: transactions = [] } = useQuery({
    queryKey: ['worker', workerId, 'transactions'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}/transactions?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const result = await res.json();
      return result.success ? result.data : [];
    },
    staleTime: 30 * 1000,
  });

  // ── Fetch activity log ─────────────────────────────────────────────
  const { data: activities = [] } = useQuery({
    queryKey: ['worker', workerId, 'activity'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}/activity?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch activity');
      const result = await res.json();
      return result.success ? result.data : [];
    },
    staleTime: 30 * 1000,
  });

  // ── Update worker mutation ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update worker');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setShowEditModal(false);
    },
  });

  // ── Remove worker mutation ─────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove worker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      navigate('/dashboard/workers');
    },
  });

  // ── Socket.io real-time updates ──────────────────────────────────
  const shopId = currentUser?.shop?._id;
  const socketCallbacks = useMemo(() => ({
    onWorkerRoleChanged: (data) => {
      if (data.workerId === workerId) {
        queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
        queryClient.invalidateQueries({ queryKey: ['workers'] });
      }
    },
    onSessionTerminated: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
    },
    onWorkerRemoved: (data) => {
      if (data.workerId === workerId) {
        queryClient.invalidateQueries({ queryKey: ['workers'] });
        navigate('/dashboard/workers');
      }
    },
  }), [workerId, queryClient, navigate]);
  useSocket(shopId, socketCallbacks);

  // ── Save permissions handler ─────────────────────────────────────
  const handleSavePermissions = useCallback(async () => {
    setPermSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permOverrides }),
      });
      if (!res.ok) throw new Error('Failed to save permissions');
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
    } catch (err) {
      console.error('Save permissions error:', err);
    } finally {
      setPermSaving(false);
    }
  }, [getToken, workerId, permOverrides, queryClient]);

  // Initialize perm overrides from worker data
  useEffect(() => {
    if (worker?.permissions?.length) {
      const overrides = {};
      worker.permissions.forEach((p) => { overrides[p] = true; });
      setPermOverrides(overrides);
    } else {
      // Default: role-based permissions
      const defaults = {};
      getRolePermissions(worker?.role || 'cashier').forEach((p) => { defaults[p] = true; });
      setPermOverrides(defaults);
    }
  }, [worker]);
  if (isLoading) return <div className="p-6"><WorkerDetailSkeleton /></div>;
  if (isError) return <div className="p-6"><WorkerDetailError message={error?.message} onRetry={() => refetch()} /></div>;
  if (!worker) return <div className="p-6"><WorkerDetailError message="Worker not found." onRetry={() => refetch()} /></div>;

  const roleCfg = ROLE_CONFIG[worker.role] || ROLE_CONFIG.cashier;
  const RoleIcon = roleCfg.icon;
  const isPending = worker.status === 'pending';
  const isOnline = worker.status === 'online';
  const initials = (worker.fullName || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const perf = worker.performance || {};

  // Chart data formatting
  const formattedChartData = chartData.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-KE', chartPeriod === '3m' ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
  }));

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) + `, ${time}`;
  };

  const getItemCount = (sale) => sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* ── Back Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/dashboard/workers')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#312E81] transition-colors py-1 font-medium"
      >
        <ArrowLeft size={16} /> Back to Workers
      </button>

      {/* ── Worker Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {worker.avatar ? (
              <img src={worker.avatar} alt={worker.fullName} className="w-[72px] h-[72px] rounded-full object-cover" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-[#312E81] text-white font-bold flex items-center justify-center text-2xl">
                {initials}
              </div>
            )}
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-[3px] border-white" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[26px] font-bold text-neutral-900 truncate">{worker.fullName}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-medium ${roleCfg.bg}`} style={{ color: roleCfg.color }}>
                <RoleIcon size={14} /> {roleCfg.label}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">{worker.email}</p>
            {worker.phone && (
              <p className="text-sm text-neutral-500 mt-0.5 flex items-center gap-1">
                <Phone size={13} /> {worker.phone}
              </p>
            )}
            <p className={`text-[13px] mt-1 ${isOnline ? 'text-[#10B981]' : isPending ? 'text-[#F59E0B]' : 'text-neutral-500'}`}>
              {isPending ? '⏳ Invitation sent' : isOnline ? '● Active now' : worker.lastLogin ? `○ Last seen ${formatTime(worker.lastLogin)}` : '○ Offline'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:self-start">
          {canEditWorkers(currentRole) && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
            >
              <Pencil size={16} /> Edit Worker
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium">
            <MessageSquare size={16} /> Message
          </button>
          {canEditWorkers(currentRole) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 border border-[#CBD5E1] rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <MoreVertical size={16} className="text-neutral-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg z-20 py-1.5">
                  <button
                    onClick={() => { setShowMenu(false); setActiveTab('permissions'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Shield size={14} /> View Permissions
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setActiveTab('sessions'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Monitor size={14} /> Active Sessions
                  </button>
                  {canRemoveWorkers(currentRole) && (
                    <button
                      onClick={() => { setShowMenu(false); setShowRemoveModal(true); setRemoveStep(1); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Remove Worker
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Today's Sales"
          value={perf.today?.salesCount || 0}
          subtext={formatCurrency(perf.today?.totalAmount || 0)}
          icon={ShoppingCart}
          iconColor="#312E81"
        />
        <StatCard
          label="This Week"
          value={`${perf.week?.salesCount || 0} Sales`}
          subtext={formatCurrency(perf.week?.totalAmount || 0)}
          trend={perf.week?.weekTrend}
          icon={TrendingUp}
          iconColor="#10B981"
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard
            label="This Month"
            value={`${perf.month?.salesCount || 0} Sales`}
            subtext={formatCurrency(perf.month?.totalAmount || 0)}
            trend={perf.month?.monthTrend}
            icon={BarChart3}
            iconColor="#312E81"
          />
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {[
          { key: 'performance', label: 'Performance' },
          { key: 'permissions', label: 'Permissions' },
          { key: 'sessions', label: 'Sessions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Performance ──────────────────────────────────────── */}
      {activeTab === 'performance' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (60%) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sales Performance Chart */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Sales Performance</h2>
              <div className="flex items-center gap-2">
                {/* Period pills */}
                <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                  {[
                    { key: '7d', label: '7 Days' },
                    { key: '30d', label: '30 Days' },
                    { key: '3m', label: '3 Months' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setChartPeriod(p.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        chartPeriod === p.key
                          ? 'bg-white text-[#312E81] shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Metric toggle */}
                <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartMetric('count')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      chartMetric === 'count' ? 'bg-white text-[#312E81] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    Sales Count
                  </button>
                  <button
                    onClick={() => setChartMetric('value')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      chartMetric === 'value' ? 'bg-white text-[#312E81] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    Value (KSh)
                  </button>
                </div>
              </div>
            </div>

            {formattedChartData.length === 0 || formattedChartData.every((d) => d.salesCount === 0 && d.totalAmount === 0) ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 size={48} className="text-neutral-200 mb-3" />
                <p className="text-sm text-neutral-500">No sales data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={formattedChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                    formatter={(value, name) => [
                      name === 'salesCount' ? `${value} sales` : formatCurrency(value),
                      name === 'salesCount' ? 'Sales' : 'Value',
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar
                    dataKey={chartMetric === 'count' ? 'salesCount' : 'totalAmount'}
                    fill="#312E81"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Sales</h2>
              <button className="text-sm text-[#312E81] font-medium hover:underline">View All →</button>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Receipt size={40} className="text-neutral-200 mb-3" />
                <p className="text-sm text-neutral-500">No sales recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Time</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Receipt #</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Items</th>
                      <th className="text-right py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Payment</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-neutral-500 uppercase">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((sale) => {
                      const pm = PAYMENT_CONFIG[sale.paymentMethod] || PAYMENT_CONFIG.cash;
                      const PmIcon = pm.icon;
                      return (
                        <tr key={sale._id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-2 text-[13px] text-neutral-500 whitespace-nowrap">
                            {new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-2 text-sm font-mono text-[#312E81] font-medium">{sale.saleNumber}</td>
                          <td className="py-3 px-2 text-[13px] text-neutral-700">{getItemCount(sale)} items</td>
                          <td className="py-3 px-2 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap">
                            {formatCurrency(sale.total)}
                          </td>
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center gap-1 text-[13px] text-neutral-600">
                              <PmIcon size={13} style={{ color: pm.color }} /> {pm.label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[13px] text-neutral-500">
                            {sale.customerName || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (40%) */}
        <div className="space-y-5">
          {/* Worker Information Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 mb-5">Worker Details</h2>
            <div className="space-y-4">
              <InfoRow label="Full Name" value={worker.fullName} />
              <InfoRow label="Email" value={worker.email} />
              <InfoRow label="Phone" value={worker.phone || '—'} />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Role</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleCfg.bg}`} style={{ color: roleCfg.color }}>
                  <RoleIcon size={12} /> {roleCfg.label}
                </span>
              </div>
              <InfoRow label="Joined Date" value={worker.createdAt ? new Date(worker.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
              {worker.invitedBy && <InfoRow label="Invited By" value={worker.invitedBy} />}
              <InfoRow
                label="Last Login"
                value={worker.lastLogin ? formatTime(worker.lastLogin) : 'Never'}
              />
              {worker.device && (
                <InfoRow
                  label="Device"
                  value={`${worker.device.browser || ''} on ${worker.device.device || ''}`}
                />
              )}
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full mt-5 h-10 border border-[#CBD5E1] text-neutral-700 rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={15} /> Edit Details
            </button>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 mb-5">Activity Log</h2>

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Clock size={40} className="text-neutral-200 mb-3" />
                <p className="text-sm text-neutral-500">No activity yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-200" />

                <div className="space-y-5">
                  {activities.map((act, i) => (
                    <div key={i} className="flex gap-3.5">
                      {/* Dot */}
                      <div className="relative z-10 shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ${ACTIVITY_DOT[act.type] || 'bg-neutral-400'}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900">{act.action}</p>
                        {act.detail && <p className="text-[13px] text-neutral-500 mt-0.5">{act.detail}</p>}
                        <p className="text-xs text-neutral-400 mt-1">{formatTime(act.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activities.length >= 20 && (
              <button className="w-full mt-4 py-2 text-sm text-[#312E81] font-medium hover:bg-[#EEF2FF] rounded-lg transition-colors">
                Load More
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── Tab: Permissions ────────────────────────────────────── */}
      {activeTab === 'permissions' && (
        <PermissionsTab
          worker={worker}
          isAdmin={isAdmin}
          permOverrides={permOverrides}
          setPermOverrides={setPermOverrides}
          permSaving={permSaving}
          onSave={handleSavePermissions}
          onRoleChange={() => setShowRoleModal(true)}
        />
      )}

      {/* ── Tab: Sessions ────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <SessionsTab
          worker={worker}
          isAdmin={isAdmin}
          getToken={getToken}
          queryClient={queryClient}
          workerId={workerId}
        />
      )}

      {/* ── Edit Worker Modal ──────────────────────────────────────── */}
      <EditWorkerModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        worker={worker}
        onSubmit={(data) => updateMutation.mutate(data)}
        submitting={updateMutation.isPending}
      />

      {/* ── Role Change Modal ───────────────────────────────────────── */}
      <RoleChangeModal
        show={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        worker={worker}
        onSubmit={(newRole) => updateMutation.mutate({ role: newRole })}
      />

      {/* ── Remove Worker Modal ─────────────────────────────────────── */}
      <RemoveWorkerModal
        show={showRemoveModal}
        onClose={() => { setShowRemoveModal(false); setRemoveStep(1); setRemoveConfirmText(''); }}
        worker={worker}
        removeStep={removeStep}
        setRemoveStep={setRemoveStep}
        removeType={removeType}
        setRemoveType={setRemoveType}
        removeConfirmText={removeConfirmText}
        setRemoveConfirmText={setRemoveConfirmText}
        onConfirm={() => removeMutation.mutate()}
        isRemoving={removeMutation.isPending}
      />

      {/* Toast for success */}
      {updateMutation.isSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#10B981] text-white px-4 py-3 rounded-xl shadow-lg animate-fadeIn text-sm font-medium">
          <CheckCircle size={18} /> Worker updated successfully
        </div>
      )}
    </div>
  );
};

// ─── Info Row Helper ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-[13px] text-neutral-500">{label}</span>
    <span className="text-sm font-medium text-neutral-900 text-right max-w-[60%] truncate">{value}</span>
  </div>
);

export default WorkerDetailPage;
