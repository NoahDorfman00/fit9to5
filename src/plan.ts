// Membership details shared by the Home and Profile pages.

export const PRICE = '$49.99';

export const PLAN_INCLUDES = [
    'Personalized workout plans',
    'Meal plans and nutrition guidance',
    'Mindset and habit coaching',
    '24/7 access to your coach',
    'Cancel anytime from your profile',
];

// Members text Noah directly. Shown only on the Profile page to active members, but note
// that anything in the client bundle is public.
export const COACH_PHONE = { display: '(856) 381-1006', e164: '+18563811006' };

// "?&body=" is the form both iOS and Android accept for a prefilled message.
export const TEXT_COACH_HREF = `sms:${COACH_PHONE.e164}?&body=${encodeURIComponent('Hey Noah, ')}`;
