import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, CircularProgress, IconButton, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import { colors, headingFont } from '../theme';

interface LayoutProps {
    children: React.ReactNode;
}

// Pages that lay out their own full-width sections instead of sitting in the centered container.
const FULL_BLEED_PATHS = ['/', '/profile', '/macros'];

const navLinkSx = { textTransform: 'none', fontWeight: 600, fontSize: 15, color: colors.mutedLight, '&:hover': { color: '#fff' } };

const Wordmark: React.FC<{ size: number; fontSize: number }> = ({ size, fontSize }) => (
    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', color: '#fff', minWidth: 0 }}>
        <img src="/assets/logo.png" alt="FIT 9to5 logo" style={{ width: size, height: size }} />
        <Typography sx={{ fontFamily: headingFont, fontWeight: 800, fontSize, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            FIT 9to5
        </Typography>
    </Box>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'rgba(11,27,43,0.92)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff',
                    borderRadius: 0,
                    boxShadow: 'none',
                    borderBottom: `1px solid ${colors.line}`,
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, sm: 3 }, maxWidth: 1240, width: '100%', mx: 'auto' }}>
                    <Wordmark size={36} fontSize={26} />
                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                        <Button component={Link} to="/macros" sx={navLinkSx}>
                            Macro Calculator
                        </Button>
                        <Button component={Link} to="/shop" sx={navLinkSx}>
                            Shop
                        </Button>
                        {loading ? (
                            <CircularProgress color="secondary" size={24} />
                        ) : user ? (
                            <>
                                <Button onClick={() => navigate('/profile')} sx={navLinkSx}>
                                    Profile
                                </Button>
                                <Button onClick={handleLogout} sx={navLinkSx}>
                                    Log Out
                                </Button>
                            </>
                        ) : (
                            <Button variant="contained" color="secondary" component={Link} to="/auth" disableElevation sx={{ ml: 1, px: 2.5, fontWeight: 800, fontSize: 15 }}>
                                Log In / Sign Up
                            </Button>
                        )}
                    </Box>
                    {/* Mobile Hamburger Menu */}
                    <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
                        <IconButton edge="end" color="inherit" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="right"
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                            PaperProps={{ sx: { bgcolor: colors.navy, color: '#fff', borderRadius: 0 } }}
                        >
                            <Box sx={{ width: 240 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                                <List sx={{ '& .MuiDivider-root': { borderColor: colors.line } }}>
                                    <ListItem button component={Link} to="/macros">
                                        <ListItemText primary="Macro Calculator" />
                                    </ListItem>
                                    <Divider />
                                    <ListItem button component={Link} to="/shop">
                                        <ListItemText primary="Shop" />
                                    </ListItem>
                                    <Divider />
                                    {loading ? (
                                        <ListItem><CircularProgress color="secondary" size={24} /></ListItem>
                                    ) : user ? (
                                        <>
                                            <ListItem button onClick={() => navigate('/profile')}>
                                                <ListItemText primary="Profile" />
                                            </ListItem>
                                            <Divider />
                                            <ListItem button onClick={handleLogout}>
                                                <ListItemText primary="Log Out" />
                                            </ListItem>
                                        </>
                                    ) : (
                                        <ListItem button component={Link} to="/auth">
                                            <ListItemText primary="Log In / Sign Up" primaryTypographyProps={{ sx: { color: colors.brand, fontWeight: 700 } }} />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        </Drawer>
                    </Box>
                </Toolbar>
            </AppBar>
            {FULL_BLEED_PATHS.includes(pathname) ? (
                <Box component="main" sx={{ flex: 1 }}>
                    {children}
                </Box>
            ) : (
                <Container component="main" sx={{ flex: 1, py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 }, width: '100%', maxWidth: '100vw' }}>
                    {children}
                </Container>
            )}
            <Box component="footer" sx={{ bgcolor: colors.navyFooter, borderTop: `1px solid ${colors.line}`, color: '#fff' }}>
                <Box sx={{ maxWidth: 1240, mx: 'auto', px: 3, py: 4.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 2, sm: 4 } }}>
                    <Wordmark size={28} fontSize={20} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5 }}>
                        {[
                            { to: '/macros', label: 'Macro Calculator' },
                            { to: '/shop', label: 'Shop' },
                            user ? { to: '/profile', label: 'Profile' } : { to: '/auth', label: 'Log In' },
                        ].map(({ to, label }) => (
                            <Box key={to} component={Link} to={to} sx={{ py: 1.25, color: colors.muted, textDecoration: 'none', fontSize: 15, '&:hover': { color: '#fff' } }}>
                                {label}
                            </Box>
                        ))}
                    </Box>
                    <Typography sx={{ fontSize: 14, color: colors.muted }}>
                        © {new Date().getFullYear()} FIT 9to5
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
