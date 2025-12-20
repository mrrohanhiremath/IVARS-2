import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Migrate existing users with location strings to coordinates
const migrateCoordinates = async () => {
  try {
    console.log('🔄 Starting coordinate migration...');
    
    // Find all users (including admins) with location strings
    const allUsers = await User.find({
      location: { $exists: true, $ne: '' }
    });

    console.log(`\n📋 All users in database: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   - ${u.name} (${u.role}/${u.responderStatus}): email="${u.email}", location="${u.location}", coords=[${u.coordinates?.lat}, ${u.coordinates?.lng}]`);
    });

    // Find users with location but no coordinates
    const usersToUpdate = await User.find({
      location: { $exists: true, $ne: '' },
      $or: [
        { 'coordinates.lat': { $exists: false } },
        { 'coordinates.lat': null },
        { 'coordinates.lng': { $exists: false } },
        { 'coordinates.lng': null }
      ]
    });

    console.log(`\n🔄 Found ${usersToUpdate.length} users to update`);

    let updated = 0;
    let failed = 0;

    for (const user of usersToUpdate) {
      try {
        // Parse location string (format: "lat,lng" or "lat, lng")
        if (user.location && user.location.includes(',')) {
          const [lat, lng] = user.location.split(',').map(coord => parseFloat(coord.trim()));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            user.coordinates = { lat, lng };
            await user.save();
            console.log(`✅ Updated ${user.name}: [${lat}, ${lng}]`);
            updated++;
          } else {
            console.log(`⚠️  Invalid coordinates for ${user.name}: ${user.location}`);
            failed++;
          }
        } else {
          console.log(`⚠️  No valid location format for ${user.name}: ${user.location}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${user.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📋 Total: ${usersToUpdate.length}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run migration
connectDB().then(() => {
  migrateCoordinates();
});
