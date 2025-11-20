import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Paper, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: 40,
    maxWidth: 500,
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
            opacity: 0,
            transform: 'translateY(-10px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
}));

interface MacroResults {
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
}

const Macros: React.FC = () => {
    const [currentWeight, setCurrentWeight] = useState<string>('');
    const [targetWeight, setTargetWeight] = useState<string>('');
    const [gainerType, setGainerType] = useState<string>('neutral');
    const [results, setResults] = useState<MacroResults | null>(null);
    const [currentWeightError, setCurrentWeightError] = useState<string>('');
    const [targetWeightError, setTargetWeightError] = useState<string>('');

    useEffect(() => {
        calculateMacros();
    }, [currentWeight, targetWeight, gainerType]);

    const calculateMacros = () => {
        // Reset errors
        setCurrentWeightError('');
        setTargetWeightError('');

        const currentWeightNum = parseFloat(currentWeight);
        const targetWeightNum = parseFloat(targetWeight);

        // Validate inputs
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

        // Calculate weight change
        const weightChange = targetWeightNum - currentWeightNum;

        // Determine base multiplier (starts at 14 for maintenance)
        let multiplier = 14;

        // Calculate adjustment based on weight change
        // Fluid adjustment: for every 5 lbs of change beyond 1 lb, adjust by ±1
        if (Math.abs(weightChange) > 1) {
            const adjustment = (Math.abs(weightChange) - 1) / 5;

            if (weightChange > 0) {
                // Gaining weight - increase multiplier
                multiplier += adjustment;
            } else {
                // Losing weight - decrease multiplier
                multiplier -= adjustment;
            }
        }

        // Adjust multiplier based on gainer type
        if (gainerType === 'easy') {
            multiplier -= 1;
        } else if (gainerType === 'hard') {
            multiplier += 1;
        }

        // Calculate initial total calories for macro calculations
        const initialCalories = Math.ceil(currentWeightNum * multiplier);

        // Calculate fat (grams, round up)
        const fat = Math.ceil((0.25 * initialCalories) / 9);

        // Calculate protein (grams, round up) - using target weight
        const protein = Math.ceil(targetWeightNum);

        // Calculate carbs (grams, round up)
        const carbs = Math.ceil((initialCalories - (fat * 9) - (protein * 4)) / 4);

        // Recalculate total calories from the rounded macros to ensure accuracy
        const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);

        setResults({
            totalCalories,
            protein,
            carbs,
            fat,
        });
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
                                mb: 3,
                                fontSize: 14,
                            }}
                        >
                            Calculate your personalized macronutrient split
                        </Typography>
                    </Box>

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
                        <Fade in={!!results}>
                            <ResultsBox>
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
                                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ color: '#333333', fontWeight: 700 }}>
                                            Total Calories
                                        </Typography>
                                        <Typography sx={{ color: '#00BFFF', fontWeight: 700, fontSize: 18 }}>
                                            {results.totalCalories}{' '}
                                            <Box component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                                                kcal
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ color: '#333333', fontWeight: 700 }}>
                                            Protein
                                        </Typography>
                                        <Typography sx={{ color: '#00BFFF', fontWeight: 700, fontSize: 18 }}>
                                            {results.protein}{' '}
                                            <Box component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                                                g
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ color: '#333333', fontWeight: 700 }}>
                                            Carbs
                                        </Typography>
                                        <Typography sx={{ color: '#00BFFF', fontWeight: 700, fontSize: 18 }}>
                                            {results.carbs}{' '}
                                            <Box component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                                                g
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ color: '#333333', fontWeight: 700 }}>
                                            Fat
                                        </Typography>
                                        <Typography sx={{ color: '#00BFFF', fontWeight: 700, fontSize: 18 }}>
                                            {results.fat}{' '}
                                            <Box component="span" sx={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
                                                g
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Box>
                            </ResultsBox>
                        </Fade>
                    )}
                </StyledPaper>
            </Container>
        </Box>
    );
};

export default Macros;

