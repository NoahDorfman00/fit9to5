# fit9to5

A lifestyle coaching platform designed for busy professionals. Balance fitness, nutrition, and wellness without sacrificing your career.

## Features

- Personalized fitness coaching
- Nutrition guidance and meal planning
- Mindset and habit coaching
- Flexible 24/7 access
- Subscription-based service with Stripe integration
- Firebase authentication (Email/Password, Google Sign-In)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
   REACT_APP_FIREBASE_DATABASE_URL=your_firebase_database_url_here
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id_here
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password and Google)
3. Create a Realtime Database
4. Set up Firebase Cloud Functions for Stripe integration
5. Get your Firebase configuration from the project settings
6. Add the configuration values to your `.env` file

## Stripe Setup

1. Create a Stripe account
2. Get your publishable key from the Stripe dashboard
3. Set up the following Cloud Functions:
   - `createCheckoutSession` - Creates a Stripe checkout session
   - `cancelSubscription` - Cancels a user's subscription
   - `reactivateSubscription` - Reactivates a cancelled subscription
4. Configure webhooks to update subscription status in Firebase

## Technologies Used

- React
- TypeScript
- Material-UI
- Firebase (Authentication, Realtime Database, Cloud Functions)
- Stripe (Subscription Management)
