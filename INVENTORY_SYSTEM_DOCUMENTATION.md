# DUKAFLOW INVENTORY — SYSTEM DOCUMENTATION

## Status: ✅ Production-Ready

Complete inventory management system with products CRUD, real-time updates via Socket.io, client-side filtering/sorting/pagination, CSV import/export, stock tracking, price history, and role-based permissions.

---

## Architecture

### Data Fetching Strategy

| Strategy | Trigger | Mechanism |
|----------|---------|-----------|
| **Initial Fetch** | Page mount | `useInventoryQuery` → `GET /api/products?limit=0` (fetch ALL) |
| **Auto-Refresh** | Every 60s | React Query `refetchInterval: 60_000` |
| **Real-Time Push** | Backend events | `useInventorySocket` invalidates query cache |
| **Optimistic Delete** | User clicks delete | `queryClient.setQueryData` — instant UI, then API call |

### Data Flow

```
Clerk Auth (getToken)
    ↓
useInventoryQuery (React Query)
    ↓
GET /api/products?limit=0  →  productController.getProducts
    ↓                              ↓
Single API call returns:     MongoDB aggregation:
  products[]                  → All active products
  categories[]                → Categories with counts
  stockStatus{}               → Stock status counts
  filters{}                   → Dynamic attributes (sizes, colors, brands)
  total / totalAll            → Pagination totals
    ↓
Client-side processing:
  → Filtering (category, stock status, search, attributes)
  → Sorting (8 sort options)
  → Pagination (20 per page, "Load More" on mobile)
    ↑
useInventorySocket (Socket.io)
  Invalidates query cache on:
  product:created | product:updated | product:deleted
  stock:updated | sale:completed
```

### Key Design Decision: Client-Side Everything

The inventory fetches **ALL** products in a single API call (`limit=0`). Filtering, sorting, and pagination happen on the client — giving instant UI response with zero server roundtrips for filtering.

---

## Files

### Frontend

| File | Purpose |
|------|---------|
| `src/pages/InventoryPage.jsx` | Main page — 6 states, grid/list view, filter bar, pagination, toast |
| `src/hooks/useInventoryQuery.js` | React Query hook → fetches all products, categories, filters, stats |
| `src/hooks/useInventorySocket.js` | Socket.io hook → invalidates inventory + dashboard queries |
| `src/hooks/useDebounce.js` | Debounce hook — 300ms delay on search input |
| `src/hooks/useCategoriesQuery.js` | Categories fetch hook |
| `src/hooks/useFiltersQuery.js` | Available filters fetch hook |
| `src/components/inventory/ProductCard.jsx` | Card with image, price, margin, stock badge, actions |
| `src/components/inventory/CategoryPills.jsx` | Horizontal scrollable category pills with counts |
| `src/components/inventory/InventoryFilterBar.jsx` | Search + category pills wrapper |
| `src/components/inventory/AddProductDropdown.jsx` | "Add Product" dropdown (manual / CSV / barcode) |
| `src/components/inventory/AddProductFAB.jsx` | Floating action button (mobile) |
| `src/components/inventory/RestockModal.jsx` | Restock with quantity + price update |
| `src/components/inventory/DeleteConfirmModal.jsx` | Delete confirmation dialog |
| `src/components/inventory/CsvUploadModal.jsx` | CSV upload with preview, validation, business-type templates |
| `src/components/inventory/BarcodeComingSoonModal.jsx` | Coming soon modal |
| `src/components/inventory/BarcodeScanningModal.jsx` | Barcode scanner placeholder |
| `src/components/common/ErrorState.jsx` | Shared error UI with retry |
| `src/utils/formatters.js` | `formatCurrency()`, `formatNumber()` |
| `src/utils/stockBadge.js` | `getStockBadge()` — returns badge config |
| `src/utils/permissions.js` | `canAddProduct()`, `canEditProduct()`, `canDeleteProduct()` |

### Backend

| File | Purpose |
|------|---------|
| `controllers/productController.js` | 14 endpoints: CRUD, stock, history, CSV, images |
| `routes/products.js` | Route definitions with `clerkAuth` middleware |
| `models/Product.js` | Mongoose schema — 100+ fields across business types |
| `models/PriceHistory.js` | Mongoose schema — tracks every price change |
| `models/StockHistory.js` | Mongoose schema — tracks every stock change |
| `middleware/clerkAuth.js` | Clerk JWT verification → attaches `req.user.shop` |

---

## Inventory States

