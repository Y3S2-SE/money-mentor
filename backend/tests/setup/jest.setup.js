import dotenv from 'dotenv';

// Force load test environment
dotenv.config({ path: '.env.test' });

console.log('Jest Setup - Test Environment');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);