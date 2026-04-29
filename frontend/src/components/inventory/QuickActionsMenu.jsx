import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Package, Copy, Trash2 } from 'lucide-react';
import { canEditProduct, canRestock, canDuplicateProduct, canDeleteProduct } from '../../utils/inventoryPermissions';

/**
 * Quick Actions Menu Component
 * Three-dot menu on each product card
 */
const QuickActionsMenu = ({ product, userRole, onEdit, onRestock, onDuplicate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const permissions = {
    canEdit: canEditProduct(userRole),
    canRestock: canRestock(userRole),
    canDuplicate: canDuplicateProduct(userRole),
    canDelete: canDeleteProduct(userRole),
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'edit':
        onEdit?.(product);
        break;
      case 'restock':
        onRestock?.(product);
        break;
      case 'duplicate':
        onDuplicate?.(product);
        break;
      case 'delete':
        onDelete?.(product);
        break;
      default:
        break;
    }
  };

  // Don't render if no permissions
  if (!Object.values(permissions).some(Boolean)) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Three-dot button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
        aria-label="Product actions"
        aria-expanded={isOpen}
      >
        <MoreVertical size={18} className="text-neutral-600" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
          {permissions.canEdit && (
            <button
              onClick={() => handleAction('edit')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Edit size={16} className="text-blue-600" />
              <span>Edit Product</span>
            </button>
          )}
          
          {permissions.canRestock && (
            <button
              onClick={() => handleAction('restock')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Package size={16} className="text-green-600" />
              <span>Restock</span>
            </button>
          )}
          
          {permissions.canDuplicate && (
            <button
              onClick={() => handleAction('duplicate')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Copy size={16} className="text-purple-600" />
              <span>Duplicate</span>
            </button>
          )}
          
          {permissions.canDelete && (
            <>
              <div className="border-t border-neutral-100 my-1"></div>
              <button
                onClick={() => handleAction('delete')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Product</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickActionsMenu;
