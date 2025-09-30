// Simple Node.js test to check environment variables
console.log('=== Environment Variable Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PWD:', process.env.PWD);
console.log('NEXT_PUBLIC_FIREBASE_API_KEY exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID exists:', !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.log('✅ Firebase API Key found');
} else {
    console.log('❌ Firebase API Key NOT found');
    console.log('Available env vars starting with NEXT_PUBLIC:', 
        Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
}