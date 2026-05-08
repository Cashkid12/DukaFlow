# ✅ DUKAFLOW DASHBOARD - IMPLEMENTATION SPEC

## 📊 Status: COMPLETE

Full dashboard with React Query data fetching (skeleton → empty → data → error states), Socket.io real-time updates, Clerk authentication, and responsive breakpoints for mobile/tablet/desktop.

---

## 🏗️ ARCHITECTURE

### Three Update Strategies

| Strategy | Trigger | Mechanism |
|----------|---------|-----------|
| **Initial Fetch** | Page load | `useDashboardQuery` → `GET /api/dashboard` |
| **Auto-Refresh** | Every 60s (stale) | React Query `staleTime: 60_000` |
| **Real-Time Push** | Backend events | `useDashboardSocket` invalidates query cache on Socket.io events |

### Data Flow

```
Clerk Auth (getToken)
    ↓
useDashboardQuery (React Query)
    ↓
GET /api/dashboard  →  dashboardController.js  →  MongoDB aggregations
    ↓                                                   ↓
Three states:                                    Returns: hasData, stats,
  loading → skeleton                              chartData, transactions,
  hasData: false → empty welcome                  alerts, workerPerformance
  hasData: true → full dashboard
  network error → error UI + retry
    ↑
useDashboardSocket (Socket.io)
  invalidates query cache on:
  sale:completed | stock:updated | worker:login | alert:new
```

---

## 📁 FILES (Current Implementation)

| File | Purpose |
|------|---------|
| `frontend/src/pages/DashboardOverview.jsx` | Main dashboard component with all 4 states |
| `frontend/src/hooks/useDashboardQuery.js` | React Query hook → fetches + transforms data |
| `frontend/src/hooks/useDashboardSocket.js` | Socket.io hook → invalidates query on real-time events |
| `frontend/src/components/Skeleton.jsx` | `DashboardSkeleton` + individual skeleton components |
| `backend/controllers/dashboardController.js` | MongoDB aggregation: stats, chart, transactions, alerts, workers |
| `backend/routes/dashboard.js` | `GET /api/dashboard` route with `clerkAuth` middleware |
| `backend/middleware/clerkAuth.js` | Clerk JWT verification → attaches `req.user.shop` |
| `frontend/src/services/api.js` | Axios instance with Clerk token interceptor |
| `frontend/src/utils/formatters.js` | `formatCurrency()` → KSh formatting |

---

## 🔄 DASHBOARD STATES

### State 1: Loading (Skeleton)

```jsx
if (isLoading) {
  return <DashboardSkeleton />;
}
```

`DashboardSkeleton` renders:
- 4 stat card skeletons (label + value + trend placeholders)
- Chart area skeleton (h-64, rounded-xl)
- 5 transaction row skeletons
- 3 alert item skeletons
- 4 worker card skeletons
- All with `animate-pulse` CSS animation

### State 2: Empty (hasData === false)

Shown when shop has no products/sales yet:
- Welcome banner: "Welcome to Your Dashboard, {firstName}!"
- Package icon (64px, neutral-300), centered welcome message
- 4 zero stat cards: KSh 0 (neutral-400), "All good ✓" (green), "1 online ● You"
- Empty chart placeholder with BarChart3 icon
- Quick start guide card

### State 3: Data (hasData === true)

