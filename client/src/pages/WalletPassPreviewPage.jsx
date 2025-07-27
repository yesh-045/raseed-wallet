import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  QrCode as QrCodeIcon,
  Receipt as ReceiptIcon,
  TrendingUp as SummaryIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageContainer } from '../components';

const WalletPassPreviewPage = () => {
  const navigate = useNavigate();
  const { passId } = useParams();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get pass data from navigation state or mock data
  const passData = location.state?.passData || {
    id: passId,
    title: 'Sample Wallet Pass',
    type: 'receipts',
    timestamp: '2024-01-15T10:30:00Z',
    walletID: 'gw_sample_001',
    dynamic: false,
  };

  const getPassIcon = (type) => {
    const icons = {
      receipts: ReceiptIcon,
      summaries: SummaryIcon,
      lists: ListIcon,
    };
    return icons[type] || ReceiptIcon;
  };

  const getPassColor = (type) => {
    const colors = {
      receipts: '#1A73E8',
      summaries: '#26A69A',
      lists: '#F9AB00',
    };
    return colors[type] || '#757575';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const handleRefresh = async () => {
    if (!passData.dynamic) {
      setSnackbar({
        open: true,
        message: 'This pass is static and cannot be refreshed',
        severity: 'info',
      });
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await refreshWalletPass(passData.id);
      
      setSnackbar({
        open: true,
        message: 'Pass refreshed successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh pass',
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    try {
      // TODO: Replace with actual API call
      // await deleteWalletPass(passData.id);
      
      setSnackbar({
        open: true,
        message: 'Pass deleted successfully',
        severity: 'success',
      });
      
      // Navigate back after deletion
      setTimeout(() => {
        navigate('/wallet');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete pass',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: passData.title,
          text: `Check out this wallet pass: ${passData.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setSnackbar({
          open: true,
          message: 'Pass link copied to clipboard',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to share pass',
        severity: 'error',
      });
    }
  };

  const IconComponent = getPassIcon(passData.type);
  const passColor = getPassColor(passData.type);

  const renderPassContent = () => {
    switch (passData.type) {
      case 'receipts':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {passData.merchant || 'Unknown Merchant'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {passData.amount || '$0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {passData.location || 'Unknown Location'}
            </Typography>
          </Box>
        );
      
      case 'summaries':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {passData.period || 'Unknown Period'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {passData.total || '$0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {passData.change || 'No change data'}
            </Typography>
          </Box>
        );
      
      case 'lists':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {passData.category || 'General List'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {passData.items || 0} Items
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI Generated List
            </Typography>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1">
              Wallet Pass Preview
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 8
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
              onClick={() => navigate('/wallet')} 
              edge="start"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Wallet Pass
            </Typography>
          </Box>
          
          <IconButton onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <PageContainer maxWidth="sm">
        <Box sx={{ pt: 3 }}>
          {/* Wallet Pass Card */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${passColor} 0%, ${passColor}CC 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  }}
                >
                  <IconComponent sx={{ fontSize: 24 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5
                    }}
                  >
                    {passData.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ opacity: 0.9 }}
                  >
                    {formatDate(passData.timestamp)}
                  </Typography>
                </Box>
                {passData.dynamic && (
                  <Chip 
                    label="Live" 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                )}
              </Box>

              {renderPassContent()}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <QrCodeIcon sx={{ fontSize: 64, opacity: 0.4 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Pass Metadata */}
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
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Pass Information
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pass ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {passData.id}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Wallet ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {passData.walletID}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {passData.type}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Updates
                  </Typography>
                  <Typography variant="body2">
                    {passData.dynamic ? 'Auto-updating' : 'Static'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Stack spacing={2}>
            
            
            <Stack direction="row" spacing={2}>
              {passData.dynamic && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                  }}
                >
                  Refresh
                </Button>
              )}
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                color="error"
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                }}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </Box>
      </PageContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
    </Box>
  );
};

export default WalletPassPreviewPage;
