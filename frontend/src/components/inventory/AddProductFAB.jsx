import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';

/**
 * Floating Action Button for adding products.
 * Used across all InventoryPage states (empty, empty-category, no-results, data).
 *
 * @param {string}  icon — lucide icon to use ('package' | 'plus'), defaults to 'plus'
 */
const AddProductFAB = ({ icon = 'plus' }) => {
  const navigate = useNavigate();
  const IconComponent = icon === 'package' ? Package : Plus;

  return (
    <button
      onClick={() => navigate('/dashboard/inventory/add')}
      className="fixed md:bottom-6 md:right-6 bottom-20 right-4 w-14 h-14 rounded-2xl bg-[#312E81] text-white shadow-lg hover:bg-[#1E1B4B] hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
      aria-label="Add product"
    >
      <IconComponent size={24} />
    </button>
  );
};

export default AddProductFAB;
