import React from 'react';
import { Search } from 'lucide-react';
import CategoryPills from './CategoryPills';

/**
 * Shared inventory filter bar — search input + category pills.
 * Used across all InventoryPage states.
 *
 * @param {string}   searchTerm        — Current search value
 * @param {Function} onSearchChange    — Called with new search value
 * @param {Array}    categories        — Category objects [{ name, count }]
 * @param {number}   total             — Total product count
 * @param {string}   selectedCategory  — Currently selected category
 * @param {Function} onCategorySelect  — Called with category name
 * @param {Function} onPageReset       — Called to reset page to 1
 */
const InventoryFilterBar = ({
  searchTerm,
  onSearchChange,
  categories = [],
  total = 0,
  selectedCategory = 'all',
  onCategorySelect,
  onPageReset,
}) => {
  const handleSearch = (value) => {
    onSearchChange(value);
    onPageReset?.();
  };

  const handleCategory = (cat) => {
    onCategorySelect(cat);
    onPageReset?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 py-4">
      <div className="px-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 border border-neutral-300 rounded-xl text-sm placeholder-neutral-400 focus:ring-2 focus:ring-[#312E81]/20 focus:border-[#312E81] outline-none"
          />
        </div>
      </div>

      <CategoryPills
        categories={categories}
        total={total}
        selected={selectedCategory}
        onSelect={handleCategory}
      />
    </div>
  );
};

export default InventoryFilterBar;
