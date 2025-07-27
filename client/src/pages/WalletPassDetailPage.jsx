import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Snackbar,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  AccountBalanceWallet as WalletIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  TrendingUp as InsightsIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageContainer, BottomNavigation } from '../components';

const WalletPassDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);

  // Get confirmed data from receipt review or fallback to mock data
  const confirmedData = location.state?.confirmedData;
  const readyForWallet = location.state?.readyForWallet;

  // Use confirmed data if available, otherwise use mock data
  const receiptData = confirmedData ? {
    id: 1,
    merchant: confirmedData.merchant,
    amount: `$${confirmedData.total}`,
    date: confirmedData.date,
    time: confirmedData.time,
    location: confirmedData.location,
    items: confirmedData.items.map(item => ({
      name: `${item.name} (x${item.quantity})`,
      price: `$${item.price}`
    })).concat([
      { name: 'Tax', price: `$${confirmedData.tax}` },
      { name: 'Tip', price: `$${confirmedData.tip}` }
    ]),
    paymentMethod: confirmedData.paymentMethod,
    categoryColor: getCategoryColor(confirmedData.category),
  } : {
    // Fallback mock data
    id: 1,
    merchant: 'Starbucks',
    amount: '$15.47',
    date: '2024-01-15',
    time: '10:30 AM',
    location: '123 Main St, Seattle, WA',
    items: [
      { name: 'Grande Latte', price: '$5.25' },
      { name: 'Blueberry Muffin', price: '$3.95' },
      { name: 'Americano', price: '$4.45' },
      { name: 'Tax', price: '$1.82' }
    ],
    paymentMethod: 'Card ending in 4532',
    categoryColor: '#00704A',
  };

  // Helper function to get category colors
  function getCategoryColor(category) {
    const colors = {
      'Coffee & Dining': '#00704A',
      'Groceries': '#0F9D58', 
      'Transportation': '#4285F4',
      'Retail': '#DB4437',
      'Entertainment': '#9C27B0',
      'Health & Fitness': '#FF9800',
      'Gas & Fuel': '#607D8B',
      'Other': '#757575'
    };
    return colors[category] || '#1A73E8';
  }

  const handleAddToWallet = async () => {
    try {
      setIsAddingToWallet(true);
      
      // Show loading state
      setSnackbar({
        open: true,
        message: 'Adding to Google Wallet...',
        severity: 'info',
      });

      // 1. Add to Google Wallet (backend call)
      // TODO: Replace with actual backend API call
      // await addToGoogleWallet(receiptData);
      
      // Simulate backend call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 2. Save to receipts for reference
      // TODO: Replace with actual backend API call
      // await saveReceiptToDatabase(receiptData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Added to Google Wallet & saved to receipts!',
        severity: 'success',
      });

      // 3. Navigate to receipts after a short delay
      setTimeout(() => {
        navigate('/receipts', {
          state: {
            newReceipt: receiptData,
            fromWallet: true
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Error adding to wallet:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add to wallet. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsAddingToWallet(false);
    }
  };

  const handleSaveToReceipts = () => {
    // Navigate to receipts overview
    navigate('/receipts');
  };

  const handleViewInsights = () => {
    // Navigate to spending insights
    navigate('/insights');
  };

  const handleShare = () => {
    setSnackbar({
      open: true,
      message: 'Receipt shared successfully!',
      severity: 'success',
    });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 14 // More space for fixed bottom button
    }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 100,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              edge="start"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {confirmedData ? 'Wallet Pass Preview' : 'Receipt Details'}
            </Typography>
          </Box>
          
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      <PageContainer maxWidth="sm" disablePadding={false}>
        
        
        <Box sx={{ pt: confirmedData ? 1 : 3 }}>
          {/* Receipt Pass Card */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${receiptData.categoryColor} 0%, ${receiptData.categoryColor}CC 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  }}
                >
                  <StoreIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {receiptData.merchant}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {receiptData.date}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      lineHeight: 1
                    }}
                  >
                    {receiptData.amount}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <QrCodeIcon sx={{ fontSize: { xs: 28, sm: 32 }, opacity: 0.4 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Secondary Actions - Collapsed */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              <Button
                size="small"
                startIcon={<InsightsIcon />}
                onClick={handleViewInsights}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                View insights
              </Button>
              
              {confirmedData && readyForWallet ? (
                <Button
                  size="small"
                  startIcon={<ReceiptIcon />}
                  onClick={handleSaveToReceipts}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  Save to receipts
                </Button>
              ) : (
                <Button
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  Share
                </Button>
              )}
            </Stack>
          </Box>

          {/* Receipt Details - Simplified */}
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                Details
              </Typography>
              
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {receiptData.time}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
                    {receiptData.location}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {receiptData.paymentMethod}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Items - Simplified */}
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                Items ({receiptData.items.length})
              </Typography>
              
              <Stack spacing={1}>
                {receiptData.items.map((item, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      py: 0.5
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 400,
                        flex: 1,
                        minWidth: 0,
                        pr: 2,
                        lineHeight: 1.4
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        flexShrink: 0
                      }}
                    >
                      {item.price}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {receiptData.amount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </PageContainer>

      {/* Fixed Primary Action Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Box sx={{ maxWidth: 'sm', mx: 'auto' }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<WalletIcon />}
            onClick={handleAddToWallet}
            disabled={isAddingToWallet}
            sx={{
              py: { xs: 1.5, sm: 2 },
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              boxShadow: '0 2px 12px rgba(26, 115, 232, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(26, 115, 232, 0.4)',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            {isAddingToWallet ? 'Adding to Wallet...' : 'Add to Google Wallet'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <BottomNavigation />
    </Box>
  );
};

export default WalletPassDetailPage;
