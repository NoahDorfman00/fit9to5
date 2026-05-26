import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography, Link } from '@mui/material';

const SHOP_URL = 'https://www.stickermule.com/fitfornoah/store';

const Shop: React.FC = () => {
    useEffect(() => {
        window.location.replace(SHOP_URL);
    }, []);

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 8 }}>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Redirecting to the shop... If you are not redirected automatically,{' '}
                <Link href={SHOP_URL}>click here</Link>.
            </Typography>
        </Box>
    );
};

export default Shop;