### State 1: Loading (Skeleton)

```jsx
if (isLoading) {
  return <SkeletonGrid />;
}
```

Renders:
- Header skeleton (title + subtitle)
- Search bar skeleton
- 6 category pill skeletons
- 8 product card skeletons (grid) with `animate-pulse`
- Image area (`aspect-square`), title, badges, price, stock

### State 2: Error (Network Failure)

```jsx
if (isError) {
  return <ErrorState title="Unable to load inventory" onRetry={refetch} />;
}
```

- Uses shared `ErrorState` component
- "Try Again" button → `refetch()`

### State 3: Truly Empty (`totalAll === 0`)

No products in the shop at all:
- Package icon (56-80px responsive)
- "Your inventory is empty"
- Role-aware subtext: Cashiers see "Ask your manager to add products"
- Two CTAs: "Add Your First Product" + "📷 Scan Barcode"
- "Need help? View our inventory guide →" link
- Admin-only: "Import via CSV" button

### State 4: Filtered Empty (hasData but no results)

Products exist but filters yield zero:
- **Category-only filter**: "No products in {category}" + "Add Product in {category}" button + "Clear Filter" link
- **Other filters**: Search icon + "No products match your filters" + "Clear All Filters" button

### State 5: Grid View (Data)

- Product cards in `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Each card shows: image, name, category badge, margin %, stock status, cost/price
- Role-aware actions: Edit, Restock, Duplicate, Delete (shown per permission)

### State 6: List View (Data)

- Table with columns: Product, Category, Cost, Price, Stock, Status
- Click row → navigate to product detail
- Stock status badges with colored dots

---

## Filtering System

### Filter Bar Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search...    [Sort ▼] [Filters] [▦ ▤]              │
│                                                         │
│ [All (42)] [Clothing (12)] [Electronics (5)] [More...]  │
│                                                         │
│ [All Stock] [In Stock (30)] [Low Stock (8)] [OOS (4)]   │
│                                                         │
│ [Size: All ▼] [Color: All ▼] [Brand: All ▼]            │
└─────────────────────────────────────────────────────────┘
```

### Filter Types

| Filter | Source | Type |
|--------|--------|------|
| **Search** | `searchTerm` + `useDebounce(300ms)` | Text (name, SKU, description) |
| **Category** | `data.categories` — `[{name, count}]` | Single-select pills |
| **Stock Status** | `in_stock`, `low_stock`, `out_of_stock` | Single-select pills |
| **Size** | `data.filters.sizes[]` | Dropdown |
| **Color** | `data.filters.colors[]` | Dropdown |
| **Brand** | `data.filters.brands[]` | Dropdown |

### Active Filter Chips

When any filter is active, a "smart" chip bar appears:
```
Active Filters: [Clothing ✕] [Low Stock ✕] [Blue ✕] ["nike" ✕]  Clear All
```

Each chip is independently dismissible. "Clear All" resets everything.

### Deep-Link from Dashboard

Dashboard's Low Stock card links to `/dashboard/inventory?filter=low-stock`. The inventory page reads URL params on mount and applies the filter automatically.

---

## Sorting

| Option | Field | Direction |
|--------|-------|-----------|
| Newest First | `createdAt` | desc |
| Oldest First | `createdAt` | asc |
| Price: High to Low | `price` | desc |
| Price: Low to High | `price` | asc |
| Stock: Low to High | `stock` | asc |
| Stock: High to Low | `stock` | desc |
| Name: A to Z | `name` | asc |
| Name: Z to A | `name` | desc |

---

## Product Actions (Role-Based)

| Action | Admin | Manager | Cashier |
|--------|-------|---------|---------|
| **View detail** | ✅ | ✅ | ✅ |
| **Edit** | ✅ | ✅ | ❌ |
| **Restock** | ✅ | ✅ | ❌ |
| **Duplicate** | ✅ | ✅ | ❌ |
| **Delete** | ✅ | ✅ | ❌ |

Permission checks via `permissions.js`:
```javascript
canAddProduct(role)    // Admin, Manager
canEditProduct(role)   // Admin, Manager
canDeleteProduct(role) // Admin, Manager
```

---

## Delete Flow (Hard Delete)

