import { createTheme } from '@mui/material';

// Raw brand colors, for surfaces the MUI palette doesn't cover (the navy
// header, footer and home page sections).
export const colors = {
    brand: '#00BFFF',
    navy: '#0B1B2B',
    navyDeep: '#081521',
    navyFooter: '#07131F',
    surface: '#11273B',
    line: '#1E3448',
    lineStrong: '#2C4560',
    dialTrack: '#16304A',
    tick: '#3A5068',
    muted: '#A9B8C6',
    mutedLight: '#D7E1EA',
    mist: '#F3F8FC',
};

export const headingFont = '"Barlow Condensed", Inter, system-ui, sans-serif';

const theme = createTheme({
    palette: {
        mode: 'light',
        // primary: deeper shades of the brand blue that pass WCAG AA contrast
        // for text and buttons on white.
        primary: {
            light: colors.brand,
            main: '#0079BF',
            dark: '#005F96',
            contrastText: '#ffffff',
        },
        // secondary: the brand blue itself, with navy text. For buttons on navy.
        secondary: {
            main: colors.brand,
            dark: '#00A3D9',
            contrastText: colors.navy,
        },
        background: {
            default: colors.mist,
            paper: '#fff',
        },
        text: {
            primary: colors.navy,
            secondary: '#4A5866',
        },
        divider: '#E3E8ED',
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: [
            'Inter',
            'system-ui',
            'sans-serif',
        ].join(','),
        fontWeightBold: 700,
        h1: { fontFamily: headingFont, fontWeight: 900 },
        h2: { fontFamily: headingFont, fontWeight: 900 },
        h3: { fontFamily: headingFont, fontWeight: 800 },
        h4: { fontFamily: headingFont, fontWeight: 800 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 700,
                    textTransform: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 24px 0 rgba(11,27,43,0.08)',
                },
            },
        },
    },
});

export default theme;
