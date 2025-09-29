#!/bin/bash

# Add all Firebase environment variables to Vercel
echo "Adding Firebase environment variables to Vercel..."

# Read from .env.local and add to Vercel
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "AIzaSyD7NMneq37ymtYc_s8o8DLyx3Vni0GVJE0"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "gohard-9a1f4.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "gohard-9a1f4"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "gohard-9a1f4.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "56675714521"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "1:56675714521:web:df48bd210063f5ac5ac8"
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production <<< "G-TCM83PP1B5"
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://selsurvey.vercel.app"

echo "Environment variables added to Vercel production!"
echo "Triggering a new deployment..."
vercel --prod