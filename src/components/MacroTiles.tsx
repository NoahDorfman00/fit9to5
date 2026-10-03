import React from 'react';
import { Box } from '@mui/material';
import { colors, headingFont } from '../theme';

interface MacroTilesProps {
    protein: number;
    carbs: number;
    fat: number;
    totalCalories: number;
}

// Navy macro tiles with a calorie total underneath. Designed to sit on the brand-blue background.
const MacroTiles: React.FC<MacroTilesProps> = ({ protein, carbs, fat, totalCalories }) => (
    <Box sx={{ color: colors.navy }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 1, sm: 1.5 } }}>
            {[
                { grams: protein, label: 'Protein' },
                { grams: carbs, label: 'Carbs' },
                { grams: fat, label: 'Fat' },
            ].map((m) => (
                <Box key={m.label} sx={{ bgcolor: colors.navy, color: '#fff', borderRadius: 1.5, px: { xs: 1.25, sm: 2 }, py: { xs: 2, sm: 2.5 } }}>
                    <Box sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: { xs: 30, sm: 48 }, lineHeight: 1 }}>
                        {m.grams}<Box component="span" sx={{ fontSize: { xs: 16, sm: 22 }, color: colors.brand }}>g</Box>
                    </Box>
                    <Box sx={{ mt: 0.75, fontSize: { xs: 11, sm: 13 }, fontWeight: 700, letterSpacing: { xs: '0.06em', sm: '0.1em' }, textTransform: 'uppercase', color: colors.muted }}>
                        {m.label}
                    </Box>
                </Box>
            ))}
        </Box>
        <Box sx={{ mt: 1.5, fontFamily: headingFont, fontWeight: 800, fontSize: { xs: 22, sm: 26 }, textTransform: 'uppercase' }}>
            = {totalCalories.toLocaleString('en-US')} kcal / day
        </Box>
    </Box>
);

export default MacroTiles;