```
User clicks delete icon on product card
  → DeleteConfirmModal opens
    → Shows product name, "This action cannot be undone"
    → "Cancel" / "Delete Permanently" buttons
      → handleDeleteConfirm(product):
        1. productService.deleteProduct(product._id)  ← DELETE /api/products/:id
        2. Backend: findOneAndDelete (hard delete from MongoDB)
        3. Backend emits: io.to(shopId).emit('product:deleted', { productId })
        4. Frontend: Optimistically removes from React Query cache
           - Removes from products[]
           - Decrements total, totalAll
           - Updates categories count
           - Updates stockStatus (inStock/lowStock/outOfStock)
        5. Toast: "Product Deleted — 'Nike Slides' has been permanently deleted."
```

### Optimistic Cache Update

```javascript
queryClient.setQueryData(['inventory'], (old) => {
  if (!old) return old;
  return {
    ...old,
    products: old.products.filter(p => p._id !== product._id),
    total: Math.max(0, old.total - 1),
    totalAll: Math.max(0, old.totalAll - 1),
    categories: old.categories.map(c =>
      c.name === product.category
        ? { ...c, count: Math.max(0, c.count - 1) }
        : c
    ),
    stockStatus: {
      ...old.stockStatus,
      inStock: productStatus === 'in_stock'
        ? Math.max(0, old.stockStatus.inStock - 1)
        : old.stockStatus.inStock,
      // ... same for lowStock, outOfStock
    },
  };
});
```

---

## Restock Flow

```
User clicks restock icon on product card
  → RestockModal opens
    → Shows: product name, current stock, current prices
    → Form: Quantity to add, New Cost Price (optional), New Selling Price (optional)
    → "Cancel" / "Restock" buttons
      → handleRestockConfirm:
        1. productService.restockProduct(id, { quantity, newCostPrice, newSellingPrice })
        2. Backend: POST /api/products/:id/restock
           - stock += quantity
           - Updates costPrice / price if provided
           - Creates StockHistory record
           - Creates PriceHistory record if prices changed
           - Emits: stock:updated + product:updated
        3. Toast: "Stock Updated — 5 units added to Nike Slides. New stock: 25 units"
```

---

## CSV Import/Export

### Import

1. Click "Add Product" → "Import via CSV"
2. `CsvUploadModal` opens with drag-and-drop zone
3. Accepts `.csv` files, parses with `FileReader`
4. Validates: product name, category, selling price required
5. Preview table shows first 5 rows with validation status
6. Business-type-aware: columns adapt based on shop's business type
7. Submits: `POST /api/products/import` with `{ products: [...] }`
8. Response: `{ imported: 42, skipped: 3, total: 45, validationErrors: [...] }`

### Template Download

`GET /api/products/template?businessType=clothing`

Returns a CSV file with headers tailored to the business type:
- **Clothing**: name, category, buyingPrice, sellingPrice, quantity, size, color, material, brand
- **Pharmacy**: name, category, buyingPrice, sellingPrice, quantity, strength, form, expiryDate, brand, prescriptionRequired, batchNumber
- **Electronics**: name, category, buyingPrice, sellingPrice, quantity, brand, model, condition, warranty
- **Grocery**: name, category, buyingPrice, sellingPrice, quantity, weight, brand, expiryDate, organic
- **Cosmetics**: name, category, buyingPrice, sellingPrice, quantity, shade, skinType, expiryDate, brand
- **Hardware**: name, category, buyingPrice, sellingPrice, quantity, material, size, unit, brand

Includes UTF-8 BOM for Excel compatibility.

---

## Toast Notifications

| Type | Icon | Style | Content |
|------|------|-------|---------|
| **Success (Delete)** | CheckCircle (green) | Green left border | "Product Deleted — 'name' has been permanently deleted" |
| **Success (Restock)** | CheckCircle (green) | Green left border | "Stock Updated — 5 units added to name. New stock: 25 units" |
| **Error** | AlertCircle (red) | Red left border | "Failed to delete product — error message" |

Position: fixed, top-right on desktop, bottom-center on mobile. Auto-dismisses after 3s. Manual dismiss via X button.

---

## Socket.IO Real-Time Updates

### Configuration

```javascript
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 30000,
  reconnectionAttempts: 5,
  timeout: 10000,
});
```

### Events

| Event | Action |
|-------|--------|
| `product:created` | `invalidateQueries(['inventory'])` + `invalidateQueries(['dashboard'])` |
| `product:updated` | `invalidateQueries(['inventory'])` + `invalidateQueries(['dashboard'])` |
| `product:deleted` | `invalidateQueries(['inventory'])` + `invalidateQueries(['dashboard'])` |
| `stock:updated` | `invalidateQueries(['inventory'])` + `invalidateQueries(['dashboard'])` |
| `sale:completed` | `invalidateQueries(['inventory'])` + `invalidateQueries(['dashboard'])` |

