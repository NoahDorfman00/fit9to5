import React from 'react';
import { Box } from '@mui/material';
import { colors, headingFont } from '../theme';

interface BeforeAfterProps {
    before: string;
    after: string;
    // Who is pictured, for alt text, e.g. "Noah" or "A FIT 9to5 client".
    subject: string;
}

const tagSx = {
    position: 'absolute',
    left: 10,
    bottom: 10,
    px: 1.25,
    py: 0.75,
    borderRadius: 1,
    fontFamily: headingFont,
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight: 1,
} as const;

// Two photos side by side with Before / After labels.
const BeforeAfter: React.FC<BeforeAfterProps> = ({ before, after, subject }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
        {[
            { src: before, label: 'Before', tag: { bgcolor: 'rgba(11,27,43,0.88)', color: '#fff' } },
            { src: after, label: 'After', tag: { bgcolor: colors.brand, color: colors.navy } },
        ].map((p) => (
            <Box key={p.label} sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', aspectRatio: '3 / 4', bgcolor: colors.surface }}>
                <Box
                    component="img"
                    src={p.src}
                    alt={`${subject}, ${p.label.toLowerCase()}`}
                    loading="lazy"
                    sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
                <Box component="span" sx={{ ...tagSx, ...p.tag }}>{p.label}</Box>
            </Box>
        ))}
    </Box>
);

export default BeforeAfter;
