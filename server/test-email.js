import dotenv from 'dotenv';
import { sendEmergencyAlert } from './services/email.service.js';

dotenv.config();

// Test email data
const testData = {
  reportId: 'ACC-TEST-' + Date.now(),
  name: 'John Doe (Test Reporter)',
  contact: '+91 9876543210',
  location: 'MG Road, Bangalore, Karnataka 560001',
  coordinates: {
    lat: 12.9716,
    lng: 77.5946
  },
  description: 'This is a test emergency alert email. A severe accident has been reported with multiple vehicles involved. Immediate medical assistance required. Road is blocked.',
  severity: 'high',
  vehicleNo: 'KA-01-AB-1234',
  witnessInfo: 'Multiple witnesses present at the scene. Contact: Mr. Smith - 9988776655',
  images: [
    {
      url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      publicId: 'test_image_1'
    },
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      publicId: 'test_image_2'
    }
  ],
  responderEmails: ['23rahul54@gmail.com']
};

console.log('🧪 Sending test emergency alert email...');
console.log('📧 Recipient:', testData.responderEmails[0]);
console.log('📝 Report ID:', testData.reportId);

try {
  const result = await sendEmergencyAlert(testData);
  console.log('✅ Test email sent successfully!');
  console.log('📊 Result:', result);
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to send test email:');
  console.error(error);
  process.exit(1);
}
