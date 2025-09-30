import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Success: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 8 }}>
            <Paper elevation={3} sx={{ p: 5, borderRadius: 4, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', mx: { xs: 1, sm: 0 } }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
                    Welcome to FIT 9to5!
                </Typography>
                <Typography variant="body1" paragraph sx={{ color: 'text.secondary', fontSize: 18, mb: 4 }}>
                    Thank you for subscribing! Your journey to a healthier, more balanced lifestyle starts now.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/profile')}
                    sx={{ px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 18 }}
                >
                    Go to My Profile
                </Button>
            </Paper>
        </Box>
    );
};

export default Success; 