import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { loadStripe } from '@stripe/stripe-js';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { colors, headingFont } from '../theme';
import { COACH_PHONE, PLAN_INCLUDES, PRICE, TEXT_COACH_HREF } from '../plan';

const container = { maxWidth: 1080, mx: 'auto', px: 3 };

const displaySx = {
    fontFamily: headingFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    lineHeight: 0.92,
    m: 0,
} as const;

const actionSx = { py: 1.75, fontSize: 16, fontWeight: 800 };

const STATUS = {
    subscribed: {
        label: 'Active',
        pill: { bgcolor: colors.brand, color: colors.navy },
        message: 'Your coaching is active. Update your payment method or plan anytime from billing.',
    },
    pending_cancellation: {
        label: 'Ending soon',
        pill: { bgcolor: '#FFB547', color: colors.navy },
        message: 'Your subscription will remain active until the end of your current billing period.',
    },
    unsubscribed: {
        label: 'Not subscribed',
        pill: { border: `1px solid ${colors.lineStrong}`, color: colors.mutedLight },
        message: 'Subscribe to FIT 9to5 to access personalized coaching and wellness programs.',
    },
};

const SHORTCUTS = [
    { to: '/macros', title: 'Macro Calculator', body: 'Get your protein, carb and fat split.', icon: <CalculateOutlinedIcon /> },
    { to: '/shop', title: 'Shop', body: 'FIT 9to5 merch.', icon: <StorefrontOutlinedIcon /> },
];

type SubscriptionStatus = 'subscribed' | 'pending_cancellation' | 'unsubscribed';

