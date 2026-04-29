const cron = require('node-cron');
const Shop = require('../models/Shop');
const { sendEmail } = require('../config/mail');

// Trial Expiry Check - Daily midnight (9:00 PM UTC previous day)
const scheduleTrialExpiry = () => {
  cron.schedule('0 21 * * *', async () => {
    console.log('🔔 Running Trial Expiry Check Job...');
    
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Find shops with trials ending in 7 days
      const trialEndingSoon = await Shop.find({
        'subscription.status': 'trial',
        'subscription.trialEnds': {
          $lte: sevenDaysFromNow,
          $gte: now
        }
      }).populate('owner');

      for (const shop of trialEndingSoon) {
        const daysRemaining = Math.ceil((shop.subscription.trialEnds - now) / (1000 * 60 * 60 * 24));

        // Send warning email
        const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #312E81;">DukaFlow Trial Expiring Soon</h1>
            <h2 style="color: #1E293B;">${shop.name}</h2>
            
            <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <h3 style="color: #F59E0C; margin: 0 0 10px 0;">⚠️ Trial Ends in ${daysRemaining} Days</h3>
              <p style="font-size: 16px; margin: 10px 0;">Your 14-day free trial ends on <strong>${shop.subscription.trialEnds.toLocaleDateString()}</strong>.</p>
              <p style="font-size: 16px; margin: 10px 0;">Upgrade now to continue enjoying all features without interruption.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard/settings?tab=billing" 
                 style="background: #312E81; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Upgrade Your Plan
              </a>
            </div>
            
            <p style="color: #64748B; font-size: 14px;">Need help? <a href="mailto:support@dukaflow.com">Contact Support</a></p>
          </div>
        `;

        await sendEmail({
          to: shop.owner.email,
          subject: `⚠️ Your DukaFlow Trial Expires in ${daysRemaining} Days`,
          html,
        });
      }

      // Find shops with expired trials and suspend them
      const expiredTrials = await Shop.find({
        'subscription.status': 'trial',
        'subscription.trialEnds': { $lt: now }
      });

      for (const shop of expiredTrials) {
        shop.subscription.status = 'suspended';
        await shop.save();

        console.log(`  🔔 Trial expired and suspended: ${shop.name}`);
      }

      console.log('✅ Trial Expiry Check Job completed');
    } catch (error) {
      console.error(`❌ Error in Trial Expiry Check Job: ${error.message}`);
    }
  });
};

module.exports = scheduleTrialExpiry;
