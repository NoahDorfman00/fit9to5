import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, get } from 'firebase/database';
import Paper from '@mui/material/Paper';
import { loadStripe } from '@stripe/stripe-js';

type SubscriptionStatus = 'subscribed' | 'pending_cancellation' | 'unsubscribed';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('unsubscribed');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (user) {
            setInitialLoading(true);
            // Load subscription status
            const subRef = ref(database, `users/${user.uid}/subscriptionStatus`);
            get(subRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        setSubscriptionStatus(snapshot.val() as SubscriptionStatus);
                    } else {
                        setSubscriptionStatus('unsubscribed');
                    }
                })
                .catch(() => { })
                .finally(() => setInitialLoading(false));
        }
    }, [user]);

    const handleCheckout = async () => {
        if (!user) return;
        setCheckoutLoading(true);
        setError(null);
        try {
            const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
            if (!publishableKey) {
                throw new Error('Stripe publishable key is not configured');
            }

            const idToken = await user.getIdToken();

            const response = await fetch('https://us-central1-fit9to5.cloudfunctions.net/createCheckoutSession', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create checkout session: ${response.status} ${response.statusText} - ${errorData}`);
            }

            const { sessionId } = await response.json();

            const stripe = await loadStripe(publishableKey);
            if (!stripe) {
                throw new Error('Failed to initialize Stripe');
            }

            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
                throw error;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to start checkout process.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!user) return;
        setCancelling(true);
        setError(null);
        try {
            const idToken = await user.getIdToken();

            const response = await fetch('https://us-central1-fit9to5.cloudfunctions.net/cancelSubscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }

            setSubscriptionStatus('pending_cancellation');
            setShowCancelDialog(false);
        } catch (err: any) {
            setError(err.message || 'Failed to cancel subscription.');
            console.error('Cancel subscription error:', err);
        } finally {
            setCancelling(false);
        }
    };

    const handleReactivateSubscription = async () => {
        if (!user) return;
        setCancelling(true);
        setError(null);
        try {
            const idToken = await user.getIdToken();

            const response = await fetch('https://us-central1-fit9to5.cloudfunctions.net/reactivateSubscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to reactivate subscription');
            }

            setSubscriptionStatus('subscribed');
        } catch (err: any) {
            setError(err.message || 'Failed to reactivate subscription.');
            console.error('Reactivate subscription error:', err);
        } finally {
            setCancelling(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', mt: { xs: 3, sm: 6 }, px: 1 }}>
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', bgcolor: '#fff' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center' }}>
                        You must be logged in to view this page.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    if (initialLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: { xs: 3, sm: 6 }, px: 1 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: '0 4px 24px 0 rgba(10,60,47,0.10)', bgcolor: '#fff' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                    My Profile
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary', textAlign: 'center', mb: 4 }}>
                    {user.email}
                </Typography>

                {/* Subscription Status */}
                <Box sx={{ mt: 4, mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Subscription Status
                    </Typography>
                    <Typography variant="body1" sx={{
                        color: subscriptionStatus === 'subscribed'
                            ? 'success.main'
                            : subscriptionStatus === 'pending_cancellation'
                                ? 'warning.main'
                                : 'text.secondary',
                        mb: 1,
                        fontWeight: 600
                    }}>
                        {subscriptionStatus === 'subscribed'
                            ? '✓ Active Subscription'
                            : subscriptionStatus === 'pending_cancellation'
                                ? 'Subscription (Cancellation Pending)'
                                : 'No Active Subscription'
                        }
                    </Typography>
                    {subscriptionStatus === 'pending_cancellation' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Your subscription will remain active until the end of your current billing period.
                        </Typography>
                    )}
                    {subscriptionStatus === 'unsubscribed' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Subscribe to FIT 9to5 to access personalized coaching and wellness programs.
                        </Typography>
                    )}
                    {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
                    {subscriptionStatus === 'unsubscribed' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                            >
                                {checkoutLoading ? <CircularProgress size={24} /> : 'Subscribe Now'}
                            </Button>
                        </Box>
                    ) : subscriptionStatus === 'pending_cancellation' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleReactivateSubscription}
                                disabled={cancelling}
                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                            >
                                {cancelling ? <CircularProgress size={24} /> : 'Keep Subscription'}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setShowCancelDialog(true)}
                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                            >
                                Cancel Subscription
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Cancel Subscription Dialog */}
                <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowCancelDialog(false)} disabled={cancelling}>
                            Keep Subscription
                        </Button>
                        <Button
                            onClick={handleCancelSubscription}
                            color="error"
                            variant="contained"
                            disabled={cancelling}
                        >
                            {cancelling ? <CircularProgress size={24} /> : 'Cancel Subscription'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default Profile;
