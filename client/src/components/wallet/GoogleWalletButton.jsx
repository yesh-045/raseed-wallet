import React, { useState } from 'react';
import {
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Google as GoogleIcon,
  QrCode as QrCodeIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';


/**
 * Google Wallet Button Component
 * Renders "Add to Google Wallet" button and handles pass creation
 */
const GoogleWalletButton = ({ 
  passType = 'receipt', 
  passData = null, 
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  showPreview = true,
  onSuccess = null,
  onError = null
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleCreatePass = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      
      switch (passType) {
        case 'receipt':
          if (!passData) {
            throw new Error('Receipt data is required for receipt pass');
          }
          response = await createReceiptPass(passData);
          break;
          
        case 'custom':
          if (!passData) {
            throw new Error('Pass data is required for custom pass');
          }
          response = await createCustomPass(passData);
          break;
          
        case 'test':
          response = await createTestPass();
          break;
          
        default:
          throw new Error('Invalid pass type');
      }

      if (response.success) {
        setResult(response);
        if (showPreview) {
          setPreviewOpen(true);
        } else {
          // Directly open the save link
          window.open(response.save_link, '_blank');
        }
        
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        throw new Error(response.error || 'Failed to create pass');
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to create Google Wallet pass';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWallet = () => {
    if (result?.save_link) {
      window.open(result.save_link, '_blank');
      setPreviewOpen(false);
    }
  };

  const getButtonText = () => {
    switch (passType) {
      case 'receipt':
        return 'Add Receipt to Wallet';
      case 'custom':
        return 'Add to Google Wallet';
      case 'test':
        return 'Create Test Pass';
      default:
        return 'Add to Google Wallet';
    }
  };

  const getButtonIcon = () => {
    switch (passType) {
      case 'receipt':
        return <ReceiptIcon />;
      case 'test':
        return <QrCodeIcon />;
      default:
        return <WalletIcon />;
    }
  };

  return (
    <Box>
      {/* Main Button */}
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleCreatePass}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : getButtonIcon()}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          '&.Mui-disabled': {
            bgcolor: 'grey.300',
          },
          borderRadius: 2,
          py: 1.5,
          px: 3,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {loading ? 'Creating Pass...' : getButtonText()}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      )}

      {/* Success Display (without preview) */}
      {result && !showPreview && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          icon={<CheckCircleIcon />}
        >
          Pass created successfully! Check your Google Wallet.
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GoogleIcon color="primary" />
            <Typography variant="h6">Google Wallet Pass Created</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body1" fontWeight={600}>
                  Pass created successfully!
                </Typography>
              </Stack>
              
              {result && (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Pass Type:
                    </Typography>
                    <Chip 
                      size="small" 
                      label={passType.charAt(0).toUpperCase() + passType.slice(1)}
                      color="primary"
                    />
                  </Box>
                  
                  {result.receipt_id && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Receipt ID:
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {result.receipt_id}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Object ID:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                      {result.object_id}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click the button below to add this pass to your Google Wallet. You can access it anytime from your phone or digital wallet.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreviewOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddToWallet}
            startIcon={<LaunchIcon />}
            sx={{
              bgcolor: '#4285f4',
              '&:hover': {
                bgcolor: '#3367d6',
              },
            }}
          >
            Add to Google Wallet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleWalletButton;
