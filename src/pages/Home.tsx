import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, get } from 'firebase/database';
import { loadStripe } from '@stripe/stripe-js';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import BeforeAfter from '../components/BeforeAfter';
import ClockDial from '../components/ClockDial';
import MacroTiles from '../components/MacroTiles';
import { colors, headingFont } from '../theme';

const FEATURES = [
    { title: 'Personalized Fitness', body: 'Custom workout plans that fit your schedule and fitness level.' },
    { title: 'Nutrition Guidance', body: 'Meal plans and nutrition advice that complement your training and fit your lifestyle, so your diet supports muscle growth, fat loss, recovery, and overall well-being.' },
    { title: 'Mindset Coaching', body: 'Build sustainable habits and overcome mental barriers.' },
    { title: 'Flexible Schedule', body: 'Work at your own pace with 24/7 access to your coach.' },
];

const STEPS = [
    { title: 'Tell your coach about your week', body: 'Share your schedule, your goals and how you like to train.' },
    { title: 'Get your plan', body: 'Your coach builds workouts and meals around your calendar, not the other way round.' },
    { title: 'Check in, anytime', body: 'Message your coach 24/7 and adjust as your week changes.' },
];

const PLAN_INCLUDES = [
    'Personalized workout plans',
    'Meal plans and nutrition guidance',
    'Mindset and habit coaching',
    '24/7 access to your coach',
    'Cancel anytime from your profile',
];

const PRICE = '$49.99';

// Client results, shared with each client's consent. Photos and quote are each optional;
// `stat` is the big timeframe shown on the card.
interface ClientResult {
    name: string;
    detail: string;
    stat: string;
    photos?: { before: string; after: string };
    quote?: string;
}

const RESULTS: ClientResult[] = [
    {
        name: 'Lauren',
        detail: 'Training with Noah for two years',
        stat: '2 years',
        photos: { before: '/assets/results/lauren-before.jpg', after: '/assets/results/lauren-after.jpg' },
        quote: 'In the past two years that I’ve been working out with Noah, I’ve seen so much growth in myself — both physically and mentally. I’m not only the strongest that I’ve ever been, but he helped me fall in love with the process. Going to the gym isn’t a chore to me anymore. Noah keeps me on track and pushes me in the gym, but will also share a piece of cake with me every so often. It’s really all about balance.',
    },
    {
        name: 'Jacob',
        detail: '5-month transformation',
        stat: '5 months',
        photos: { before: '/assets/results/jacob-before.jpg', after: '/assets/results/jacob-after.jpg' },
    },
];

// Example output shown in the calculator promo: 180*4 + 210*4 + 70*9 = 2,190 kcal.
const EXAMPLE_MACROS = { protein: 180, carbs: 210, fat: 70, totalCalories: 2190 };

const container = { maxWidth: 1240, mx: 'auto', px: 3 };

const displaySx = {
    fontFamily: headingFont,
    fontWeight: 900,
    textTransform: 'uppercase',
    lineHeight: 0.92,
    m: 0,
} as const;

const sectionTitleSx = { ...displaySx, fontSize: { xs: 44, md: 72 } };

