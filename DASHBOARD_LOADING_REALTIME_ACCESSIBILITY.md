# DUKAFLOW DASHBOARD — SYSTEM DOCUMENTATION

## Status: ✅ Production-Ready

Full dashboard with React Query data fetching (skeleton → empty → data → error states), Socket.io real-time updates, Clerk authentication, role-based data visibility (Admin/Manager/Cashier), and responsive breakpoints for mobile/tablet/desktop.

---

## Architecture

### Three Update Strategies

| Strategy | Trigger | Mechanism |
|----------|---------|-----------|
| **Initial Fetch** | Page mount | `useDashboardQuery` → `GET /api/dashboard` |
| **Auto-Refresh** | Every 60s | React Query `refetchInterval: 60_000` |
| **Real-Time Push** | Backend events | Socket.io invalidates query cache |

### Data Flow

```
Clerk Auth (getToken)
    ↓
useDashboardQuery (React Query)
    ↓
GET /api/dashboard  →  dashboardController.js  →  MongoDB aggregations
    ↓                                                   ↓
Four states:                                    Returns: hasData, stats,
  loading → skeleton                             chartData, transactions,
  hasData: false → empty welcome                 alerts, workerPerformance
  hasData: true → full dashboard
  network error → error UI + retry
    ↑
Socket.io (useSocket hook)
  Invalidates query cache on:
  sale:completed | stock:updated | worker:login | alert:new
  product:created | product:updated | product:deleted
```

---

## Files

| File | Purpose |
|------|---------|
| `frontend/src/pages/DashboardOverview.jsx` | Main dashboard component — 4 states, chart, transactions, alerts, workers, FAB |
| `frontend/src/hooks/useDashboardQuery.js` | React Query hook → fetches + transforms + caches dashboard data |
| `frontend/src/hooks/useDashboard.js` | Legacy hook (useState-based) — kept for backwards compat, `useDashboardQuery` preferred |
| `frontend/src/hooks/useSocket.js` | Socket.io hook → shop-scoped room join, event → query invalidation |
| `frontend/src/components/Skeleton.jsx` | `DashboardSkeleton` — animated pulse placeholders |
| `frontend/src/components/common/ErrorState.jsx` | Shared error UI with retry button |
| `backend/controllers/dashboardController.js` | MongoDB aggregation: stats, chart, transactions, alerts, workers |
| `backend/routes/dashboard.js` | `GET /api/dashboard` route with `clerkAuth` middleware |
| `backend/middleware/clerkAuth.js` | Clerk JWT verification → attaches `req.user` with `shop` & `role` |
| `frontend/src/services/api.js` | Axios instance with Clerk token interceptor |
| `frontend/src/utils/formatters.js` | `formatCurrency()` → KSh formatting |

---

## Dashboard States

### State 1: Loading (Skeleton)

```jsx
if (isLoading) {
  return <DashboardSkeleton />;
}
```

`DashboardSkeleton` renders:
- 4 stat card skeletons (label + value + trend placeholders)
- Chart area skeleton (`h-64`, `rounded-xl`)
- 5 transaction row skeletons
- 3 alert item skeletons
- 4 worker card skeletons
- All with `animate-pulse` CSS animation

### State 2: Empty (`hasData === false`)

Shown when shop has no active products (`totalProducts === 0`):
- Welcome banner: "Welcome to Your Dashboard, {firstName}!"
- Package icon (64px, neutral-300), centered welcome message
- 4 zero stat cards: KSh 0 (neutral-400), "All good ✓" (green), "1 online ● You"
- Empty chart placeholder with BarChart3 icon
- Quick-start guide cards (Add Product + Invite Workers for Admin)

### State 3: Data (`hasData === true`)

