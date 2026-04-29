const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');

// Low Stock Check - Every 2 hours
const scheduleLowStockCheck = () => {
  cron.schedule('0 */2 * * *', async () => {
    console.log('⚠️  Running Low Stock Check Job...');
    
    try {
      const products = await Product.find({
        stock: { $lte: '$lowStockThreshold' },
        isActive: true
      }).populate('shop');

      for (const product of products) {
        // Check if notification already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingNotification = await Notification.findOne({
          shop: product.shop._id,
          type: 'low_stock',
          metadata: { productId: product._id.toString() },
          createdAt: { $gte: today }
        });

        if (!existingNotification) {
          // Create notification for shop owner
          await Notification.create({
            shop: product.shop._id,
            user: product.shop.owner,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${product.name} is running low: ${product.stock} units remaining (threshold: ${product.lowStockThreshold})`,
            link: `/dashboard/inventory?product=${product._id}`,
            metadata: { productId: product._id.toString() }
          });

          console.log(`  ⚠️  Low stock alert created for: ${product.name}`);
        }
      }

      console.log('✅ Low Stock Check Job completed');
    } catch (error) {
      console.error(`❌ Error in Low Stock Check Job: ${error.message}`);
    }
  });
};

module.exports = scheduleLowStockCheck;