const eyebrowSx = { fontSize: 14, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' } as const;

const ctaSx = { px: 3.75, py: 2, fontSize: 17, fontWeight: 800 };

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

    const isMember = !!user && ['subscribed', 'pending_cancellation'].includes(subscriptionStatus);
    const ctaLabel = isMember ? 'View My Profile' : user ? 'Subscribe Now' : 'Get Started';

    const renderCta = (sx: object = {}) => (
        <>
            <Button
                variant="contained"
                color="secondary"
                disableElevation
                onClick={handleGetStarted}
                disabled={checkoutLoading}
                endIcon={checkoutLoading ? undefined : <ArrowForwardIcon />}
                sx={{ ...ctaSx, ...sx }}
            >
                {checkoutLoading ? <CircularProgress size={24} sx={{ color: colors.navy }} /> : ctaLabel}
            </Button>
            {error && (
                <Typography sx={{ color: '#FF8A80', fontWeight: 600, width: '100%' }}>
                    {error}
                </Typography>
            )}
        </>
    );

    return (
        <Box sx={{ bgcolor: colors.navy, color: '#fff', overflowX: 'hidden' }}>
            {/* Hero */}
            <Box component="section" sx={{ borderBottom: `1px solid ${colors.line}` }}>
                <Box sx={{ ...container, pt: { xs: 7, md: 10 }, pb: { xs: 8, md: 12 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
                    <Box sx={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                        <Box sx={{ ...eyebrowSx, display: 'flex', alignItems: 'center', gap: 1.5, color: colors.brand }}>
                            <Box component="span" sx={{ width: 32, height: 2, bgcolor: colors.brand }} />
                            Coaching for busy professionals
                        </Box>
                        <Typography component="h1" sx={{ ...displaySx, fontSize: 'clamp(64px, 9vw, 136px)', lineHeight: 0.88 }}>
                            Get fit on<br />
                            <Box component="span" sx={{ color: colors.brand }}>your time.</Box>
                        </Typography>
                        <Typography sx={{ maxWidth: 520, fontSize: { xs: 18, md: 19 }, lineHeight: 1.6, color: colors.muted }}>
                            Personalized lifestyle coaching designed for busy professionals.
                            Balance fitness, nutrition, and wellness without sacrificing your career.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                            {renderCta()}
                            <Button
                                component={Link}
                                to="/macros"
                                variant="outlined"
                                sx={{ ...ctaSx, fontWeight: 700, color: '#fff', borderWidth: 2, borderColor: colors.lineStrong, '&:hover': { borderWidth: 2, borderColor: colors.brand, bgcolor: 'transparent' } }}
                            >
                                Free macro calculator
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ flex: '1 1 360px', minWidth: 0, maxWidth: 460, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <ClockDial />
                        <Typography sx={{ textAlign: 'center', fontSize: 15, color: colors.muted }}>
                            Your plan lives in the blue part of the clock.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Features */}
            <Box component="section" sx={{ py: { xs: 9, md: 13 } }}>
                <Box sx={{ ...container, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', columnGap: 6, rowGap: 2 }}>
                        <Typography component="h2" sx={{ ...sectionTitleSx, maxWidth: 700 }}>
                            Coaching that fits <Box component="span" sx={{ color: colors.brand }}>between meetings.</Box>
                        </Typography>
                        <Typography sx={{ maxWidth: 360, fontSize: 17, lineHeight: 1.6, color: colors.muted }}>
                            One coach, one plan, built around the calendar you already have.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', borderTop: `1px solid ${colors.line}` }}>
                        {FEATURES.map((f, i) => (
                            <Box component="article" key={f.title} sx={{ py: 4, pr: 3.5, borderBottom: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                                <Box component="span" sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: 56, lineHeight: 1, color: colors.brand }}>
                                    {String(i + 1).padStart(2, '0')}
                                </Box>
                                <Typography component="h3" sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
                                    {f.title}
                                </Typography>
                                <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: colors.muted }}>
                                    {f.body}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* How it works */}
            <Box component="section" sx={{ bgcolor: colors.navyDeep, py: { xs: 9, md: 13 }, borderTop: `1px solid ${colors.line}`, borderBottom: `1px solid ${colors.line}` }}>
                <Box sx={{ ...container, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Typography component="h2" sx={sectionTitleSx}>How it works</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                        {STEPS.map((s, i) => (
                            <Box key={s.title} sx={{ flex: '1 1 300px', minWidth: 0, bgcolor: colors.surface, borderRadius: 1.5, borderTop: `4px solid ${colors.brand}`, p: 3.5, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                                <Box component="span" sx={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: colors.brand }}>
                                    STEP {String(i + 1).padStart(2, '0')}
                                </Box>
                                <Typography component="h3" sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 30, lineHeight: 1.05, textTransform: 'uppercase' }}>
                                    {s.title}
                                </Typography>
                                <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: colors.muted }}>
                                    {s.body}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Meet your coach */}
            <Box component="section" sx={{ py: { xs: 9, md: 13 } }}>
                <Box sx={{ ...container, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 5, md: 8 } }}>
                    <Box sx={{ flex: '1 1 400px', minWidth: 0, maxWidth: 520 }}>
                        <BeforeAfter before="/assets/results/noah-before.jpg" after="/assets/results/noah-after.jpg" subject="Noah" />
                    </Box>
                    <Box sx={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ ...eyebrowSx, color: colors.brand }}>Meet your coach</Box>
                        <Typography component="h2" sx={sectionTitleSx}>
                            Hi, I’m <Box component="span" sx={{ color: colors.brand }}>Noah.</Box>
                        </Typography>
                        <Typography sx={{ fontSize: 18, lineHeight: 1.65, color: '#E6EDF3' }}>
                            I started FIT 9to5 to share what I learned from my own weight-loss and fitness journey.
                            Those are my before and after photos.
                        </Typography>
                        <Typography sx={{ fontSize: 17, lineHeight: 1.65, color: colors.muted }}>
                            My approach is about balance: strength training that evolves with your progress and
                            nutrition that fits the way you actually live, without ever turning down chicken parm.
                            Fitness should work around your schedule, not take it over.
                        </Typography>
                        <Typography sx={{ fontSize: 17, lineHeight: 1.65, color: colors.muted }}>
                            When you train with me, I’m one message away for feedback, form checks, or a push when
                            you need it.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Macro calculator promo */}
            <Box component="section" sx={{ bgcolor: colors.brand, color: colors.navy }}>
                <Box sx={{ ...container, py: { xs: 8, md: 11 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Box sx={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                        <Box sx={eyebrowSx}>Free tool · No account needed</Box>
                        <Typography component="h2" sx={{ ...displaySx, fontSize: { xs: 52, md: 88 }, lineHeight: 0.9 }}>
                            Know your numbers.
                        </Typography>
                        <Typography sx={{ maxWidth: 460, fontSize: 18, lineHeight: 1.6, fontWeight: 500 }}>
                            Get a protein, carb and fat split for your goal in about 30 seconds.
                        </Typography>
                        <Button
                            component={Link}
                            to="/macros"
                            variant="contained"
                            disableElevation
                            sx={{ ...ctaSx, alignSelf: 'flex-start', bgcolor: colors.navy, color: '#fff', '&:hover': { bgcolor: colors.surface } }}
                        >
                            Open the Macro Calculator
                        </Button>
                    </Box>
                    <Box sx={{ flex: '0 1 420px', minWidth: 0 }}>
                        <Box sx={eyebrowSx}>Example result</Box>
                        <Box sx={{ mt: 1.5 }}>
                            <MacroTiles {...EXAMPLE_MACROS} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Results: client transformations and testimonials */}
            <Box component="section" sx={{ py: { xs: 9, md: 13 } }}>
                <Box sx={{ ...container, display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 6 } }}>
                    <Box sx={{ ...eyebrowSx, color: colors.brand, mb: -2 }}>Client results</Box>
                    <Typography component="h2" sx={sectionTitleSx}>
                        From people with <Box component="span" sx={{ color: colors.brand }}>full calendars.</Box>
                    </Typography>
                    {RESULTS.map((r, i) => (
                        <Box
                            component="figure"
                            key={r.name}
                            sx={{ m: 0, p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: colors.surface, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 3, md: 5 } }}
                        >
                            {r.photos && (
                                <Box sx={{ flex: '1 1 340px', minWidth: 0, maxWidth: { md: 520 }, order: { md: i % 2 } }}>
                                    <BeforeAfter before={r.photos.before} after={r.photos.after} subject={r.name} />
                                </Box>
                            )}
                            <Box sx={{ flex: '1 1 340px', minWidth: 0, px: { xs: 1, md: 2 }, pb: { xs: 1, md: 0 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: { xs: 56, md: 80 }, lineHeight: 0.9, textTransform: 'uppercase', color: colors.brand }}>
                                    {r.stat}
                                </Box>
                                {r.quote && (
                                    <Box component="blockquote" sx={{ m: 0, fontSize: { xs: 17, md: 18 }, lineHeight: 1.65, color: '#E6EDF3' }}>
                                        “{r.quote}”
                                    </Box>
                                )}
                                <Box component="figcaption" sx={{ fontSize: 15, color: colors.muted }}>
                                    <Box component="strong" sx={{ color: '#fff' }}>{r.name}</Box> · {r.detail}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Pricing */}
            <Box component="section" sx={{ bgcolor: colors.mist, color: colors.navy, py: { xs: 9, md: 13 } }}>
                <Box sx={{ ...container, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Box sx={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ ...eyebrowSx, color: 'primary.main' }}>Membership</Box>
                        <Typography component="h2" sx={sectionTitleSx}>
                            One plan.<br />Everything in.
                        </Typography>
                        <Typography sx={{ maxWidth: 420, fontSize: 17, lineHeight: 1.6, color: 'text.secondary' }}>
                            Fitness, nutrition and mindset coaching in a single monthly subscription.
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 400px', minWidth: 0, maxWidth: 480, bgcolor: colors.navy, color: '#fff', borderRadius: 2, p: { xs: 3.5, sm: 4.5 }, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 24px 56px rgba(11,27,43,0.25)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                            <Typography component="h3" sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: 28, textTransform: 'uppercase' }}>
                                FIT 9to5 Coaching
                            </Typography>
                            <img src="/assets/logo.png" alt="" style={{ width: 32, height: 32 }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                            <Box component="span" sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: 64, lineHeight: 1 }}>
                                {PRICE}
                            </Box>
                            <Box component="span" sx={{ fontSize: 16, color: colors.muted }}>/month</Box>
                        </Box>
                        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: 16, color: '#E6EDF3' }}>
                            {PLAN_INCLUDES.map((item) => (
                                <Box component="li" key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <CheckIcon sx={{ color: colors.brand, fontSize: 22 }} />
                                    {item}
                                </Box>
                            ))}
                        </Box>
                        {renderCta({ width: '100%' })}
                    </Box>
                </Box>
            </Box>

            {/* Closing CTA */}
            <Box component="section" sx={{ position: 'relative', overflow: 'hidden', py: { xs: 11, md: 15 }, px: 3 }}>
                <Box
                    component="svg"
                    aria-hidden="true"
                    viewBox="0 0 200 200"
                    sx={{ position: 'absolute', left: '50%', top: '50%', width: 760, height: 760, ml: '-380px', mt: '-380px' }}
                >
                    <circle cx="100" cy="100" r="88" fill="none" stroke={colors.surface} strokeWidth="18" />
                    <path d="M100 100 L150 186.6 A100 100 0 0 1 0 100 Z" fill={colors.surface} />
                </Box>
                <Box sx={{ position: 'relative', maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3 }}>
                    <Typography component="h2" sx={{ ...displaySx, fontSize: 'clamp(52px, 7vw, 104px)', lineHeight: 0.9 }}>
                        Ready to transform <Box component="span" sx={{ color: colors.brand }}>your life?</Box>
                    </Typography>
                    <Typography sx={{ maxWidth: 520, fontSize: 18, lineHeight: 1.6, color: colors.muted }}>
                        Join FIT 9to5 today and start your journey to a healthier, more balanced lifestyle.
                    </Typography>
                    {renderCta({ px: 4.5, py: 2.25, fontSize: 18 })}
                </Box>
            </Box>
        </Box>
    );
};

export default Home;
