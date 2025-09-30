export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
}

export type SubscriptionStatus = 'subscribed' | 'pending_cancellation' | 'unsubscribed';