Full dashboard with real data:
- 4 stat cards with 28px values, 13px labels, trend badges (↑/↓/—)
- ComposedChart (Bar + Line): sales bars (#312E81, opacity 0.8) + profit line (#E8835C, strokeWidth 3)
- Time tabs: 7D | 30D | 3M
- Recent transactions with payment icons (Cash/M-Pesa/Card)
- Alerts feed with "Mark All Read"
- Worker performance cards with progress bars
- FAB: 48×48px, rounded-[14px], ShoppingCart icon

### State 4: Error (Network Failure)

Shown when `fetch()` throws (offline, DNS, connection refused):
- AlertCircle icon (48px, neutral-300)
- "Unable to load dashboard data"
- "Please check your connection and try again"
- "Try Again" button → calls `refetch()`
- **NEVER** shows raw "Failed to fetch" or "Failed to load"

```jsx
if (isError) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <AlertCircle size={48} className="text-neutral-300 mb-4" />
      <h2 className="text-lg font-semibold text-neutral-900 mb-1">
        Unable to load dashboard data
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Please check your connection and try again
      </p>
      <Button onClick={() => refetch()}>Try Again</Button>
    </div>
  );
}
```

---

## 🔌 SOCKET.IO REAL-TIME UPDATES

**File:** `frontend/src/hooks/useDashboardSocket.js`

### Events

| Event | Direction | Action |
|-------|-----------|--------|
| `sale:completed` | Server → Client | `queryClient.invalidateQueries(['dashboard'])` |
| `stock:updated` | Server → Client | `queryClient.invalidateQueries(['dashboard'])` |
| `worker:login` | Server → Client | `queryClient.invalidateQueries(['dashboard'])` |
| `alert:new` | Server → Client | `queryClient.invalidateQueries(['dashboard'])` |

### Socket Configuration

```javascript
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Join shop room
socket.emit('join_shop', shopId);
```

### Backend Socket Events

**File:** `backend/sockets/index.js` + `backend/index.js`

```javascript
io.on('connection', (socket) => {
  socket.on('join_shop', (shopId) => {
    socket.join(shopId);
  });

  // Controllers emit events via req.app.get('io'):
  // io.to(shopId).emit('sale:completed', data);
  // io.to(shopId).emit('stock:updated', data);
  // io.to(shopId).emit('worker:login', data);
  // io.to(shopId).emit('alert:new', data);
});
```

---

## 📐 RESPONSIVE LAYOUT

### Desktop (≥1024px)

| Element | Layout | Spacing |
|---------|--------|---------|
| Content wrapper | max-w-[1400px], mx-auto | px-6 |
| Stat cards | grid-cols-4 | gap-4 |
| Chart section | Full width | p-6 |
| Transactions + Alerts | grid-cols-2 | gap-6 |
| Worker cards | grid-cols-4 | gap-4 |
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

## ♿ ACCESSIBILITY

### Heading Hierarchy

```
h1 (sr-only) - "Dashboard"
  h2 - "Dashboard Overview"
    h2 - "Last 7 Days Performance"
    h2 - "Recent Transactions"
    h2 - "Alerts & Warnings"
    h2 - "Worker Performance Today"
```

### Color Accessibility

✅ Color is NEVER the only indicator:
- Trend badges: Icon + text + color (e.g., ↑ + "12%" + green)
- Stock status: Icon color changes (orange/green) + text ("Need restock" / "All stocked ✓")
- Worker status: Green/grey dot + text ("Online" / "Offline")
- Alert types: Emoji icon + label + color

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

## ✨ MICRO-INTERACTIONS

| Element | Hover Effect |
|---------|-------------|
| Stat cards | `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` |
| Transaction rows | `hover:bg-neutral-50 transition-colors duration-200` |
| Alert rows | `hover:bg-neutral-50 transition-colors duration-200` |
| Worker cards | `hover:shadow-md transition-all duration-200` |
| FAB | `hover:scale-105 transition-transform duration-200` |
| Time tabs | `hover:text-neutral-900 transition-colors duration-150` |
| Chart bars | `hover:opacity-80 transition-opacity duration-150` |

---

## 🎯 API CONTRACT

### GET /api/dashboard

**Headers:** `Authorization: Bearer <clerk_token>`

**Response:**

```json
{
  "success": true,
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
    { "day": "Mon", "sales": 18500, "profit": 6200 }
  ],
  "recentTransactions": [
    {
      "_id": "...",
      "time": "14:30",
      "product": "Nike Slides",
      "quantity": 2,
      "total": 3200,
      "paymentMethod": "mpesa",
      "workerName": "John"
    }
  ],
  "alerts": [
    {
      "_id": "...",
      "type": "low_stock",
      "message": "Nike Slides running low",
      "details": "Only 2 left",
      "timeAgo": "2 hours ago"
    }
  ],
  "workerPerformance": [
    {
      "_id": "...",
      "name": "John",
      "salesCount": 12,
      "salesTotal": 14200
    }
  ],
  "date": "2026-04-17"
}
```

**Empty response (hasData: false):**
```json
{
  "success": true,
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
  "date": "2026-04-17"
}
```

---

## 📚 Error Handling Strategy

| Failure Type | Behavior |
|-------------|----------|
| No Clerk token | Return EMPTY_DASHBOARD (Clerk handles redirect) |
| Network error (fetch throws) | Throw `'Unable to load dashboard data'` → error UI with retry |
| HTTP 4xx/5xx (backend error) | Return EMPTY_DASHBOARD gracefully (no crash) |
| Backend 400 (no shop found) | Return EMPTY_DASHBOARD (user may need onboarding) |

---

## 🚀 Refresh Intervals

| Trigger | Interval |
|---------|----------|
| React Query stale time | 60 seconds |
| Socket.io (sale:completed) | Instant |
| Socket.io (stock:updated) | Instant |
| Socket.io (worker:login) | Instant |
| Socket.io (alert:new) | Instant |
| Auto-refetch on window focus | Enabled |

---

## 🎉 Summary

**Dashboard is production-ready with:**
- ✅ 4 distinct UI states (skeleton → empty → data → error)
- ✅ React Query fetching with 60s stale time
- ✅ Socket.io real-time updates (invalidates query cache)
- ✅ Clerk authentication (token → backend → shop context)
- ✅ MongoDB aggregation pipeline for performance
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessible (ARIA, keyboard, color contrast)
- ✅ Micro-interactions (hover, transitions, focus styles)
- ✅ Error handling with retry (never shows raw errors)

---

**Last Updated:** April 17, 2026
**Status:** ✅ Complete
