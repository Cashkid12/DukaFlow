const { emitToShop } = require('../sockets');

/**
 * Emit dashboard update event to all clients in a shop
 * Called after significant data changes
 */

// Emit when a sale is completed
exports.emitSaleCompleted = (shopId, saleData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'sale',
    timestamp: new Date().toISOString(),
    data: {
      saleId: saleData._id,
      amount: saleData.total,
      profit: saleData.totalProfit,
      workerId: saleData.soldBy,
    },
  });
};

// Emit when stock is updated
exports.emitStockUpdated = (shopId, productData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'stock',
    timestamp: new Date().toISOString(),
    data: {
      productId: productData._id,
      stock: productData.stock,
      lowStockThreshold: productData.lowStockThreshold,
    },
  });
};

// Emit when a worker logs in
exports.emitWorkerLogin = (shopId, workerData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'worker:login',
    timestamp: new Date().toISOString(),
    data: {
      workerId: workerData._id,
      workerName: workerData.fullName,
    },
  });
};

// Emit when a worker logs out
exports.emitWorkerLogout = (shopId, workerData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'worker:logout',
    timestamp: new Date().toISOString(),
    data: {
      workerId: workerData._id,
      workerName: workerData.fullName,
    },
  });
};

// Emit when an expense is added
exports.emitExpenseAdded = (shopId, expenseData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'expense',
    timestamp: new Date().toISOString(),
    data: {
      expenseId: expenseData._id,
      amount: expenseData.amount,
      category: expenseData.category,
    },
  });
};

// Emit when a new alert/notification is created
exports.emitNewAlert = (shopId, notificationData) => {
  emitToShop(shopId, 'dashboard:update', {
    type: 'alert',
    timestamp: new Date().toISOString(),
    data: {
      notificationId: notificationData._id,
      type: notificationData.type,
      message: notificationData.message,
    },
  });
};

// Emit full dashboard refresh (for major changes)
exports.emitFullRefresh = (shopId) => {
  emitToShop(shopId, 'dashboard:refresh', {
    type: 'full',
    timestamp: new Date().toISOString(),
  });
};
