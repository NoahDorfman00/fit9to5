import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Container, Typography, TextField, RadioGroup, FormControlLabel, Radio,
    FormControl, FormLabel, Paper, Tabs, Tab, Slider, InputAdornment,
    Button, Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: 40,
    maxWidth: 540,
    width: '100%',
    margin: '0 auto',
    borderRadius: 18,
    boxShadow: '0 4px 24px 0 rgba(10, 60, 47, 0.08)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 18,
        '& fieldset': {
            borderWidth: 2,
            borderColor: '#e0e0e0',
        },
        '&:hover fieldset': {
            borderColor: '#00BFFF',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00BFFF',
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
    flex: 1,
    minWidth: 140,
    '& .MuiFormControlLabel-label': {
        display: 'block',
        padding: '12px 16px',
        border: '2px solid #e0e0e0',
        borderRadius: 18,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontWeight: 700,
        fontSize: 14,
    },
    '&:has(.Mui-checked) .MuiFormControlLabel-label': {
        background: '#00BFFF',
        color: 'white',
        borderColor: '#00BFFF',
    },
    '&:hover .MuiFormControlLabel-label': {
        borderColor: '#00BFFF',
    },
}));

const ResultsBox = styled(Box)(({ theme }) => ({
    marginTop: 30,
    padding: 25,
    background: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: 18,
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
    background: '#f8f9fa',
    borderRadius: 12,
    fontFamily: '"Roboto Mono", monospace',
    fontSize: 13,
    lineHeight: 1.8,
    color: '#444',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    marginBottom: 24,
    '& .MuiTabs-indicator': {
        backgroundColor: '#00BFFF',
        height: 3,
        borderRadius: 2,
    },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'none',
    color: '#888',
    '&.Mui-selected': {
        color: '#00BFFF',
    },
}));

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

        if (!currentWeight || currentWeightNum <= 0) {
            setCurrentWeightError('Please enter a valid weight');
            setResults(null);
            return;
        }

        if (!targetWeight || targetWeightNum <= 0) {
            setTargetWeightError('Please enter a valid weight');
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

        if (!advCalories || cals <= 0) {
            setAdvCaloriesError('Please enter a valid calorie target');
            setAdvResults(null);
            return;
        }

        if (!advTargetWeight || tw <= 0) {
            setAdvTargetWeightError('Please enter a valid target weight');
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
                    backgroundColor: '#ffffff',
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

    const renderMacroRow = (label: string, value: number, unit: string, showBorder: boolean = true) => (
        <Box sx={{ mb: showBorder ? 1.5 : 0, pb: showBorder ? 1.5 : 0, borderBottom: showBorder ? '1px solid rgba(0,0,0,0.1)' : 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#333333', fontWeight: 700 }}>
                    {label}
                </Typography>
                <Typography sx={{ color: '#00BFFF', fontWeight: 700, fontSize: 18 }}>
                    {value}{' '}
                    <Box component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                        {unit}
                    </Box>
                </Typography>
            </Box>
        </Box>
    );

    const renderResultsBlock = (data: MacroResults) => (
        <>
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 700,
                    color: '#000000',
                    mb: 2.5,
                    fontSize: 22,
                    textAlign: 'center',
                }}
            >
                Your Macro Split
            </Typography>
            {renderMacroRow('Total Calories', data.totalCalories, 'kcal')}
            {renderMacroRow('Protein', data.protein, 'g')}
            {renderMacroRow('Carbs', data.carbs, 'g')}
            {renderMacroRow('Fat', data.fat, 'g', false)}
        </>
    );

    const renderAdvancedMathBreakdown = () => {
        if (!advResults) return null;

        const cals = parseFloat(advCalories);
        const tw = parseFloat(advTargetWeight);
        const fatMultiplier = fatPercent / 100;

        return (
            <MathBox>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#000', mb: 1.5, fontFamily: 'inherit' }}>
                    How it's calculated
                </Typography>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: '#00BFFF', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Protein
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: '#444' }}>
                        {tw} lbs × {proteinRatio} g/lb = <strong>{advResults.protein}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: '#00BFFF', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Fat
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: '#444' }}>
                        ({cals} cal × {fatPercent}%) / 9 kcal/g = <strong>{advResults.fat}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, color: '#00BFFF', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Carbs
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: '#444' }}>
                        ({cals} cal − {advResults.fat}g fat × 9 kcal/g − {advResults.protein}g pro × 4 kcal/g) / 4 kcal/g = <strong>{advResults.carbs}g</strong>
                    </Typography>
                </Box>

                <Box sx={{ pt: 1, borderTop: '1px solid #ddd' }}>
                    <Typography sx={{ fontSize: 13, color: '#00BFFF', fontWeight: 700, mb: 0.5, fontFamily: 'inherit' }}>
                        Verification
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: '"Roboto Mono", monospace', color: '#444' }}>
                        {advResults.protein}g × 4 kcal/g + {advResults.carbs}g × 4 kcal/g + {advResults.fat}g × 9 kcal/g = <strong>{advResults.totalCalories} kcal</strong>
                    </Typography>
                </Box>
            </MathBox>
        );
    };

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 120px)',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 2,
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <StyledPaper>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <img
                            src="/assets/logo.png"
                            alt="FIT 9to5 Logo"
                            style={{
                                maxWidth: 200,
                                height: 'auto',
                                display: 'block',
                                margin: '0 auto 20px',
                                borderRadius: '50%',
                            }}
                        />
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: '#000000',
                                mb: 1,
                                fontSize: 28,
                            }}
                        >
                            💪 Macro Calculator
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#333333',
                                mb: 1,
                                fontSize: 14,
                            }}
                        >
                            Calculate your personalized macronutrient split
                        </Typography>
                    </Box>

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

                                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                                    <FormLabel
                                        component="legend"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: '#000000',
                                            mb: 1,
                                        }}
                                    >
                                        Gainer Type
                                    </FormLabel>
                                    <RadioGroup
                                        row
                                        name="gainerType"
                                        value={gainerType}
                                        onChange={(e) => setGainerType(e.target.value)}
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            flexWrap: 'wrap',
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
                                </FormControl>

                                {results && (
                                    <ResultsBox ref={resultsRef}>
                                        {renderResultsBlock(results)}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<ShareOutlinedIcon />}
                                                onClick={handleShare}
                                                sx={{
                                                    borderRadius: 18,
                                                    borderColor: '#00BFFF',
                                                    color: '#00BFFF',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    px: 3,
                                                    '&:hover': {
                                                        borderColor: '#00BFFF',
                                                        backgroundColor: 'rgba(0, 191, 255, 0.06)',
                                                    },
                                                }}
                                            >
                                                Share
                                            </Button>
                                        </Box>
                                    </ResultsBox>
                                )}
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
                                            color: '#000000',
                                            mb: 0.5,
                                        }}
                                    >
                                        Protein Ratio
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: '#888', mb: 1 }}>
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
                                                color: '#00BFFF',
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
                                                color: '#00BFFF',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {proteinRatio.toFixed(2)} g/lb
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: '#000000',
                                            mb: 0.5,
                                        }}
                                    >
                                        Fat Percentage
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: '#888', mb: 1 }}>
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
                                                color: '#00BFFF',
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
                                                color: '#00BFFF',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {fatPercent}%
                                        </Typography>
                                    </Box>
                                </Box>

                                {advResults && (
                                    <ResultsBox ref={resultsRef}>
                                        {renderResultsBlock(advResults)}
                                        {renderAdvancedMathBreakdown()}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<ShareOutlinedIcon />}
                                                onClick={handleShare}
                                                sx={{
                                                    borderRadius: 18,
                                                    borderColor: '#00BFFF',
                                                    color: '#00BFFF',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    px: 3,
                                                    '&:hover': {
                                                        borderColor: '#00BFFF',
                                                        backgroundColor: 'rgba(0, 191, 255, 0.06)',
                                                    },
                                                }}
                                            >
                                                Share
                                            </Button>
                                        </Box>
                                    </ResultsBox>
                                )}
                            </Box>
                    )}
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={2500}
                        onClose={() => setSnackbarOpen(false)}
                        message="Link copied!"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    />
                </StyledPaper>
            </Container>
        </Box>
    );
};

export default Macros;

