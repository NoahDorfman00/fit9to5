import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, TextField, RadioGroup, FormControlLabel, Radio,
    FormControl, FormLabel, Paper, Tabs, Tab, Slider, InputAdornment,
    Button, Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import MacroTiles from '../components/MacroTiles';
import { colors, headingFont } from '../theme';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: 36,
    width: '100%',
    boxShadow: '0 24px 56px rgba(11,27,43,0.12)',
    [theme.breakpoints.down('sm')]: {
        padding: 20,
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.shape.borderRadius,
        '& fieldset': {
            borderWidth: 2,
            borderColor: theme.palette.divider,
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 700,
        fontSize: 14,
    },
}));

const StyledRadio = styled(Radio)(({ theme }) => ({
    display: 'none',
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
    margin: 0,
    width: '100%',
    height: '100%',
    '& .MuiFormControlLabel-label': {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 6px',
        lineHeight: 1.2,
        border: `2px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontWeight: 700,
        fontSize: 14,
    },
    '&:has(.Mui-checked) .MuiFormControlLabel-label': {
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderColor: theme.palette.primary.main,
    },
    '&:hover .MuiFormControlLabel-label': {
        borderColor: theme.palette.primary.main,
    },
}));

const ResultsBox = styled(Box)(({ theme }) => ({
    padding: 24,
    background: colors.brand,
    color: colors.navy,
    borderRadius: 12,
    [theme.breakpoints.down('sm')]: {
        padding: 16,
    },
    animation: 'slideIn 0.4s ease-out',
    '@keyframes slideIn': {
        from: {
            transform: 'translateY(-10px)',
        },
        to: {
            transform: 'translateY(0)',
        },
    },
}));

const MathBox = styled(Box)(({ theme }) => ({
    marginTop: 16,
    padding: 16,
    background: theme.palette.background.paper,
    borderRadius: 12,
    fontFamily: '"Roboto Mono", monospace',
    fontSize: 13,
    lineHeight: 1.8,
    color: theme.palette.text.secondary,
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    marginBottom: 24,
    '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
        height: 3,
        borderRadius: 2,
    },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'none',
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
        color: theme.palette.primary.main,
    },
}));

const container = { maxWidth: 1080, mx: 'auto', px: 3 };

const GAINER_HINTS = {
    hard: 'Hard gainer: you find it hard to put on weight.',
    neutral: 'Neutral: you gain and lose weight at a typical rate.',
    easy: 'Easy gainer: you put on weight easily.',
};

interface MacroResults {
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
}

const Macros: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL params (fall back to defaults)
    const [activeTab, setActiveTab] = useState<number>(() => {
        const t = searchParams.get('tab');
        return t === '1' ? 1 : 0;
    });

    // Basic tab state
    const [currentWeight, setCurrentWeight] = useState<string>(() => searchParams.get('cw') || '');
    const [targetWeight, setTargetWeight] = useState<string>(() => searchParams.get('tw') || '');
    const [gainerType, setGainerType] = useState<string>(() => {
        const gt = searchParams.get('gt');
        return gt && ['hard', 'neutral', 'easy'].includes(gt) ? gt : 'neutral';
    });
    const [results, setResults] = useState<MacroResults | null>(null);
    const [currentWeightError, setCurrentWeightError] = useState<string>('');
    const [targetWeightError, setTargetWeightError] = useState<string>('');

    // Advanced tab state
    const [advCalories, setAdvCalories] = useState<string>(() => searchParams.get('cal') || '');
    const [advTargetWeight, setAdvTargetWeight] = useState<string>(() => searchParams.get('atw') || '');
    const [proteinRatio, setProteinRatio] = useState<number>(() => {
        const pr = parseFloat(searchParams.get('pr') || '');
        return !isNaN(pr) && pr >= 0.5 && pr <= 1.5 ? pr : 1.0;
    });
    const [fatPercent, setFatPercent] = useState<number>(() => {
        const fp = parseFloat(searchParams.get('fp') || '');
        return !isNaN(fp) && fp >= 15 && fp <= 40 ? fp : 25;
    });
    const [advResults, setAdvResults] = useState<MacroResults | null>(null);
    const [advCaloriesError, setAdvCaloriesError] = useState<string>('');
    const [advTargetWeightError, setAdvTargetWeightError] = useState<string>('');

    // Share state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Sync state → URL params
    const syncParams = useCallback(() => {
        const params: Record<string, string> = {};
        params.tab = String(activeTab);
        if (activeTab === 0) {
            if (currentWeight) params.cw = currentWeight;
            if (targetWeight) params.tw = targetWeight;
            if (gainerType !== 'neutral') params.gt = gainerType;
        } else {
            if (advCalories) params.cal = advCalories;
            if (advTargetWeight) params.atw = advTargetWeight;
            if (proteinRatio !== 1.0) params.pr = proteinRatio.toFixed(2);
            if (fatPercent !== 25) params.fp = String(fatPercent);
        }
        setSearchParams(params, { replace: true });
    }, [activeTab, currentWeight, targetWeight, gainerType, advCalories, advTargetWeight, proteinRatio, fatPercent, setSearchParams]);

    useEffect(() => {
        syncParams();
    }, [syncParams]);

    // Basic calculator
    useEffect(() => {
        calculateMacros();
    }, [currentWeight, targetWeight, gainerType]);

    // Advanced calculator
    useEffect(() => {
        calculateAdvancedMacros();
    }, [advCalories, advTargetWeight, proteinRatio, fatPercent]);

    const calculateMacros = () => {
        setCurrentWeightError('');
        setTargetWeightError('');

        const currentWeightNum = parseFloat(currentWeight);
        const targetWeightNum = parseFloat(targetWeight);

        const currentValid = currentWeightNum > 0;
        const targetValid = targetWeightNum > 0;
        if (currentWeight && !currentValid) setCurrentWeightError('Please enter a valid weight');
        if (targetWeight && !targetValid) setTargetWeightError('Please enter a valid weight');
        if (!currentValid || !targetValid) {
            setResults(null);
            return;
        }

        const weightChange = targetWeightNum - currentWeightNum;
        let multiplier = 14;

        if (Math.abs(weightChange) > 1) {
            const adjustment = (Math.abs(weightChange) - 1) / 5;
            if (weightChange > 0) {
                multiplier += adjustment;
            } else {
                multiplier -= adjustment;
            }
        }

        if (gainerType === 'easy') {
            multiplier -= 1;
        } else if (gainerType === 'hard') {
            multiplier += 1;
        }

        const initialCalories = Math.ceil(currentWeightNum * multiplier);
        const fat = Math.ceil((0.25 * initialCalories) / 9);
        const protein = Math.ceil(targetWeightNum);
        const carbs = Math.ceil((initialCalories - (fat * 9) - (protein * 4)) / 4);
        const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);

        setResults({ totalCalories, protein, carbs, fat });
    };

    const calculateAdvancedMacros = () => {
        setAdvCaloriesError('');
        setAdvTargetWeightError('');

        const cals = parseFloat(advCalories);
        const tw = parseFloat(advTargetWeight);

        const calsValid = cals > 0;
        const twValid = tw > 0;
        if (advCalories && !calsValid) setAdvCaloriesError('Please enter a valid calorie target');
        if (advTargetWeight && !twValid) setAdvTargetWeightError('Please enter a valid target weight');
        if (!calsValid || !twValid) {
            setAdvResults(null);
            return;
        }

        const fatMultiplier = fatPercent / 100;

        // Protein = target weight * proteinRatio
        const protein = Math.ceil(tw * proteinRatio);

        // Fat = (cals * fatMultiplier) / 9
        const fat = Math.ceil((cals * fatMultiplier) / 9);

        // Carbs = (cals - fat*9 - protein*4) / 4
        const carbs = Math.ceil((cals - fat * 9 - protein * 4) / 4);

        // Recalculate total from rounded macros
        const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);

        setAdvResults({ totalCalories, protein, carbs, fat });
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;

        // Try to capture screenshot of results
        let file: File | undefined;
        if (resultsRef.current) {
            try {
                const canvas = await html2canvas(resultsRef.current, {
                    backgroundColor: colors.brand,
                    scale: 2,
                });
                const blob = await new Promise<Blob | null>((resolve) =>
                    canvas.toBlob(resolve, 'image/png')
                );
                if (blob) {
                    file = new File([blob], 'macros.png', { type: 'image/png' });
                }
            } catch {
                // Screenshot failed — still share the link
            }
        }

        // Native share with file support
        if (navigator.share) {
            try {
                const shareData: ShareData = {
                    title: 'My Macro Split — FIT 9to5',
                    url: shareUrl,
                };
                if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
                await navigator.share(shareData);
                return;
            } catch (err: any) {
                // User cancelled or share failed — fall through to clipboard
                if (err?.name === 'AbortError') return;
            }
        }

        // Fallback: copy link to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            // Last resort for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setSnackbarOpen(true);
    };

    const renderResultsBlock = (data: MacroResults) => (
        <>
            <Typography sx={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 1.5 }}>
                Your macro split
            </Typography>
            <MacroTiles {...data} />
        </>
    );

    const renderShareButton = () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }} data-html2canvas-ignore>
            <Button
                variant="contained"
                disableElevation
                startIcon={<ShareOutlinedIcon />}
                onClick={handleShare}
                sx={{ px: 3, py: 1.25, fontWeight: 800, bgcolor: colors.navy, color: '#fff', '&:hover': { bgcolor: colors.surface } }}
            >
                Share
            </Button>
        </Box>
    );

    const renderAdvancedMathBreakdown = () => {
        if (!advResults) return null;

        const cals = parseFloat(advCalories);
        const tw = parseFloat(advTargetWeight);
        const fatMultiplier = fatPercent / 100;

        return (
            <MathBox>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary', mb: 1.5, fontFamily: 'inherit' }}>
                    How it's calculated
                </Typography>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Protein
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: 'text.secondary' }}>
                        {tw} lbs × {proteinRatio} g/lb = <strong>{advResults.protein}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Fat
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: 'text.secondary' }}>
                        ({cals} cal × {fatPercent}%) / 9 kcal/g = <strong>{advResults.fat}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Carbs
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: 'text.secondary' }}>
                        ({cals} cal − {advResults.fat}g fat × 9 kcal/g − {advResults.protein}g pro × 4 kcal/g) / 4 kcal/g = <strong>{advResults.carbs}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Verification
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: 'text.secondary' }}>
                        {advResults.protein}g × 4 kcal/g + {advResults.carbs}g × 4 kcal/g + {advResults.fat}g × 9 kcal/g = <strong>{advResults.totalCalories} kcal</strong>
                    </Typography>
                </Box>
            </MathBox>
        );
    };

    const currentResults = activeTab === 0 ? results : advResults;

    const renderEmptyResults = () => (
        <ResultsBox>
            <Typography sx={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 1.5 }}>
                Your macro split
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 1, sm: 1.5 } }}>
                {['Protein', 'Carbs', 'Fat'].map((label) => (
                    <Box key={label} sx={{ bgcolor: 'rgba(11,27,43,0.12)', border: `2px dashed rgba(11,27,43,0.35)`, borderRadius: 1.5, px: { xs: 1.25, sm: 2 }, py: { xs: 2, sm: 2.5 } }}>
                        <Box sx={{ fontFamily: headingFont, fontWeight: 900, fontSize: { xs: 30, sm: 48 }, lineHeight: 1 }}>—</Box>
                        <Box sx={{ mt: 0.75, fontSize: { xs: 11, sm: 13 }, fontWeight: 700, letterSpacing: { xs: '0.06em', sm: '0.1em' }, textTransform: 'uppercase' }}>
                            {label}
                        </Box>
                    </Box>
                ))}
            </Box>
            <Typography sx={{ mt: 2, fontSize: 15, fontWeight: 600 }}>
                {activeTab === 0
                    ? 'Enter your current and target weight to see your split.'
                    : 'Enter your calorie target and target weight to see your split.'}
            </Typography>
        </ResultsBox>
    );

    return (
        <Box sx={{ bgcolor: colors.mist, pb: { xs: 8, md: 12 } }}>
            {/* Title band */}
            <Box sx={{ bgcolor: colors.navy, color: '#fff', pt: { xs: 6, md: 8 }, pb: { xs: 12, md: 14 } }}>
                <Box sx={{ ...container, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.brand }}>
                        Free tool · No account needed
                    </Box>
                    <Typography
                        variant="h1"
                        sx={{ fontFamily: headingFont, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.92, fontSize: { xs: 48, sm: 64, md: 80 } }}
                    >
                        Macro <Box component="span" sx={{ color: colors.brand }}>calculator</Box>
                    </Typography>
                    <Typography sx={{ maxWidth: 520, fontSize: { xs: 17, md: 18 }, lineHeight: 1.6, color: colors.muted }}>
                        Get a protein, carb and fat split for your goal in about 30 seconds.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ ...container, mt: { xs: -8, md: -10 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
                    <StyledPaper>
                        <StyledTabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            variant="fullWidth"
                        >
                            <StyledTab label="Basic" />
                            <StyledTab label="Advanced" />
                        </StyledTabs>

                        {/* ── Basic Tab ── */}
                        {activeTab === 0 && (
                            <Box>
                                <Box sx={{ mb: 3 }}>
                                    <StyledTextField
                                        fullWidth
                                        label="Current Weight (lbs)"
                                        type="number"
                                        value={currentWeight}
                                        onChange={(e) => setCurrentWeight(e.target.value)}
                                        inputProps={{ min: 1, step: 1 }}
                                        error={!!currentWeightError}
                                        helperText={currentWeightError}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <StyledTextField
                                        fullWidth
                                        label="Target Weight (lbs)"
                                        type="number"
                                        value={targetWeight}
                                        onChange={(e) => setTargetWeight(e.target.value)}
                                        inputProps={{ min: 1, step: 1 }}
                                        error={!!targetWeightError}
                                        helperText={targetWeightError}
                                    />
                                </Box>

                                <FormControl component="fieldset" sx={{ width: '100%' }}>
                                    <FormLabel
                                        component="legend"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: 'text.primary',
                                            mb: 1,
                                            '&.Mui-focused': { color: 'text.primary' },
                                        }}
                                    >
                                        Gainer Type
                                    </FormLabel>
                                    <RadioGroup
                                        name="gainerType"
                                        value={gainerType}
                                        onChange={(e) => setGainerType(e.target.value)}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                            gap: 1,
                                        }}
                                    >
                                        <StyledFormControlLabel
                                            value="hard"
                                            control={<StyledRadio />}
                                            label="Hard Gainer"
                                        />
                                        <StyledFormControlLabel
                                            value="neutral"
                                            control={<StyledRadio />}
                                            label="Neutral"
                                        />
                                        <StyledFormControlLabel
                                            value="easy"
                                            control={<StyledRadio />}
                                            label="Easy Gainer"
                                        />
                                    </RadioGroup>
                                    <Typography sx={{ mt: 1.25, fontSize: 13, color: 'text.secondary' }}>
                                        {GAINER_HINTS[gainerType as keyof typeof GAINER_HINTS]}
                                    </Typography>
                                </FormControl>
                            </Box>
                        )}

                        {/* ── Advanced Tab ── */}
                        {activeTab === 1 && (
                            <Box>
                                <Box sx={{ mb: 3 }}>
                                    <StyledTextField
                                        fullWidth
                                        label="Calorie Target"
                                        type="number"
                                        value={advCalories}
                                        onChange={(e) => setAdvCalories(e.target.value)}
                                        inputProps={{ min: 1, step: 50 }}
                                        error={!!advCaloriesError}
                                        helperText={advCaloriesError}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">kcal</InputAdornment>,
                                        }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <StyledTextField
                                        fullWidth
                                        label="Target Weight (lbs)"
                                        type="number"
                                        value={advTargetWeight}
                                        onChange={(e) => setAdvTargetWeight(e.target.value)}
                                        inputProps={{ min: 1, step: 1 }}
                                        error={!!advTargetWeightError}
                                        helperText={advTargetWeightError}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: 'text.primary',
                                            mb: 0.5,
                                        }}
                                    >
                                        Protein Ratio
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
                                        Grams of protein per pound of target weight (default: 1.0)
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Slider
                                            value={proteinRatio}
                                            onChange={(_, v) => setProteinRatio(v as number)}
                                            min={0.5}
                                            max={1.5}
                                            step={0.01}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(v) => `${v} g/lb`}
                                            sx={{
                                                flex: 1,
                                                color: 'primary.main',
                                                '& .MuiSlider-thumb': {
                                                    width: 20,
                                                    height: 20,
                                                },
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                minWidth: 56,
                                                fontWeight: 700,
                                                fontSize: 14,
                                                color: 'primary.main',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {proteinRatio.toFixed(2)} g/lb
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: 'text.primary',
                                            mb: 0.5,
                                        }}
                                    >
                                        Fat Percentage
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
                                        Percentage of total calories from fat (default: 25%)
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Slider
                                            value={fatPercent}
                                            onChange={(_, v) => setFatPercent(v as number)}
                                            min={15}
                                            max={40}
                                            step={1}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(v) => `${v}%`}
                                            sx={{
                                                flex: 1,
                                                color: 'primary.main',
                                                '& .MuiSlider-thumb': {
                                                    width: 20,
                                                    height: 20,
                                                },
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                minWidth: 40,
                                                fontWeight: 700,
                                                fontSize: 14,
                                                color: 'primary.main',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {fatPercent}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </StyledPaper>

                    {/* Results: beside the inputs on desktop, below them on phones */}
                    <Box sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
                        {currentResults ? (
                            <ResultsBox ref={resultsRef} key={activeTab}>
                                {renderResultsBlock(currentResults)}
                                {activeTab === 1 && renderAdvancedMathBreakdown()}
                                {renderShareButton()}
                            </ResultsBox>
                        ) : (
                            renderEmptyResults()
                        )}
                    </Box>
                </Box>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2500}
                onClose={() => setSnackbarOpen(false)}
                message="Link copied!"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
};

export default Macros;
