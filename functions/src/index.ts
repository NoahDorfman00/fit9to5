import * as admin from "firebase-admin";
import Stripe from "stripe";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const stripePriceId = defineSecret("STRIPE_PRICE_ID");

// Initialize CORS middleware with specific configuration
const corsHandler = cors({
  origin: [
    "http://localhost:3000",
    "https://coaching.fit9to5.com",
    "https://fit9to5.firebaseapp.com",
    "https://fit9to5.vercel.app",
  ],
  methods: ["POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

// 1. Create Checkout Session
export const createCheckoutSession = onRequest({
  secrets: [stripeSecretKey, stripePriceId],
  cors: false,
  region: "us-central1",
}, async (req, res) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", req.headers.origin || "https://coaching.fit9to5.com");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.status(204).send("");
    return;
  }

  // Use the cors middleware
  return corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken, true);
      const uid = decodedToken.uid;

      if (!decodedToken.email) {
        throw new Error("Token does not contain email");
      }

      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
        typescript: true,
      });

      // Create or retrieve the customer
      const customers = await stripe.customers.list({
        email: decodedToken.email,
        limit: 1,
      });

      let customer;
      if (customers.data.length > 0) {
        customer = customers.data[0];
        await admin.database()
          .ref(`users/${uid}/stripeCustomerId`)
          .set(customer.id);
      } else {
        customer = await stripe.customers.create({
          email: decodedToken.email,
          metadata: {
            firebaseUID: uid,
          },
        });
        await admin.database()
          .ref(`users/${uid}/stripeCustomerId`)
          .set(customer.id);
      }

      // Determine success URL based on origin
      const origin = req.headers.origin || "http://localhost:3000";
      const successUrl = `${origin}/success`;
      const cancelUrl = `${origin}/`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customer.id,
        line_items: [
          {
            price: stripePriceId.value(),
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: uid,
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
});

// 2. Cancel Subscription
export const cancelSubscription = onRequest({
  secrets: [stripeSecretKey],
  cors: false,
  region: "us-central1",
}, async (req, res) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", req.headers.origin || "https://coaching.fit9to5.com");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.status(204).send("");
    return;
  }

  return corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const customerIdRef = await admin.database()
        .ref(`users/${uid}/stripeCustomerId`).get();
      const stripeCustomerId = customerIdRef.val();

      if (!stripeCustomerId) {
        res.status(404).json({ error: "No Stripe customer found" });
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
        typescript: true,
      });

      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        res.status(404).json({ error: "No active subscription found" });
        return;
      }

      const subscription = subscriptions.data[0];
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      await admin.database()
        .ref(`users/${uid}/subscriptionStatus`)
        .set("pending_cancellation");

      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
});

// 3. Reactivate Subscription
export const reactivateSubscription = onRequest({
  secrets: [stripeSecretKey],
  cors: false,
  region: "us-central1",
}, async (req, res) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", req.headers.origin || "https://coaching.fit9to5.com");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.status(204).send("");
    return;
  }

  return corsHandler(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const customerIdRef = await admin.database()
        .ref(`users/${uid}/stripeCustomerId`).get();
      const stripeCustomerId = customerIdRef.val();

      if (!stripeCustomerId) {
        res.status(404).json({ error: "No Stripe customer found" });
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
        typescript: true,
      });

      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        res.status(404).json({ error: "No active subscription found" });
        return;
      }

      const subscription = subscriptions.data[0];
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      await admin.database()
        .ref(`users/${uid}/subscriptionStatus`)
        .set("subscribed");

      res.json({ success: true });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  });
});

// 4. Stripe Webhook Handler
export const stripeWebhook = onRequest({
  secrets: [stripeSecretKey, stripeWebhookSecret],
  cors: false,
  region: "us-central1",
}, async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).send("No signature");
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
      typescript: true,
    });

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      stripeWebhookSecret.value()
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.client_reference_id;

        if (uid) {
          await admin.database()
            .ref(`users/${uid}/subscriptionStatus`)
            .set("subscribed");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersRef = admin.database().ref("users");
        const snapshot = await usersRef
          .orderByChild("stripeCustomerId")
          .equalTo(customerId)
          .once("value");

        if (snapshot.exists()) {
          const users = snapshot.val();
          const uid = Object.keys(users)[0];

          let status: string;
          const isCancelling = subscription.cancel_at_period_end;
          if (subscription.status === "active" && isCancelling) {
            status = "pending_cancellation";
          } else if (subscription.status === "active") {
            status = "subscribed";
          } else {
            status = "unsubscribed";
          }

          await admin.database()
            .ref(`users/${uid}/subscriptionStatus`)
            .set(status);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersRef = admin.database().ref("users");
        const snapshot = await usersRef
          .orderByChild("stripeCustomerId")
          .equalTo(customerId)
          .once("value");

        if (snapshot.exists()) {
          const users = snapshot.val();
          const uid = Object.keys(users)[0];

          await admin.database()
            .ref(`users/${uid}/subscriptionStatus`)
            .set("unsubscribed");
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMsg = error instanceof Error ?
      error.message : "Unknown error";
    res.status(400).send(`Webhook Error: ${errorMsg}`);
  }
});
