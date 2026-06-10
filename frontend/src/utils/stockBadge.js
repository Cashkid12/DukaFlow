/**
 * Shared stock badge utility.
 * Used by ProductCard, RestockModal, InventoryPage (list view), and ProductDetailPage.
 *
 * Returns consistent styling for in_stock / low_stock / out_of_stock statuses.
 */
export const getStockBadge = (status) => {
  switch (status) {
    case 'in_stock':
      return {
        label: 'In Stock',
        bg: 'bg-[#D1FAE5]',
        text: 'text-[#10B981]',
        dot: 'bg-[#10B981]',
      };
    case 'low_stock':
      return {
        label: 'Low Stock',
        bg: 'bg-[#FEF3C7]',
        text: 'text-[#F59E0B]',
        dot: 'bg-[#F59E0B]',
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#EF4444]',
        dot: 'bg-[#EF4444]',
      };
    default:
      return {
        label: 'In Stock',
        bg: 'bg-[#D1FAE5]',
        text: 'text-[#10B981]',
        dot: 'bg-[#10B981]',
      };
  }
};

/**
 * Returns a hex color string for the stock bar based on status.
 */
export const getStockBarHex = (status) => {
  switch (status) {
    case 'in_stock': return '#10B981';
    case 'low_stock': return '#F59E0B';
    default: return '#EF4444';
  }
};
