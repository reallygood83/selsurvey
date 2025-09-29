// API Route to test environment variables server-side
export default function handler(req, res) {
  const envTest = {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_API_KEY_EXISTS: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_PROJECT_ID_EXISTS: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_API_KEY_VALUE: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'NOT_SET',
    FIREBASE_PROJECT_ID_VALUE: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
    ALL_NEXT_PUBLIC_VARS: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    TOTAL_ENV_VARS: Object.keys(process.env).length
  };

  res.status(200).json(envTest);
}