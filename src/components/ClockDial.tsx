import React from 'react';
import { colors, headingFont } from '../theme';

// The logo as a full clock: 9 to 5 is work, the filled 5-to-9 wedge is "your time".
const C = 200;
const RING_R = 160;
const RING_W = 26;
const WEDGE_R = RING_R + RING_W / 2;

const point = (hour: number, r: number) => {
    const a = ((hour * 30 - 90) * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

const five = point(5, WEDGE_R);
const nine = point(9, WEDGE_R);
const wedge = `M${C} ${C} L${five.x} ${five.y} A${WEDGE_R} ${WEDGE_R} 0 0 1 ${nine.x} ${nine.y} Z`;

const ClockDial: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <svg
        role="img"
        aria-label="Clock dial: 9 AM to 5 PM is work, 5 PM to 9 AM is your time"
        viewBox="0 0 400 400"
        style={{ display: 'block', width: '100%', height: 'auto', ...style }}
    >
        <circle cx={C} cy={C} r={RING_R} fill="none" stroke={colors.dialTrack} strokeWidth={RING_W} />
        {Array.from({ length: 12 }, (_, h) => {
            const a = point(h, 126);
            const b = point(h, 140);
            return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.tick} strokeWidth={3} strokeLinecap="round" />;
        })}
        <path d={wedge} fill={colors.brand} />
        <circle cx={C} cy={C} r={9} fill="#fff" />
        <text x={58} y={186} fontFamily="Inter, sans-serif" fontSize={14} fontWeight={700} letterSpacing={1} fill={colors.mutedLight}>9 AM</text>
        <text x={262} y={296} fontFamily="Inter, sans-serif" fontSize={14} fontWeight={700} letterSpacing={1} fill={colors.mutedLight}>5 PM</text>
        <text x={C} y={140} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={13} fontWeight={600} letterSpacing={2} fill="#7F93A6">WORK</text>
        <text x={148} y={290} textAnchor="middle" fontFamily={headingFont} fontSize={26} fontWeight={900} letterSpacing={0.5} fill={colors.navy}>YOUR TIME</text>
    </svg>
);

export default ClockDial;