### Graceful Failure

- `connect_error` → `console.warn`, inventory still works via HTTP
- `reconnect_failed` → `console.warn`, 60s polling takes over

---

## API Routes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `GET` | `/api/products` | List products with filters, categories, stock status | Clerk |
| `GET` | `/api/products/stats` | Inventory statistics (totals, values, costs) | Clerk |
| `GET` | `/api/products/filters` | Dynamic filter values (sizes, colors, brands) | Clerk |
| `GET` | `/api/products/template` | Download CSV template (per business type) | Clerk |
| `POST` | `/api/products` | Create product | Clerk |
| `POST` | `/api/products/import` | Bulk CSV import | Clerk |
| `GET` | `/api/products/:id` | Get single product | Clerk |
| `PUT` | `/api/products/:id` | Update product (tracks price history) | Clerk |
| `DELETE` | `/api/products/:id` | Hard delete product | Clerk |
| `PATCH` | `/api/products/:id/stock` | Manual stock adjustment | Clerk |
| `POST` | `/api/products/:id/restock` | Restock + optional price update | Clerk |
| `GET` | `/api/products/:id/price-history` | Price history (last 50) | Clerk |
| `GET` | `/api/products/:id/stock-history` | Stock history (last 50) | Clerk |
| `POST` | `/api/products/:id/image` | Upload product image URL | Clerk |

### Query Parameters for `GET /api/products`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search name, SKU, description (case-insensitive) |
| `category` | string | Filter by category name |
| `stockStatus` | enum | `in_stock`, `low_stock`, `out_of_stock` |
| `sortBy` | enum | `createdAt`, `name`, `price`, `stock` |
| `sortOrder` | enum | `asc`, `desc` |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, `0` = all) |
| `size` | string | Filter by product attribute |
| `color` | string | Filter by product attribute |
| `brand` | string | Filter by product attribute |

---

## Product Model

### Core Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `shop` | ObjectId (ref: Shop) | ✅ | Multi-tenant isolation |
| `name` | String | ✅ | Trimmed |
| `description` | String | ❌ | |
| `category` | String | ✅ | Matches shop's configured categories |
| `price` | Number (min: 0) | ✅ | Selling price |
| `costPrice` | Number (min: 0) | ❌ | Purchase/cost price |
| `stock` | Number (min: 0) | ✅ | Default: 0 |
| `lowStockThreshold` | Number | ❌ | Default: 10 |
| `image` | String | ❌ | Single image URL |
| `images` | [String] | ❌ | Multiple image URLs |
| `sku` | String (unique, sparse) | ❌ | Stock Keeping Unit |
| `barcode` | String | ❌ | Barcode number |
| `supplier` | String | ❌ | |
| `notes` | String | ❌ | |
| `isActive` | Boolean | ❌ | Default: true (soft-delete flag, currently unused — hard deletes instead) |

### Variants

```javascript
variants: [{
  name: String,           // e.g., "32GB"
  sku: String,
  quantity: Number,       // default: 0
  buyingPrice: Number,
  sellingPrice: Number,
  attributes: Mixed,      // variant-specific attrs
}]
```

### Batches

```javascript
batches: [{
  batchNumber: String,
  receivedDate: Date,
  initialQuantity: Number,
  remainingQuantity: Number,
  expiryDate: Date,
  status: String,         // 'active' | 'expired' | 'depleted'
}]
```

### Business-Type Attributes

| Business Type | Attributes |
|---------------|-----------|
| **Clothing** | size, color, material, brand |
| **Pharmacy** | form, strength, prescriptionRequired, expiryDate, batchNumber |
| **Electronics** | condition, warranty, model |
| **Hardware** | unit, specifications, material, size, brand |
| **Grocery** | weight, organic, expiryDate, brand |
| **Cosmetics** | shade, skinType, expiryDate, brand |

### Indexes

```javascript
productSchema.index({ shop: 1, category: 1 });  // Fast category filtering
productSchema.index({ shop: 1, name: 'text' });  // Text search
```

---

## Stock Status Computation

Stock status is computed per product (NOT stored in DB):

```javascript
const threshold = shop?.settings?.lowStockThreshold || 10;

const status = stock <= 0
  ? 'out_of_stock'
  : stock <= threshold
    ? 'low_stock'
    : 'in_stock';
```

---

## Pagination

