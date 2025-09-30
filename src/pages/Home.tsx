import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { loadStripe } from '@stripe/stripe-js';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RestaurantIcon from '@mui/icons-material/Restaurant';

type SubscriptionStatus = 'subscribed' | 'pending_cancellation' | 'unsubscribed';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('unsubscribed');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's subscription status if logged in
    useEffect(() => {
        if (user) {
            const subRef = ref(database, `users/${user.uid}/subscriptionStatus`);
            get(subRef).then((snapshot) => {
                if (snapshot.exists()) {
                    setSubscriptionStatus(snapshot.val() as SubscriptionStatus);
                } else {
                    setSubscriptionStatus('unsubscribed');
                }
            });
        } else {
            setSubscriptionStatus('unsubscribed');
        }
    }, [user]);

    const handleGetStarted = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }

        if (['subscribed', 'pending_cancellation'].includes(subscriptionStatus)) {
            navigate('/profile');
            return;
        }

        // Start checkout for non-subscribed users
        handleCheckout();
    };

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
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
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
            console.error('Checkout error:', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: 'calc(100vh - 120px)',
            background: '#ffffff',
        }}>
            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 8 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            color: 'primary.main',
                            fontSize: { xs: '2.5rem', md: '3.75rem' },
                            letterSpacing: '-0.02em',
                            mb: 3
                        }}
                    >
                        Transform Your 9-to-5
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            color: 'text.secondary',
                            mb: 5,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            maxWidth: 800,
                            mx: 'auto',
                            lineHeight: 1.6
                        }}
                    >
                        Personalized lifestyle coaching designed for busy professionals.
                        Balance fitness, nutrition, and wellness without sacrificing your career.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGetStarted}
                        disabled={checkoutLoading}
                        sx={{
                            px: 6,
                            py: 2,
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            borderRadius: 3,
                            textTransform: 'none',
                            boxShadow: '0 8px 32px rgba(25,194,178,0.25)',
                            '&:hover': {
                                boxShadow: '0 12px 40px rgba(25,194,178,0.35)',
                            }
                        }}
                    >
                        {checkoutLoading ? (
                            <CircularProgress size={28} sx={{ color: 'white' }} />
                        ) : ['subscribed', 'pending_cancellation'].includes(subscriptionStatus) && user ? (
                            'View My Profile'
                        ) : user ? (
                            'Subscribe Now'
                        ) : (
                            'Get Started'
                        )}
                    </Button>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Box>

                {/* Features Grid */}
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 32px 0 rgba(0,191,255,0.15)',
                                }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <FitnessCenterIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Personalized Fitness
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                    Custom workout plans that fit your schedule and fitness level
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 32px 0 rgba(0,191,255,0.15)',
                                }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Nutrition Guidance
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                    Meal plans and nutrition advice tailored to your lifestyle
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 32px 0 rgba(0,191,255,0.15)',
                                }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <PsychologyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Mindset Coaching
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                    Build sustainable habits and overcome mental barriers
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 32px 0 rgba(0,191,255,0.15)',
                                }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <AccessTimeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    Flexible Schedule
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                    Work at your own pace with 24/7 access to your coach
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* CTA Section */}
                <Box sx={{ textAlign: 'center', mt: 10, mb: 6 }}>
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            mb: 3
                        }}
                    >
                        Ready to Transform Your Life?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'text.secondary',
                            mb: 4,
                            fontSize: '1.125rem',
                            maxWidth: 600,
                            mx: 'auto'
                        }}
                    >
                        Join FIT 9to5 today and start your journey to a healthier, more balanced lifestyle.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGetStarted}
                        disabled={checkoutLoading}
                        sx={{
                            px: 6,
                            py: 2,
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            borderRadius: 3,
                            textTransform: 'none',
                            boxShadow: '0 8px 32px rgba(0,191,255,0.25)',
                            '&:hover': {
                                boxShadow: '0 12px 40px rgba(0,191,255,0.35)',
                            }
                        }}
                    >
                        {checkoutLoading ? (
                            <CircularProgress size={28} sx={{ color: 'white' }} />
                        ) : ['subscribed', 'pending_cancellation'].includes(subscriptionStatus) && user ? (
                            'View My Profile'
                        ) : user ? (
                            'Subscribe Now'
                        ) : (
                            'Get Started'
                        )}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default Home; 
