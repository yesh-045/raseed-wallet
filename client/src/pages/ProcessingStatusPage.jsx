import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Alert,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Psychology as AIIcon,

  AutoAwesome as ProcessingIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getProcessingStatus } from '../services/api';

const ProcessingStatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get files from location state first
  const files = location.state?.files || [];
  
  const [activeStep, setActiveStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [fileStatuses, setFileStatuses] = useState(files.map(() => 'processing'));
  
  // Define steps first before calculating progress
  const steps = [
    {
      label: 'File Upload',
      description: 'Your receipts have been uploaded successfully',
      icon: <UploadIcon />,
      status: 'completed'
    },
    {
      label: 'OCR Processing',
      description: 'Extracting text and data from your receipts',
      icon: <ProcessingIcon />,
      status: 'in-progress'
    },
    {
      label: 'AI Analysis',
      description: 'AI is analyzing and categorizing your receipt data',
      icon: <AIIcon />,
      status: 'pending'
    },
    {
      label: 'Data Extraction Complete',
      description: 'Ready for your review and confirmation',
      icon: <CheckIcon />,
      status: 'pending'
    }
  ];
  
  // Calculate global progress
  const globalProgress = (activeStep / steps.length) * 100;

  const [stepStatuses, setStepStatuses] = useState(steps.map(step => step.status));

  useEffect(() => {
    // Start processing simulation and real status checking
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update file statuses progressively (simulate per-file completion)
        if (i === steps.length - 1) {
          setFileStatuses(prev => prev.map(() => 'completed'));
        }
        
        setStepStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[i] = 'completed';
          if (i < steps.length - 1) {
            newStatuses[i + 1] = 'in-progress';
          }
          return newStatuses;
        });
        
        // Add delay before updating active step for smoother animation
        await new Promise(resolve => setTimeout(resolve, 300));
        setActiveStep(i + 1);
      }
      
      setProcessingComplete(true);
      
      // Auto-redirect after completion with short delay
      setTimeout(() => {
        navigate('/receipt-review', { 
          state: { 
            files: files,
            extractedData: {
              // Stub extracted data from AI processing
              merchant: 'Starbucks Coffee',
              date: '2024-01-15',
              time: '14:30',
              total: '15.47',
              category: 'Coffee & Dining',
              paymentMethod: 'Credit Card',
              location: '123 Main Street, Downtown',
              items: [
                { name: 'Grande Latte', quantity: 1, price: '5.25' },
                { name: 'Blueberry Scone', quantity: 1, price: '3.95' },
                { name: 'Americano', quantity: 2, price: '3.14' }
              ],
              tax: '1.23',
              tip: '1.90'
            }
          }
        });
      }, 2000);
    };

    // Start the processing simulation
    processSteps();

    // Poll for real processing status if we have files
    let statusInterval;
    if (files.length > 0) {
      statusInterval = setInterval(async () => {
        try {
          for (const file of files) {
            if (file.id) {
              const status = await getProcessingStatus(file.id);
              console.log(`Processing status for ${file.name}:`, status);
              
              // Update file status based on backend response
              if (status.status === 'completed') {
                setFileStatuses(prev => 
                  prev.map((_, index) => 
                    files[index].id === file.id ? 'completed' : prev[index]
                  )
                );
              }
            }
          }
        } catch (error) {
          console.warn('Failed to check processing status:', error);
        }
      }, 5000); // Check every 5 seconds
    }

    // Cleanup interval on component unmount
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [navigate, files]);

  const getStepIcon = (index) => {
    const status = stepStatuses[index];
    if (status === 'completed') {
      return <CheckIcon sx={{ color: 'success.main' }} />;
    }
    return steps[index].icon;
  };

  const getStepColor = (index) => {
    const status = stepStatuses[index];
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Global Progress Bar */}
      {!processingComplete && (
        <LinearProgress 
          variant="determinate" 
          value={globalProgress}
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            height: 4
          }} 
        />
      )}
      
      <Container maxWidth="md" sx={{ py: 4, pb: isMobile ? 12 : 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            Processing Your Receipts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we process your receipts and generate wallet passes
          </Typography>
        </Box>

        {/* Files Being Processed */}
        <Card elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Files Being Processed
            </Typography>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < files.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2">{file.name || `Receipt ${index + 1}`}</Typography>
                <Chip
                  label={fileStatuses[index] === 'completed' ? 'Completed' : 'Processing'}
                  size="small"
                  color={fileStatuses[index] === 'completed' ? 'success' : 'primary'}
                  variant="outlined"
                />
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Processing Steps */}
        <Card elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Processing Status
            </Typography>
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} completed={stepStatuses[index] === 'completed'}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: stepStatuses[index] === 'completed' ? 'success.main' : 
                                         stepStatuses[index] === 'in-progress' ? 'primary.main' : 'grey.300',
                          color: 'white',
                          mr: 2
                        }}
                      >
                        {getStepIcon(index)}
                      </Box>
                    )}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                    {stepStatuses[index] === 'in-progress' && (
                      <LinearProgress sx={{ mb: 2, height: 6, borderRadius: 3 }} />
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Completion Status */}
        {processingComplete && (
          <Card elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Data extraction completed! Ready for your review...
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/receipt-review', { 
                    state: { 
                      files: files,
                      extractedData: {
                        merchant: 'Starbucks Coffee',
                        date: '2024-01-15',
                        time: '14:30',
                        total: '15.47',
                        category: 'Coffee & Dining',
                        paymentMethod: 'Credit Card',
                        location: '123 Main Street, Downtown',
                        items: [
                          { name: 'Grande Latte', quantity: 1, price: '5.25' },
                          { name: 'Blueberry Scone', quantity: 1, price: '3.95' },
                          { name: 'Americano', quantity: 2, price: '3.14' }
                        ],
                        tax: '1.23',
                        tip: '1.90'
                      }
                    }
                  })}
                >
                  Review Data Now
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Real-time Updates - Only show during processing */}
        {!processingComplete && (
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Processing in Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your receipts are being processed. This usually takes 30-60 seconds.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Remove Bottom Navigation during processing flow */}
    </Box>
  );
};

export default ProcessingStatusPage;