| Viewport | Pagination Style |
|----------|-----------------|
| **Desktop (≥640px)** | Numbered pages (1-7), Previous/Next buttons |
| **Mobile (<640px)** | "Load More Products" button |

```
Desktop:
  Showing 1–20 of 87 products    [Prev] [1] [2] [3] [4] [5] [Next]

Mobile:
  [Load More Products]           (becomes "Showing all 87 products" when done)
```

20 items per page, client-side slice from sorted/filtered array.

---

## Analytics & Statistics

`GET /api/products/stats` returns:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProducts": 87,
      "totalStock": 1420,
      "totalValue": 245600,
      "totalCost": 168900,
      "inStock": 72,
      "lowStock": 12,
      "outOfStock": 3
    },
    "categories": [
      { "_id": "Clothing", "count": 42 },
      { "_id": "Electronics", "count": 25 }
    ]
  }
}
```

- `totalValue` = Σ(price × stock) — potential revenue
- `totalCost` = Σ(costPrice × stock) — capital invested

---

## Price & Stock History

### Price History

Every time `costPrice` or `price` changes (via update or restock), a `PriceHistory` record is created:

```javascript
{
  product: ObjectId,
  shop: ObjectId,
  field: 'costPrice' | 'price' | 'both',
  oldCostPrice: Number,
  newCostPrice: Number,
  oldSellingPrice: Number,
  newSellingPrice: Number,
  reason: 'Manual update' | 'Restock price update',
  changedBy: ObjectId (ref: User),
  createdAt: Date,
}
```

### Stock History

Every stock change (add, subtract, restock, adjust) creates a `StockHistory` record:

```javascript
{
  product: ObjectId,
  shop: ObjectId,
  type: 'added' | 'sold' | 'adjusted' | 'restock',
  quantity: Number (+/-),
  previousStock: Number,
  newStock: Number,
  reference: String,
  notes: String,
  performedBy: ObjectId (ref: User),
  createdAt: Date,
}
```

---

## Responsive Design

### Desktop (≥1024px)
- Product grid: 4 columns
- Filter bar: full width with dropdown selects
- Pagination: numbered pages + prev/next
- Add Product: dropdown button in header

### Tablet (640–1023px)
- Product grid: 3 columns
- Filter bar: compact with overflow scroll
- Pagination: numbered pages

### Mobile (<640px)
- Product grid: 2 columns
- Filter bar: horizontal scroll for pills
- "Load More" instead of numbered pages
- Add Product: FAB (floating action button, bottom-right, 48×48px)
- Bottom nav bar occupies bottom 56px

---

## Component Reference

### ProductCard

```
┌─────────────────────────┐
│ [Product Image]         │
│                         │
│ ┌───────────┐           │
│ │ Category  │           │
│ └───────────┘           │
│ Product Name            │
│ Margin: 40%            │
│                         │
│ Cost: KSh 1,200        │
│ Price: KSh 2,000       │
│                         │
│ Stock: 15 units         │
│ ┌──────────────┐        │
│ │ ● In Stock   │        │
│ └──────────────┘        │
│                         │
│ [✏️] [📦] [📋] [🗑️]    │  ← Role-based action buttons
└─────────────────────────┘
```

### CategoryPills

Horizontally scrollable pill bar:
```
[All (87)] [Clothing (42)] [Electronics (25)] [Pharmacy (12)] [Grocery (8)] →
```

- Active pill: `bg-[#312E81] text-white`
- Inactive pills: `bg-white text-[#64748B] border-[#CBD5E1]`
- Hover: `border-[#312E81] bg-[#EEF2FF]`

### RestockModal

```
┌──────────────────────────────────┐
│ Restock Product              [✕] │
│ ──────────────────────────────── │
│ Current Stock: 5 units           │
│                                  │
│ Quantity to Add: [____]          │
│ New Cost Price:  [____] (opt)    │
│ New Selling Price: [____] (opt)  │
│                                  │
│ [Cancel]        [Restock (+X)]   │
└──────────────────────────────────┘
```

### DeleteConfirmModal

```
┌──────────────────────────────────┐
│ Delete Product               [✕] │
│ ──────────────────────────────── │
│ ⚠️ Are you sure?                 │
│ This action cannot be undone.     │
│                                  │
│ Product: "Nike Slides"           │
│                                  │
│ [Cancel]    [Delete Permanently] │
└──────────────────────────────────┘
```

---

**Last Updated:** June 10, 2026  
**Status:** ✅ Production-Ready
