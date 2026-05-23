import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const BranchContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const BranchProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(() =>
    localStorage.getItem('activeBranchId') || 'main'
  );
  const [hasMultiBranch, setHasMultiBranch] = useState(false);
  const [plan, setPlan] = useState('starta');
  const [shopName, setShopName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState(null);

  const activeBranch = branches.find((b) => b._id === activeBranchId) || null;

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch branches');
      const result = await res.json();
      if (result.success) {
        setBranches(result.data.branches);
        setHasMultiBranch(result.data.hasMultiBranch);
        setPlan(result.data.plan);
        setShopName(result.data.shopName);
      }
    } catch (err) {
      console.error('Fetch branches error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Switch branch
  const switchBranch = useCallback(async (branchId) => {
    if (branchId === activeBranchId) return;
    setIsSwitching(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/branches/${branchId}/switch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to switch branch');
      }
      const result = await res.json();
      if (result.success) {
        setActiveBranchId(branchId);
        localStorage.setItem('activeBranchId', branchId);
        return result;
      }
    } catch (err) {
      console.error('Switch branch error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSwitching(false);
    }
  }, [activeBranchId, getToken]);

  const value = {
    branches,
    activeBranch,
    activeBranchId,
    hasMultiBranch,
    plan,
    shopName,
    isLoading,
    isSwitching,
    error,
    switchBranch,
    refreshBranches: fetchBranches,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return ctx;
};
