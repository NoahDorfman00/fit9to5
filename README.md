# FIT 9to5

The website for FIT 9to5, my lifestyle coaching business for busy
professionals: a macro calculator anyone can use, plus sign-in and a Stripe
subscription for my coaching clients. React and TypeScript on Vercel, with
Firebase for auth, data and the serverless bits. Live at
[fit9to5.com](https://fit9to5.com).

<p align="center">
  <img src="public/assets/social.png" alt="FIT 9to5 social card: the headline Get fit on your time beside before-and-after transformation photos" width="560">
</p>

## Why

FIT 9to5 is my coaching business, and I'm the coach. I started it to share
what I learned from my own weight-loss and fitness journey.

The pitch is "Get Fit on Your Time": fitness, nutrition and mindset
coaching for people with day jobs. The code has two jobs. It takes
subscription payments for coaching without the site ever touching a card
number (Stripe hosts checkout and billing), and it hosts a free macro
calculator that clients and anyone else can use and share.

It didn't start from scratch. The first commit is literally "modified
flashcard app for fit9to5 subscriptions": it began as a copy of my
[Flashcard Generator](https://github.com/NoahDorfman00/flashcards), the first
project I had with Stripe subscriptions actually working, and
first lived at `coaching.fit9to5.com`. The macro calculator started as a
standalone page at `macros.fit9to5.com`
([repo](https://github.com/NoahDorfman00/macros)). In November 2025 it moved
in here and this app took over the main domain.

## How it works

### The macro calculator (`/macros`)

It's public and needs no account. It runs entirely in the browser and never
touches Firebase. There are two tabs.

**Basic** asks for current weight, target weight (lb) and a "gainer type."
It starts from a maintenance estimate of 14 kcal per pound of current body
weight. Then it adjusts:

- **Goal direction.** If the target is more than 1 lb away, the multiplier
  moves toward the goal by `(|target - current| - 1) / 5` kcal/lb. That's one
  extra kcal/lb for every 5 lb you want to change, with a 1 lb dead zone.
- **Gainer type.** Hard gainers get +1 kcal/lb and easy gainers get −1.
- **Macros.**
  - calories = `ceil(current × multiplier)`
  - protein = 1 g per lb of *target* weight
  - fat = 25% of calories ÷ 9
  - carbs = whatever is left ÷ 4

Each value is rounded up with `Math.ceil`.

Worked example, 180 lb → 170 lb, neutral: multiplier = 14 − 9/5 = 12.2, so
2,196 kcal. That gives 170 g protein, 61 g fat and 242 g carbs.

**Advanced** is for people who already know their calorie target. You enter
calories and target weight, then set two sliders: protein from 0.5 to 1.5
g/lb (default 1.0) and fat from 15 to 40% of calories (default 25). Same
remainder-goes-to-carbs logic. It also shows the arithmetic ("How it's
calculated") so nobody has to take the numbers on faith.

Both tabs recompute on every keystroke. The displayed total is recomputed
from the *rounded* grams, so it can land a few kcal above the input. That's
on purpose: the total matches what you'd actually eat.

**Sharing.** Every input is mirrored into the query string (`tab`, `cw`,
`tw`, `gt`, `cal`, `atw`, `pr`, `fp`) with `replace: true`, so a URL always
reproduces the exact result and there's no database involved. The Share
button renders the results card to a PNG with `html2canvas`. If the browser
can share files, it hands the PNG and the link to the Web Share API. If not,
it copies the link to the clipboard, and on browsers too old for the
Clipboard API it falls back to a hidden `<textarea>` and
`document.execCommand('copy')`.

### Accounts

`AuthContext` wraps Firebase Auth with email/password and Google sign-in.
Getting Google to work on phones took a few tries:

1. `signInWithPopup` silently failed on mobile Chrome because the popup was
   blocked or killed. Mobile user agents now use `signInWithRedirect`, and
   `getRedirectResult` finishes the flow on the next load. Desktop still uses
   the popup.
2. The redirect flow then broke on third-party storage blocking, because the
   OAuth handler lived on `<project>.firebaseapp.com`. `vercel.json` now
   proxies `/__/auth/*` and `/__/firebase/*` to that handler, and the auth
   domain env var points at `fit9to5.com`. That makes the whole handshake
   first-party.

### Subscriptions (Stripe)

Five HTTP Cloud Functions (`functions/src/index.ts`, Firebase Functions v2,
`us-central1`) do the Stripe work. Every call from the client sends the
user's Firebase ID token as `Authorization: Bearer …`, and the function
verifies it with the Admin SDK before doing anything else.

```
Subscribe Now ──► createCheckoutSession ──► Stripe Checkout (hosted)
                    │  verify ID token                │
                    │  find-or-create Stripe customer │ payment
                    │  save stripeCustomerId          ▼
                    └─ client_reference_id = uid   stripeWebhook ──► RTDB status
Manage Billing ─► createPortalSession ──► Stripe Customer Portal ──┘ (updated / deleted)
```

- **`createCheckoutSession`** checks the token with revocation checking on.
  It finds the Stripe customer by email or creates one tagged with
  `metadata.firebaseUID`, and stores the customer ID under the user. Then it
  opens a `mode: "subscription"` Checkout Session for a single price. The
  user's `uid` rides along as `client_reference_id`. The success and cancel
  URLs are built from the request `Origin`, so localhost, Vercel previews and
  production all redirect back to the right place. The browser receives the
  session ID and calls `stripe.redirectToCheckout`.
- **`createPortalSession`** returns a Stripe Customer Portal URL that comes
  back to `/profile`. Cancelling, reactivating, changing cards and viewing
  invoices all happen there.
- **`stripeWebhook`** checks the Stripe signature against `req.rawBody` and
  then handles three events:
  - `checkout.session.completed` marks the user `subscribed`, found through
    `client_reference_id`.
  - `customer.subscription.updated` finds the user with an RTDB query
    (`orderByChild("stripeCustomerId").equalTo(...)`). The user becomes
    `pending_cancellation` if the subscription is active with
    `cancel_at_period_end`, `subscribed` if it's simply active, and
    `unsubscribed` otherwise.
  - `customer.subscription.deleted` sets `unsubscribed`.
- **`cancelSubscription` / `reactivateSubscription`** flip
  `cancel_at_period_end` directly. They're still deployed, but the UI stopped
  calling them once the Customer Portal took over (see Lessons).

The Stripe secret key, webhook signing secret and price ID are Firebase
secrets (`defineSecret`), not env vars. The functions pin Stripe API version
`2025-04-30.basil`, which is newer than the bundled `stripe@14` typings know
about. A cast to `Stripe.LatestApiVersion` gets it past the compiler.

CORS: the functions are called with plain `fetch`, not `httpsCallable`, so
each one answers its own `OPTIONS` preflight and then runs the `cors`
middleware against an allowlist: localhost, `fit9to5.com`, and the
firebaseapp and Vercel hostnames.

### Data model

The Firebase Realtime Database holds exactly two fields per user:

```
users/
  {uid}/
    stripeCustomerId:   "cus_…"
    subscriptionStatus: "subscribed" | "pending_cancellation" | "unsubscribed"
```

Only the server writes them. The Home and Profile pages read
`subscriptionStatus` to decide which button to show: Get Started, Subscribe
Now, View My Profile, or Manage Billing. Stripe is the source of truth for
everything else.

### Everything else

`/shop` redirects to the merch store on Sticker Mule. `/success` is the
post-checkout landing page.

## Stack

| Layer | What |
|---|---|
| Frontend | React 18, TypeScript, Create React App (`react-scripts`), MUI 5, React Router 6 |
| Hosting | Vercel: SPA fallback plus the first-party Firebase auth proxy in `vercel.json` |
| Auth | Firebase Auth: email/password and Google |
| Data | Firebase Realtime Database |
| Backend | Firebase Cloud Functions v2 (Node 22, TypeScript) |
| Payments | Stripe Checkout, Customer Portal, webhooks |
| Extras | `html2canvas` and the Web Share API for sharing calculator results |

## Running it

**Frontend.** Create `.env.local` with your own Firebase web config and
Stripe publishable key:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
```

Then:

```bash
npm install
npm start        # CRA dev server on http://localhost:3000
npm run build    # production build into build/
```

The macro calculator works without any of the env vars set up. Sign-in and
billing need a real Firebase project.

**Functions.**

```bash
cd functions
npm install
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRICE_ID
npm run deploy   # firebase deploy --only functions (lint + tsc run first)
```

Point a Stripe webhook at the deployed `stripeWebhook` URL and subscribe it
to `checkout.session.completed`, `customer.subscription.updated` and
`customer.subscription.deleted`.

Two caveats if you fork this:

- The client calls the functions at hard-coded `us-central1-<project>`
  URLs in `Home.tsx` and `Profile.tsx`, so those need changing.
- The Functions emulator hookup in `services/firebase.ts` is commented out.

The frontend deploys through Vercel's Git integration: pushes to `main` go
to production.

## Lessons learned

1. **Let the webhook own the state.** Every status change goes through
   `stripeWebhook`, so it doesn't matter whether a cancellation came from my
   UI, the Customer Portal or the Stripe dashboard.
2. **Don't build what Stripe already hosts.** The Customer Portal replaced my
   custom cancel/reactivate buttons and added card updates and invoices for
   free.
3. **Mobile browsers eat OAuth popups.** `signInWithPopup` fails silently on
   mobile Chrome, so phones get the redirect flow instead.
4. **Then they eat third-party storage.** The redirect flow only became
   reliable once the Firebase auth handler was proxied through the site's own
   domain.
5. **A URL is a free database.** Putting the calculator's inputs in the
   query string made results shareable and bookmarkable with zero backend.

## Repo layout

```
src/
  pages/        Home, Auth, Profile, Success, Macros (calculator), Shop (redirect)
  components/   Layout: app bar + mobile drawer
  context/      AuthContext: Firebase Auth wrapper (popup vs redirect)
  services/     firebase.ts: SDK init from REACT_APP_* env vars
  types/        shared types (SubscriptionStatus)
functions/
  src/index.ts  Checkout, Portal, webhook, cancel/reactivate Cloud Functions
public/
  assets/       logo, favicon, social card
vercel.json     SPA fallback + /__/auth proxy
firebase.json   Functions deploy config (lint + build predeploy)
```

## Credits

Built by me.