Full dashboard with real data:
- 4 stat cards with 22px values, 11px labels, trend badges (↑/↓/—)
- ComposedChart (Bar + Line): sales bars (#312E81, opacity 0.8) + profit line (#E8835C, strokeWidth 3)
- Time tabs: 7D | 30D | 3M
- Recent transactions with payment icons (Cash/M-Pesa/Card)
- Alerts feed with "Mark All Read"
- Worker performance cards with progress bars (hidden for Cashiers)
- FAB: 48×48px, rounded-[14px], ShoppingCart icon

### State 4: Error (Network Failure)

Shown when `fetch()` throws (offline, DNS, connection refused):
- `ErrorState` component: AlertCircle icon + "Unable to load dashboard data"
- "Please check your connection and try again"
- "Try Again" button → calls `refetch()`
- **NEVER** shows raw "Failed to fetch" or "Failed to load"

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

### Events That Trigger Dashboard Refresh

| Event | Action |
|-------|--------|
| `sale:completed` | `invalidate()` → refetches dashboard |
| `stock:updated` | `invalidate()` → refetches dashboard |
| `worker:login` | `invalidate()` → refetches dashboard |
| `worker:logout` | `invalidate()` → refetches dashboard |
| `alert:new` | `invalidate()` → refetches dashboard |
| `product:created` | `invalidate()` → refetches dashboard |
| `product:updated` | `invalidate()` → refetches dashboard |
| `product:deleted` | `invalidate()` → refetches dashboard |

### Graceful Failure

- `connect_error` → `console.warn`, dashboard still works via HTTP polling
- `reconnect_failed` → `console.warn`, dashboard falls back to `refetchInterval` (60s)

---

## Role-Based Visibility

| Data | Admin | Manager | Cashier |
|------|-------|---------|---------|
| Sales stats | ✅ Full | ✅ Full | ✅ Own sales only |
| Profit stats | ✅ Full | ✅ Hidden ("—") | ❌ Hidden (KSh 0) |
| Profit trend | ✅ Full | ❌ Hidden (null) | ❌ Hidden |
| Low stock alerts | ✅ Full | ✅ Full | ✅ Full |
| Worker performance | ✅ Full | ✅ Full | ❌ Hidden (no section) |
| Worker invite card (empty state) | ✅ | ❌ | ❌ |
| FAB: Quick Sale | ✅ | ✅ | ✅ |
| FAB: Add Product | ✅ | ✅ | ❌ |
| FAB: Add Worker | ✅ | ❌ | ❌ |

Implementation in `dashboardController.js`:
- Cashier filter: `{ soldBy: req.user._id }` added to all aggregations
- Profit for cashiers returned as `0`, trend as `null`

---

## API Contract

### GET /api/dashboard

**Headers:** `Authorization: Bearer <clerk_token>`

**Query Params:** `?date=YYYY-MM-DD` (optional, defaults to today)

**Success Response (hasData: true):**

```json
{
  "success": true,
  "data": {
    "shopId": "6621a...",
    "shopName": "My Shop",
    "hasData": true,
    "todaySales": 24850,
    "todaySalesTrend": 12,
    "todayProfit": 8420,
    "todayProfitTrend": 18,
    "lowStockCount": 7,
    "activeWorkers": 3,
    "onlineWorkers": 2,
    "chartData": [
      { "_id": { "date": "2026-06-08", "day": "2026-06-08" }, "sales": 18500, "profit": 6200 }
    ],
    "recentTransactions": [
      {
        "_id": "...",
        "time": "14:30",
        "productName": "Nike Slides",
        "variant": "",
        "quantity": 2,
        "amount": 3200,
        "paymentMethod": "mpesa",
        "worker": { "name": "John", "avatar": null }
      }
    ],
    "alerts": [
      {
        "_id": "...",
        "type": "low_stock",
        "icon": "⚠️",
        "title": "Low Stock Alert",
        "message": "Nike Slides running low",
        "time": "2h ago",
        "action": { "label": "View", "link": "/dashboard/inventory" }
      }
    ],
    "workerPerformance": [
      {
        "_id": "...",
        "name": "John",
        "avatar": null,
        "status": "offline",
        "salesCount": 12,
        "salesValue": 14200,
        "percentageOfTop": 100
      }
    ],
    "lastUpdated": "2026-06-10T12:00:00.000Z",
    "date": "2026-06-10"
  }
}
```

**Empty Response (hasData: false):**

```json
{
  "success": true,
  "data": {
    "shopId": "6621a...",
    "shopName": "My Shop",
    "hasData": false,
    "todaySales": 0,
    "todaySalesTrend": null,
    "todayProfit": 0,
    "todayProfitTrend": null,
    "lowStockCount": 0,
    "activeWorkers": 0,
    "onlineWorkers": 0,
    "chartData": [],
    "recentTransactions": [],
    "alerts": [],
    "workerPerformance": [],
    "lastUpdated": "2026-06-10T12:00:00.000Z",
    "date": "2026-06-10"
  }
}
```

---

## Backend: MongoDB Aggregation Pipeline

The `dashboardController.js` executes **9 parallel queries** via `Promise.all`:

| # | Query | Description |
|---|-------|-------------|
| 1 | Sales today | `$match` by shop + date range, `$group` sum of `total` |
| 2 | Sales yesterday | Same as #1 for yesterday (trend baseline) |
| 3 | Profit today | `$group` sum of `totalProfit` |
| 4 | Expenses today | `$group` sum of `amount` from Expense collection |
| 5 | Low stock count | `countDocuments` where `stock <= lowStockThreshold` and `stock > 0` |
| 6 | Active workers | `countDocuments` where `isActive: true` |
| 7 | Online workers | `countDocuments` with `activeSessions.lastActive >= now - 5min` |
| 8 | Recent transactions | `find` last 5, populate `soldBy` + `items.product` |
| 9 | Alerts | `find` unread notifications, limit 10 |
| 10 | Worker performance | `$group` by `soldBy`, sorted by `salesValue` desc |
| 11 | Chart data (7 days) | `$group` by date, `$dateToString` format `%Y-%m-%d` |

### Net Profit Calculation

```
netProfit = max(0, grossProfit - totalExpenses)
```

Growth trend: `trend = round(((today - yesterday) / yesterday) * 100)`

---

## Frontend: Data Transformation

### Chart Day Name Derivation

MongoDB's `$dateToString` does not support `%a` (abbreviated weekday). Instead, the backend returns `%Y-%m-%d` date strings. The frontend derives day names:

```javascript
const dayName = new Date(dateStr + 'T00:00:00')
  .toLocaleDateString('en-US', { weekday: 'short' });
// "2026-06-08" → "Mon"
```

### `hasData` Computation

```javascript
const computeHasData = (data) => {
  if (data.hasProducts === true) return true;
  if (data.totalProducts > 0) return true;
  return (
    data.todaySales > 0 ||
    data.recentTransactions?.length > 0 ||
    data.chartData?.length > 0 ||
    data.lowStockCount > 0 ||
    data.activeWorkers > 0
  );
};
```

---

## Responsive Layout

### Desktop (≥1024px)

| Element | Layout | Spacing |
|---------|--------|---------|
| Content wrapper | max-w-[1400px], mx-auto | px-6 |
| Stat cards | grid-cols-4 | gap-4 |
| Chart section | Full width | p-6 |
| Transactions + Alerts | grid-cols-3 (2:1 split) | gap-6 |
| Worker cards | Horizontal scroll | gap-3 |
| FAB | fixed, bottom-6, right-6 | — |

### Tablet (640–1023px)

| Element | Layout | Spacing |
|---------|--------|---------|
| Content wrapper | Full width | px-4 |
| Stat cards | grid-cols-2 | gap-4 |
| Transactions + Alerts | Stacked | gap-4 |
| Worker cards | grid-cols-2 | gap-3 |

### Mobile (<640px)

| Element | Layout | Spacing |
|---------|--------|---------|
| Content wrapper | Full width | px-4 |
| Stat cards | grid-cols-2 | gap-3 |
| Everything else | Stacked | gap-4 |
| FAB | fixed, bottom-20, right-4 | — |
| Bottom nav | Fixed bottom bar | — |

---

## Accessibility

### Heading Hierarchy

```
h1 (sr-only) — "Dashboard"
  h2 — "Dashboard Overview"
    h2 — "Last 7 Days Performance"
    h2 — "Recent Transactions"
    h2 — "Alerts & Warnings"
    h2 — "Worker Performance Today"
```

### Color Accessibility

✅ Color is NEVER the only indicator:
- Trend badges: Icon + text + color (e.g., ↑ + "12%" + green)
- Stock status: Icon color changes (orange/green) + text ("Need restock" / "All good ✓")
- Worker status: Green/grey dot + text ("Online" / "Offline")
- Alert types: Emoji icon + label + color
- Profit card: Special gradient background (only shown to Admin)

### Focus Order

1. Sidebar navigation
2. Top bar (search, notifications, user menu)
3. Stat cards (clickable: Low Stock → Inventory filter)
4. Chart controls (7D/30D/3M tabs)
5. Transaction rows (clickable)
6. Alert action buttons ("Restock", "Discount", "View")
7. FAB button
8. Mobile bottom nav

---

## Error Handling Strategy

| Failure Type | Behavior |
|-------------|----------|
| No Clerk token | Return `EMPTY_DASHBOARD` (Clerk handles redirect) |
| Network error (fetch throws) | Throw `'Unable to load dashboard data'` → ErrorState UI with retry |
| HTTP 4xx/5xx (backend error) | Return `EMPTY_DASHBOARD` gracefully (no crash) |
| Backend 400 (no shop found) | Return `EMPTY_DASHBOARD` (user may need onboarding) |
| Backend 500 (DB error) | Return `EMPTY_DASHBOARD`, backend logs full stack trace |
| Socket connect_error | `console.warn`, dashboard works via HTTP |
| Socket reconnect_failed | `console.warn`, 60s polling takes over |

---

## Refresh Intervals

| Trigger | Interval |
|---------|----------|
| React Query `refetchInterval` | 60 seconds |
| Socket.io (`sale:completed`) | Instant |
| Socket.io (`stock:updated`) | Instant |
| Socket.io (`worker:login`) | Instant |
| Socket.io (`alert:new`) | Instant |
| Socket.io (`product:created/updated/deleted`) | Instant |
| Window focus refetch | Instant (on tab return) |

---

## Micro-Interactions

| Element | Hover Effect |
|---------|-------------|
| Stat cards | `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` |
| Transaction rows | `hover:bg-neutral-50 transition-colors duration-200` |
| Alert rows | `hover:bg-neutral-50 transition-colors duration-200` |
| Worker cards | `hover:shadow-md transition-all duration-200` |
| FAB | `hover:scale-105 transition-transform duration-200` |
| Time tabs | `hover:text-neutral-900 transition-colors duration-150` |
| Chart bars | `hover:opacity-80 transition-opacity duration-150` |
| Low Stock card | Clickable → navigates to inventory with `?filter=low-stock` |

---

**Last Updated:** June 10, 2026
**Status:** ✅ Production-Ready
