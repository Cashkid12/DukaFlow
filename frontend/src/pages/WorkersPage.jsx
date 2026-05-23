import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, User, UserCheck, Shield, Mail, Phone,
  Search, X, Loader2, Send, CheckCircle, Eye, Pencil,
  MessageSquare, Wifi, ShoppingCart, Award, AlertCircle, MoreVertical,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { formatCurrency } from '../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: '#312E81', bg: '#EEF2FF' },
  manager: { label: 'Manager', icon: UserCheck, color: '#312E81', bg: '#EEF2FF' },
  cashier: { label: 'Cashier', icon: User, color: '#312E81', bg: '#EEF2FF' },
};

const ROLE_DESCRIPTIONS = {
  admin: { icon: Shield, desc: 'Full access. Can manage everything including workers, settings, and reports.' },
  manager: { icon: UserCheck, desc: 'Can manage inventory, record sales, and view reports. Cannot add workers.' },
  cashier: { icon: User, desc: 'Sales only. Can record sales and view products. Cannot edit inventory.' },
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const WorkersSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 w-40 bg-neutral-200 rounded-lg" />
      <div className="h-10 w-36 bg-neutral-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-64 bg-neutral-100 rounded-2xl" />
      ))}
    </div>
  </div>
);

// ─── Error State ─────────────────────────────────────────────────────────────
const WorkersError = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
      <AlertCircle size={32} className="text-[#EF4444]" />
    </div>
    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Failed to Load Workers</h2>
    <p className="text-sm text-[#64748B] max-w-md mb-6">Unable to load your team. Please check your connection and try again.</p>
    <button onClick={onRetry} className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium">Try Again</button>
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
const WorkersEmpty = ({ onInvite, onSkip }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-[520px] mx-auto">
    <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
      <Users size={44} className="text-neutral-200" />
    </div>
    <h2 className="text-[22px] font-bold text-[#1E293B]">No workers added yet</h2>
    <p className="text-[15px] text-[#64748B] mt-2 max-w-[420px] leading-relaxed">
      Invite your staff to help manage the duka. They can record sales and manage inventory based on their role.
    </p>

    {/* Role Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full">
      {Object.entries(ROLE_DESCRIPTIONS).map(([key, { icon: Icon, desc }]) => (
        <div key={key} className="bg-white border border-neutral-100 rounded-xl p-4 text-left">
          <Icon size={28} className="text-[#312E81] mb-2" />
          <p className="text-base font-semibold text-[#1E293B]">{ROLE_CONFIG[key].label}</p>
          <p className="text-[13px] text-[#64748B] mt-1">{desc}</p>
        </div>
      ))}
    </div>

    <button onClick={onInvite} className="mt-7 h-12 px-8 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm flex items-center gap-2">
      <UserPlus size={18} /> Invite Your First Worker
    </button>
    <button onClick={onSkip} className="mt-4 text-sm text-[#64748B] hover:text-[#334155] font-medium transition-colors">Skip for now →</button>
  </div>
);

// ─── Summary Cards ───────────────────────────────────────────────────────────
const SummaryCards = ({ workers }) => {
  const total = workers.length;
  const active = workers.filter((w) => w.status === 'online').length;
  const totalSales = workers.reduce((sum, w) => sum + (w.performance?.salesCount || 0), 0);
  const topPerformer = workers.reduce((best, w) =>
    (w.performance?.salesCount || 0) > (best.performance?.salesCount || 0) ? w : best
  , workers[0]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-neutral-100 p-4 relative">
        <p className="text-[13px] text-[#64748B]">Total Workers</p>
        <p className="text-[28px] font-bold text-[#1E293B] mt-1">{total}</p>
        <Users size={20} className="text-[#312E81] absolute top-4 right-4" />
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-4 relative">
        <p className="text-[13px] text-[#64748B]">Active Now</p>
        <p className="text-[28px] font-bold text-[#10B981] mt-1">{active} Online</p>
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <Wifi size={18} className="text-[#10B981]" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-4 relative">
        <p className="text-[13px] text-[#64748B]">Sales Today</p>
        <p className="text-[28px] font-bold text-[#1E293B] mt-1">{totalSales} Sales</p>
        <ShoppingCart size={20} className="text-[#312E81] absolute top-4 right-4" />
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-4 relative">
        <p className="text-[13px] text-[#64748B]">Top Performer</p>
        <p className="text-xl font-bold text-[#1E293B] mt-1 truncate pr-8">
          {topPerformer ? topPerformer.fullName : '—'}
        </p>
        {topPerformer && (
          <p className="text-xs text-[#64748B] mt-0.5">
            {topPerformer.performance?.salesCount || 0} sales · {formatCurrency(topPerformer.performance?.totalAmount || 0)}
          </p>
        )}
        <Award size={20} className="text-[#E8835C] absolute top-4 right-4" />
      </div>
    </div>
  );
};

// ─── Worker Card ─────────────────────────────────────────────────────────────
const WorkerCard = ({ worker, onView, onEdit, onResend }) => {
  const roleCfg = ROLE_CONFIG[worker.role] || ROLE_CONFIG.cashier;
  const Icon = roleCfg.icon;
  const initials = (worker.fullName || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isPending = worker.status === 'pending';
  const isOnline = worker.status === 'online';

  const statusDisplay = isPending
    ? { label: '⏳ Invitation sent', color: 'text-[#F59E0B]' }
    : isOnline
      ? { label: '● Active now', color: 'text-[#10B981]' }
      : { label: `○ Last seen ${worker.lastLogin ? new Date(worker.lastLogin).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '—'}`, color: 'text-[#64748B]' };

  const invitedDaysAgo = worker.invitedAt
    ? Math.floor((Date.now() - new Date(worker.invitedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-5 ${
        isPending ? 'border-dashed border-neutral-300 bg-neutral-50' : 'border-neutral-100'
      }`}
      onClick={() => onView(worker)}
    >
      {/* Top Section */}
      <div className="flex gap-3.5">
        <div className="relative shrink-0">
          {worker.avatar ? (
            <img src={worker.avatar} alt={worker.fullName} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#312E81] text-white font-bold flex items-center justify-center text-lg">
              {initials}
            </div>
          )}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-semibold text-[#1E293B] truncate">{worker.fullName}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium mt-0.5 ${roleCfg.bg}`} style={{ color: roleCfg.color }}>
            {roleCfg.label}
          </span>
          <p className="text-[13px] text-[#64748B] mt-1 truncate">{worker.email}</p>
          <p className={`text-xs mt-0.5 ${statusDisplay.color}`}>{statusDisplay.label}</p>
          {isPending && invitedDaysAgo !== null && (
            <p className="text-xs text-[#64748B] mt-0.5">Invited {invitedDaysAgo === 0 ? 'today' : `${invitedDaysAgo} day${invitedDaysAgo > 1 ? 's' : ''} ago`}</p>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-100">
        <div>
          <p className="text-[15px] font-semibold text-[#1E293B]">{worker.performance?.salesCount || 0} sales</p>
          <p className="text-[11px] text-[#64748B]">Today</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#312E81]">{formatCurrency(worker.performance?.totalAmount || 0)}</p>
          <p className="text-[11px] text-[#64748B]">Total</p>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#1E293B]">{formatCurrency(worker.performance?.avgSale || 0)}</p>
          <p className="text-[11px] text-[#64748B]">Average</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#E8835C] rounded-full transition-all duration-500" style={{ width: `${worker.performance?.percentage || 0}%` }} />
        </div>
        <p className="text-[11px] text-neutral-400 text-right mt-1">{worker.performance?.percentage || 0}% of top performer</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-100">
        <button
          onClick={(e) => { e.stopPropagation(); onView(worker); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#64748B] border border-[#CBD5E1] rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <Eye size={13} /> View Details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(worker); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#64748B] border border-[#CBD5E1] rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <Pencil size={13} /> Edit Role
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#64748B] border border-[#CBD5E1] rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <MessageSquare size={13} /> Message
        </button>
      </div>

      {/* Pending: Resend Invite */}
      {isPending && (
        <button
          onClick={(e) => { e.stopPropagation(); onResend(worker); }}
          className="w-full mt-2 py-2 text-xs font-medium text-[#312E81] bg-[#EEF2FF] rounded-lg hover:bg-[#DBEAFE] transition-colors"
        >
          Resend Invitation
        </button>
      )}
    </div>
  );
};

// ─── Add Worker Modal ────────────────────────────────────────────────────────
const AddWorkerModal = ({ show, onClose, onSubmit, submitting }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier');
  const [permissions, setPermissions] = useState(['view_sales', 'record_sales', 'view_reports']);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('cashier');
      setPermissions(['view_sales', 'record_sales', 'view_reports']);
      setError('');
    }
  }, [show]);

  const handleSubmit = () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!email.trim()) { setError('Email address is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    onSubmit({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), role, permissions });
  };

  // Permissions by role
  const rolePermissions = {
    admin: ['view_sales', 'record_sales', 'edit_inventory', 'view_reports', 'manage_workers'],
    manager: ['view_sales', 'record_sales', 'edit_inventory', 'view_reports'],
    cashier: ['view_sales', 'record_sales', 'view_reports'],
  };

  const handleRoleChange = (r) => {
    setRole(r);
    setPermissions(rolePermissions[r] || []);
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="bg-white rounded-[20px] p-8 max-w-[460px] w-full shadow-2xl animate-fadeIn">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-[#1E293B]">Invite a Worker</h2>
              <p className="text-sm text-[#64748B] mt-1">They'll receive an email invitation to join your duka</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
              <X size={20} className="text-[#64748B]" />
            </button>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#334155] block mb-1.5">Full Name <span className="text-[#EF4444]">*</span></label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="John Mwangi"
                className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#334155] block mb-1.5">Email Address <span className="text-[#EF4444]">*</span></label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[#334155] block mb-1.5">Phone Number (Optional)</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full h-12 pl-10 pr-4 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] focus:ring-4 focus:ring-[#EEF2FF]"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#334155] block mb-2">Role <span className="text-[#EF4444]">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isSelected = role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRoleChange(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      isSelected ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-[#CBD5E1] bg-white hover:border-[#312E81]'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-[#312E81]' : 'text-[#64748B]'} />
                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#312E81]' : 'text-[#1E293B]'}`}>{cfg.label}</span>
                    <span className="text-[10px] text-[#64748B] leading-tight">
                      {key === 'admin' ? 'Full access to everything' : key === 'manager' ? 'Inventory, sales, reports' : 'Sales recording only'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[#334155] block mb-2">Permissions</label>
            <div className="space-y-2">
              {[
                { key: 'view_sales', label: 'View Sales' },
                { key: 'record_sales', label: 'Record Sales' },
                { key: 'edit_inventory', label: 'Edit Inventory' },
                { key: 'view_reports', label: 'View Reports' },
                { key: 'manage_workers', label: 'Manage Workers' },
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.key)}
                    disabled={perm.key === 'manage_workers' && role !== 'admin'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissions((p) => [...p, perm.key]);
                      } else {
                        setPermissions((p) => p.filter((k) => k !== perm.key));
                      }
                    }}
                    className="w-4 h-4 rounded accent-[#312E81]"
                  />
                  <span className={`text-sm ${(perm.key === 'manage_workers' && role !== 'admin') ? 'text-neutral-400' : 'text-[#334155]'}`}>
                    {perm.label}
                    {perm.key === 'manage_workers' && role !== 'admin' && <span className="text-xs text-neutral-400 ml-1">(Admin only)</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-[#EEF2FF] rounded-[10px] mb-5">
            <p className="text-[13px] text-[#4338CA]">
              💡 They'll receive an email from Clerk with a link to set up their account. Once they accept, they'll appear in your worker list.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#EF4444] mb-4 p-3 bg-[#FEF2F2] rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Invitation
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Invite Success Modal ────────────────────────────────────────────────────
const InviteSuccessModal = ({ show, worker, onInviteAnother, onDone }) => {
  if (!show || !worker) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onDone} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-full shadow-2xl text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">Invitation Sent!</h2>
          <p className="text-sm text-[#64748B] mb-1">
            {worker.fullName} will receive an email to join your shop as a {ROLE_CONFIG[worker.role]?.label || 'Worker'}.
          </p>
          <p className="text-xs text-neutral-400 mb-6">Email sent to: {worker.email}</p>
          <div className="flex gap-3">
            <button onClick={onInviteAnother} className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors">
              Invite Another
            </button>
            <button onClick={onDone} className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Main WorkersPage ────────────────────────────────────────────────────────
const WorkersPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [invitedWorker, setInvitedWorker] = useState(null);
  const [inviting, setInviting] = useState(false);

  // Fetch workers
  const { data: workers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['workers', statusFilter, search],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE_URL}/workers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch workers');
      const result = await res.json();
      return result.success ? result.data : [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Socket for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socket.on('worker:invited', () => queryClient.invalidateQueries({ queryKey: ['workers'] }));
    socket.on('sale:completed', () => queryClient.invalidateQueries({ queryKey: ['workers'] }));
    return () => { if (socket.connected) socket.disconnect(); };
  }, [queryClient]);

  // Invite worker
  const handleInvite = useCallback(async (data) => {
    setInviting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to invite worker');
      }
      const result = await res.json();
      setInvitedWorker(result.data);
      setShowAddModal(false);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    } catch (err) {
      alert(err.message || 'Failed to invite worker');
    } finally {
      setInviting(false);
    }
  }, [getToken, queryClient]);

  // Resend invite
  const handleResend = useCallback(async (worker) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/workers/${worker._id}/resend-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['workers'] });
      }
    } catch { /* ignore */ }
  }, [getToken, queryClient]);

  // Navigate to worker detail page
  const handleViewWorker = useCallback((worker) => {
    navigate(`/dashboard/workers/${worker._id}`);
  }, [navigate]);

  const handleEditRole = useCallback((worker) => {
    // Future: open edit modal
  }, []);

  const hasWorkers = workers.length > 0;

  if (isLoading) return <div className="p-6"><WorkersSkeleton /></div>;
  if (isError) return <div className="p-6"><WorkersError onRetry={() => refetch()} /></div>;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">Workers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm"
        >
          <UserPlus size={18} /> Add Worker
        </button>
      </div>

      {/* Empty State */}
      {!hasWorkers && (
        <WorkersEmpty
          onInvite={() => setShowAddModal(true)}
          onSkip={() => navigate('/dashboard/sales')}
        />
      )}

      {/* With Workers */}
      {hasWorkers && (
        <>
          {/* Summary Cards */}
          <SummaryCards workers={workers} />

          {/* Worker List Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E293B]">All Workers</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Status Filter */}
              <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                {['all', 'active', 'offline', 'pending'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === s ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'
                    }`}
                  >
                    {s === 'all' ? 'All' : s === 'active' ? 'Active' : s === 'offline' ? 'Offline' : 'Pending'}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workers..."
                  className="w-full h-9 pl-9 pr-3 border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#312E81]"
                />
              </div>
            </div>
          </div>

          {/* Worker Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <WorkerCard
                key={worker._id}
                worker={worker}
                onView={handleViewWorker}
                onEdit={handleEditRole}
                onResend={handleResend}
              />
            ))}
          </div>
        </>
      )}

      {/* FAB for mobile */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#312E81] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-[#1E1B4B] transition-colors"
      >
        <UserPlus size={22} />
      </button>

      {/* Add Worker Modal */}
      <AddWorkerModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleInvite}
        submitting={inviting}
      />

      {/* Success Modal */}
      <InviteSuccessModal
        show={showSuccess}
        worker={invitedWorker}
        onInviteAnother={() => {
          setShowSuccess(false);
          setShowAddModal(true);
        }}
        onDone={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default WorkersPage;
