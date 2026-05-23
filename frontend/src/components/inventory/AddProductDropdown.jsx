import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Scan, Upload, ChevronDown } from 'lucide-react';

/**
 * Add Product dropdown button.
 * Three options: Manual Entry, Scan Barcode (Coming Soon), Import CSV.
 */
const AddProductDropdown = ({
  onBarcodeClick,
  onCsvClick,
  variant = 'desktop',
  className = '',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleManual = () => {
    setIsOpen(false);
    navigate('/dashboard/inventory/add');
  };

  const handleBarcode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't close dropdown; clicking it triggers the coming soon modal
    if (onBarcodeClick) onBarcodeClick();
  };

  const handleCsv = () => {
    setIsOpen(false);
    if (onCsvClick) onCsvClick();
  };

  // Mobile: full-width bottom sheet style
  if (variant === 'mobile') {
    return (
      <div ref={dropdownRef} className={className}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-semibold"
        >
          <span>＋ Add Product</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 space-y-1 animate-fadeIn">
            {/* Manual Entry */}
            <button
              onClick={handleManual}
              className="flex items-start gap-3 w-full p-3 rounded-xl hover:bg-[#EEF2FF] transition-colors text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Pencil size={18} className="text-[#312E81]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1E293B]">Add Manually</div>
                <div className="text-xs text-[#64748B] mt-0.5">Enter product details by hand</div>
              </div>
            </button>

            {/* Barcode - Coming Soon */}
            <button
              onClick={handleBarcode}
              className="flex items-start gap-3 w-full p-3 rounded-xl bg-neutral-50 transition-colors text-left cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scan size={18} className="text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1E293B]">Scan Barcode</span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8835C]/10 text-[#E8835C]">
                    Coming Soon
                  </span>
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">Use your camera to scan products</div>
              </div>
            </button>

            {/* CSV Upload */}
            <button
              onClick={handleCsv}
              className="flex items-start gap-3 w-full p-3 rounded-xl hover:bg-[#EEF2FF] transition-colors text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Upload size={18} className="text-[#312E81]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1E293B]">Import CSV</div>
                <div className="text-xs text-[#64748B] mt-0.5">Upload multiple products at once</div>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: dropdown positioned absolute
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-11 px-5 bg-[#312E81] text-white rounded-[10px] hover:bg-[#1E1B4B] transition-colors text-sm font-semibold whitespace-nowrap"
      >
        <span>＋ Add Product</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-neutral-200 p-2 z-50 animate-fadeIn">
          {/* Manual Entry */}
          <button
            onClick={handleManual}
            className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-[#EEF2FF] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Pencil size={18} className="text-[#312E81]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">Add Manually</div>
              <div className="text-xs text-[#64748B] mt-0.5">Enter product details by hand</div>
            </div>
          </button>

          {/* Barcode - Coming Soon */}
          <button
            onClick={handleBarcode}
            className="flex items-start gap-3 w-full p-3 rounded-lg bg-neutral-50 transition-colors text-left cursor-default"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Scan size={18} className="text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1E293B]">Scan Barcode</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8835C]/10 text-[#E8835C] whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">Use your camera to scan products</div>
            </div>
          </button>

          {/* CSV Upload */}
          <button
            onClick={handleCsv}
            className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-[#EEF2FF] transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Upload size={18} className="text-[#312E81]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">Import CSV</div>
              <div className="text-xs text-[#64748B] mt-0.5">Upload multiple products at once</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default AddProductDropdown;
