const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Shop = require('./models/Shop');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }
  
  const shop = await Shop.create({
    name: "DukaFlow Shop",
    slug: 'my-duka-' + user._id.toString().slice(-6),
    businessType: 'grocery',
    owner: user._id,
  });
  
  user.shop = shop._id;
  await user.save();
  
  console.log('Shop created:', shop.name, 'slug:', shop.slug);
  console.log('Linked to user:', user.email);
  
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
