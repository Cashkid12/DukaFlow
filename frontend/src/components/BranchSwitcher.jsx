import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check, Loader2, Settings, MapPin, Users, RefreshCw } from 'lucide-react';
import { useBranch } from '../context/BranchContext';
import { useCurrentUser } from '../hooks/useCurrentUser';

const BranchSwitcher = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    branches,
    activeBranch,
    activeBranchId,
    hasMultiBranch,
    shopName,
    isLoading,
    isSwitching,
    switchBranch,
  } = useBranch();

  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.role || 'admin';
  const isOwner = role === 'admin';

  // ── All hooks must be called unconditionally FIRST ──
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState(null);
  const [switchError, setSwitchError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Compute display name (must be before handleSwitch which references it)
  const displayName = activeBranch
    ? `${shopName} — ${activeBranch.isMain ? 'Main' : activeBranch.name}`
    : shopName;

  const handleSwitch = async (branchId) => {
    if (branchId === activeBranchId) return;
    setSwitchingTo(branchId);
    setSwitchError(null);
    try {
      const result = await switchBranch(branchId);
      // Update URL with branch param
      const params = new URLSearchParams(searchParams);
      if (branchId === 'main') {
        params.delete('branch');
      } else {
        const branch = branches.find((b) => b._id === branchId);
        params.set('branch', branch?.name?.toLowerCase().replace(/\s+/g, '-') || branchId);
      }
      setSearchParams(params, { replace: true });
      // Show success toast
      const msg = result?.data?.message || result?.message || `Switched to ${displayName}`;
      setSuccessToast(msg);
      setIsOpen(false);
      setSwitchingTo(null);
    } catch (err) {
      setSwitchError(err.message);
      // Keep switchingTo so retry button knows which branch failed
    }
  };

  const handleRetry = (branchId) => {
    setSwitchError(null);
    handleSwitch(branchId);
  };

  const handleManageBranches = () => {
    setIsOpen(false);
    navigate('/dashboard/settings?tab=multi-branch');
  };

  // ── Permission guards (after ALL hooks) ──
  // Cashiers don't see branch switcher
  if (role === 'cashier') return null;
  // Single branch: nothing shown
  if (!hasMultiBranch) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="hidden lg:flex items-center gap-2">
        <div className="h-5 w-32 bg-neutral-100 rounded animate-pulse" />
        <ChevronDown size={16} className="text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Switch branch"
      >
        {/* Desktop */}
        <span className="hidden lg:block text-lg font-semibold text-neutral-900 truncate max-w-[240px]">
          {displayName}
        </span>
        {/* Mobile */}
        <span className="lg:hidden text-sm font-semibold text-neutral-900 truncate max-w-[160px]">
          {activeBranch?.isMain ? shopName : `${shopName} — ${activeBranch?.name}`}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-neutral-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-neutral-500 flex-shrink-0" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 left-0 w-[280px] sm:w-[320px] bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden"
            style={{
              animation: 'branchDropdownIn 0.2s ease',
              borderRadius: '16px',
            }}
            role="listbox"
            aria-label="Select branch"
          >
            {/* Header */}
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-2">
                Switch Branch
              </p>
            </div>

            {/* Error message */}
            {switchError && (
              <div className="mx-3 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{switchError}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => setSwitchError(null)}
                    className="text-xs text-red-600 underline"
                  >
                    Dismiss
                  </button>
                  {switchingTo && (
                    <button
                      onClick={() => handleRetry(switchingTo)}
                      className="flex items-center gap-1 text-xs text-red-700 font-medium hover:text-red-800"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Branch list */}
            <div className="px-2 space-y-0.5">
              {branches.map((branch) => {
                const isActive = branch._id === activeBranchId;
                const isCurrentSwitch = switchingTo === branch._id;
                return (
                  <button
                    key={branch._id}
                    onClick={() => handleSwitch(branch._id)}
                    disabled={isActive || isSwitching}
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-[#EEF2FF] cursor-default'
                        : isSwitching
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-white hover:bg-neutral-50 cursor-pointer'
                    }`}
                    style={{ borderRadius: '10px' }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="flex items-start gap-3">
                      {/* Left indicator dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {isActive ? (
                          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-neutral-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[14px] sm:text-[15px] ${
                            isActive ? 'font-semibold text-[#312E81]' : 'font-medium text-[#1E293B]'
                          }`}
                        >
                          {shopName} — {branch.isMain ? 'Main' : branch.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin size={11} className="text-neutral-400 flex-shrink-0" />
                          <p className="text-[12px] text-neutral-500 truncate">
                            {branch.location || 'Main Branch'}
                          </p>
                        </div>
                        {branch.workerCount > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users size={11} className="text-neutral-400 flex-shrink-0" />
                            <p className="text-[11px] text-neutral-400">
                              {branch.workerCount} worker{branch.workerCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: checkmark or spinner */}
                      <div className="flex-shrink-0 mt-1">
                        {isCurrentSwitch ? (
                          <Loader2 size={16} className="text-[#312E81] animate-spin" />
                        ) : isActive ? (
                          <Check size={18} className="text-[#312E81]" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Manage Branches link — owners only */}
            {isOwner && (
              <>
                <div className="mx-3 my-2 border-t border-neutral-200" />
                <div className="px-2 pb-2">
                  <button
                    onClick={handleManageBranches}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left hover:bg-neutral-50 transition-colors"
                    style={{ borderRadius: '10px' }}
                  >
                    <Settings size={16} className="text-neutral-500 flex-shrink-0" />
                    <span className="text-[13px] text-neutral-600">Manage Branches</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Success Toast */}
      {successToast && (
        <div
          className="absolute top-full mt-2 left-0 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl shadow-lg animate-branchDropdownIn"
          style={{ borderRadius: '12px' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
          <span className="text-sm text-[#065F46]">{successToast} ✓</span>
        </div>
      )}

      {/* Dropdown animation keyframe — injected once */}
      <style>{`
        @keyframes branchDropdownIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BranchSwitcher;