const Profile: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('unsubscribed');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);

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

    const handleManageBilling = async () => {
        if (!user) return;
        setPortalLoading(true);
        setError(null);
        try {
            const idToken = await user.getIdToken();

            const response = await fetch('https://us-central1-fit9to5.cloudfunctions.net/createPortalSession', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to open billing portal');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (err: any) {
            setError(err.message || 'Failed to open billing portal.');
            setPortalLoading(false);
        }
    };

    const isMember = subscriptionStatus === 'subscribed' || subscriptionStatus === 'pending_cancellation';
    const firstName = user?.displayName?.trim().split(/\s+/)[0] || undefined;

    if (authLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
    }

    if (!user) {
        return (
            <Box sx={{ bgcolor: colors.navy, color: '#fff', px: 3, py: { xs: 10, md: 14 }, textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 44, md: 64 }, mb: 2 }}>
                    Your <Box component="span" sx={{ color: colors.brand }}>profile</Box>
                </Typography>
                <Typography sx={{ color: colors.muted, fontSize: 17, mb: 4 }}>
                    Log in to see your membership and reach your coach.
                </Typography>
                <Button component={Link} to="/auth" variant="contained" color="secondary" disableElevation sx={{ px: 3.5, py: 1.75, fontSize: 16, fontWeight: 800 }}>
                    Log In / Sign Up
                </Button>
            </Box>
        );
    }

    const status = STATUS[subscriptionStatus];

    return (
        <Box sx={{ bgcolor: colors.mist, pb: { xs: 8, md: 12 } }}>
            {/* Welcome band */}
            <Box sx={{ bgcolor: colors.navy, color: '#fff', pt: { xs: 6, md: 8 }, pb: { xs: 12, md: 14 } }}>
                <Box sx={{ ...container, display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 } }}>
                    {user.photoURL ? (
                        <Box component="img" src={user.photoURL} alt="" referrerPolicy="no-referrer" sx={{ width: { xs: 64, sm: 84 }, height: { xs: 64, sm: 84 }, borderRadius: '50%', border: `3px solid ${colors.brand}`, flexShrink: 0 }} />
                    ) : (
                        <Box aria-hidden="true" sx={{ width: { xs: 64, sm: 84 }, height: { xs: 64, sm: 84 }, borderRadius: '50%', bgcolor: colors.brand, color: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: headingFont, fontWeight: 900, fontSize: { xs: 32, sm: 42 }, flexShrink: 0 }}>
                            {(firstName || user.email || '?').charAt(0).toUpperCase()}
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 40, sm: 56, md: 64 } }}>
                            Welcome back{firstName ? ', ' : ''}
                            {firstName && <Box component="span" sx={{ color: colors.brand }}>{firstName}</Box>}.
                        </Typography>
                        <Typography sx={{ mt: 1, color: colors.muted, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ ...container, mt: { xs: -8, md: -10 } }}>
                {initialLoading ? (
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, py: 8, display: 'flex', justifyContent: 'center', boxShadow: '0 24px 56px rgba(11,27,43,0.12)' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
                        {/* Membership */}
                        <Box sx={{ bgcolor: colors.navy, color: '#fff', borderRadius: 2, p: { xs: 3, sm: 4.5 }, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 24px 56px rgba(11,27,43,0.25)' }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                                <Typography component="h2" sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 28, textTransform: 'uppercase' }}>
                                    Your membership
                                </Typography>
                                <Box component="span" sx={{ px: 1.5, py: 0.75, borderRadius: 1, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', ...status.pill }}>
                                    {status.label}
                                </Box>
                            </Box>
                            <Box>
                                <Box sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: colors.mutedLight }}>FIT 9to5 Coaching</Box>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.5 }}>
                                    <Box component="span" sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: 56, lineHeight: 1 }}>{PRICE}</Box>
                                    <Box component="span" sx={{ fontSize: 16, color: colors.muted }}>/month</Box>
                                </Box>
                            </Box>
                            <Typography sx={{ color: colors.muted, fontSize: 16, lineHeight: 1.6 }}>
                                {status.message}
                            </Typography>
                            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25, fontSize: 16, color: '#E6EDF3' }}>
                                {PLAN_INCLUDES.map((item) => (
                                    <Box component="li" key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <CheckIcon sx={{ color: isMember ? colors.brand : colors.lineStrong, fontSize: 22 }} />
                                        {item}
                                    </Box>
                                ))}
                            </Box>
                            {error && <Alert severity="error">{error}</Alert>}
                            {isMember ? (
                                <Button variant="contained" color="secondary" disableElevation onClick={handleManageBilling} disabled={portalLoading} sx={actionSx}>
                                    {portalLoading ? <CircularProgress size={24} sx={{ color: colors.navy }} /> : 'Manage billing'}
                                </Button>
                            ) : (
                                <Button variant="contained" color="secondary" disableElevation onClick={handleCheckout} disabled={checkoutLoading} sx={actionSx}>
                                    {checkoutLoading ? <CircularProgress size={24} sx={{ color: colors.navy }} /> : `Subscribe for ${PRICE}/month`}
                                </Button>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Text Noah: members only */}
                            {isMember && (
                                <Box sx={{ bgcolor: colors.brand, color: colors.navy, borderRadius: 2, p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography component="h2" sx={{ ...displaySx, fontSize: { xs: 40, sm: 48 } }}>
                                        Text Noah.
                                    </Typography>
                                    <Typography sx={{ fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>
                                        Questions, form checks, or a push when you need it. Your coach is one text away.
                                    </Typography>
                                    <Button
                                        component="a"
                                        href={TEXT_COACH_HREF}
                                        variant="contained"
                                        disableElevation
                                        startIcon={<SmsOutlinedIcon />}
                                        sx={{ ...actionSx, bgcolor: colors.navy, color: '#fff', '&:hover': { bgcolor: colors.surface } }}
                                    >
                                        Text Noah
                                    </Button>
                                    <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                                        {COACH_PHONE.display}
                                    </Typography>
                                </Box>
                            )}

                            {/* Shortcuts */}
                            {SHORTCUTS.map((s) => (
                                <Box
                                    key={s.to}
                                    component={Link}
                                    to={s.to}
                                    sx={{ bgcolor: '#fff', color: colors.navy, textDecoration: 'none', borderRadius: 2, p: 3, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 4px 24px rgba(11,27,43,0.08)', transition: 'transform 0.15s ease', '&:hover': { transform: 'translateY(-2px)' } }}
                                >
                                    <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: colors.navy, color: colors.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {s.icon}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 22, textTransform: 'uppercase', lineHeight: 1.1 }}>{s.title}</Box>
                                        <Box sx={{ fontSize: 14, color: 'text.secondary', mt: 0.25 }}>{s.body}</Box>
                                    </Box>
                                    <ArrowForwardIcon sx={{ color: 'primary.main' }} />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Profile;
