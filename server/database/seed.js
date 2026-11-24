const db = require('./db');

async function runSeed() {
  console.log('Seeding FoodVerse 3D Database...');
  await db.initDatabase();
  console.log('Database seeded successfully with all 9 categories, dishes, restaurants, coupons, demo users and demo admin!');
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
