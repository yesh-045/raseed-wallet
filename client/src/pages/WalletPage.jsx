import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Chip,
  Avatar,
  InputBase,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Receipt as ReceiptIcon,
  TrendingUp as SummaryIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageContainer, BottomNavigation, GoogleWalletButton } from '../components';

const WalletPage = () => {
  const navigate = useNavigate();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock wallet passes data organized by type
  const walletPasses = {
    receipts: [
      {
        id: 'rcpt_001',
        title: 'Starbucks Receipt',
        timestamp: '2024-01-15T10:30:00Z',
        walletID: 'gw_rcpt_001',
        dynamic: false,
        amount: '$15.47',
        merchant: 'Starbucks',
        location: 'Times Square',
      },
      {
        id: 'rcpt_002',
        title: 'Target Shopping',
        timestamp: '2024-01-14T16:20:00Z',
        walletID: 'gw_rcpt_002',
        dynamic: false,
        amount: '$89.23',
        merchant: 'Target',
        location: 'Manhattan Store',
      }
    ],
    summaries: [
      {
        id: 'sum_001',
        title: 'Weekly Spending Summary',
        timestamp: '2024-01-15T00:00:00Z',
        walletID: 'gw_sum_001',
        dynamic: true,
        period: 'Jan 8-14, 2024',
        total: '$234.56',
        change: '+12%',
      },
      {
        id: 'sum_002',
        title: 'Monthly Budget Status',
        timestamp: '2024-01-01T00:00:00Z',
        walletID: 'gw_sum_002',
        dynamic: true,
        period: 'January 2024',
        total: '$1,247.89',
        change: '-3%',
      }
    ],
    lists: [
      {
        id: 'list_001',
        title: 'Coffee Shop Favorites',
        timestamp: '2024-01-10T12:00:00Z',
        walletID: 'gw_list_001',
        dynamic: false,
        items: 5,
        category: 'Recommendations',
      },
      {
        id: 'list_002',
        title: 'Weekly Shopping List',
        timestamp: '2024-01-14T09:00:00Z',
        walletID: 'gw_list_002',
        dynamic: true,
        items: 12,
        category: 'AI Generated',
      }
    ]
  };

  const passTypes = [
    { key: 'All', label: 'All', icon: WalletIcon },
    { key: 'receipts', label: 'Receipts', icon: ReceiptIcon },
    { key: 'summaries', label: 'Summaries', icon: SummaryIcon },
    { key: 'lists', label: 'Lists', icon: ListIcon },
  ];

  // Filter passes based on search and type
  const getFilteredPasses = () => {
    let allPasses = [];
    
    if (filterType === 'All') {
      Object.entries(walletPasses).forEach(([type, passes]) => {
        allPasses.push(...passes.map(pass => ({ ...pass, type })));
      });
    } else {
      allPasses = walletPasses[filterType]?.map(pass => ({ ...pass, type: filterType })) || [];
    }

    if (searchQuery) {
      allPasses = allPasses.filter(pass => 
        pass.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return allPasses;
  };

  const groupedPasses = () => {
    if (filterType !== 'All') {
      return { [filterType]: getFilteredPasses() };
    }

    const grouped = {};
    Object.keys(walletPasses).forEach(type => {
      const filtered = walletPasses[type].filter(pass => 
        !searchQuery || pass.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        grouped[type] = filtered.map(pass => ({ ...pass, type }));
      }
    });
    return grouped;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return diffHours === 0 ? 'Just now' : `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    }
  };

  const getPassIcon = (type) => {
    const icons = {
      receipts: ReceiptIcon,
      summaries: SummaryIcon,
      lists: ListIcon,
    };
    return icons[type] || WalletIcon;
  };

  const getPassColor = (type) => {
    const colors = {
      receipts: '#1A73E8',
      summaries: '#26A69A',
      lists: '#F9AB00',
    };
    return colors[type] || '#757575';
  };

  const handlePassClick = (pass) => {
    // Navigate to pass preview page
    navigate(`/wallet/${pass.id}`, { state: { passData: pass } });
  };

  const handleMenuOpen = (event, pass) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPass(pass);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPass(null);
  };

  const handleRefreshPass = async () => {
    try {
      // TODO: Replace with actual API call
      // await refreshWalletPass(selectedPass.id);
      
      setSnackbar({
        open: true,
        message: `${selectedPass.title} refreshed successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh pass',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleDeletePass = async () => {
    try {
      // TODO: Replace with actual API call
      // await deleteWalletPass(selectedPass.id);
      
      setSnackbar({
        open: true,
        message: `${selectedPass.title} deleted from wallet`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete pass',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleUpdateAll = async () => {
    setIsRefreshing(true);
    try {
      // TODO: Replace with actual Google Wallet API sync
      // await syncAllWalletPasses();
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setSnackbar({
        open: true,
        message: 'All passes synced with Google Wallet',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to sync passes',
        severity: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddNewPass = () => {
    // Navigate to AI agent for pass creation
    navigate('/agent', { 
      state: { 
        context: 'create_wallet_pass',
        message: 'What type of wallet pass would you like to create?'
      }
    });
  };

  const renderPassCard = (pass) => {
    const IconComponent = getPassIcon(pass.type);
    const color = getPassColor(pass.type);

    return (
      <Card
        key={pass.id}
        elevation={0}
        onClick={() => handlePassClick(pass)}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-1px)',
            boxShadow: 1,
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: color,
                color: 'white',
              }}
            >
              <IconComponent sx={{ fontSize: 20 }} />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {pass.title}
                </Typography>
                
                <IconButton 
                  size="small" 
                  onClick={(e) => handleMenuOpen(e, pass)}
                  sx={{ ml: 1, mt: -0.5 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                {formatTimestamp(pass.timestamp)}
                {pass.dynamic && (
                  <Chip 
                    label="Auto-updating" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      ml: 1, 
                      height: 18, 
                      fontSize: '0.65rem',
                      borderColor: color,
                      color: color,
                    }} 
                  />
                )}
              </Typography>

              {/* Type-specific details */}
              {pass.type === 'receipts' && (
                <Typography variant="body2" color="text.secondary">
                  {pass.merchant} • {pass.amount}
                </Typography>
              )}
              
              {pass.type === 'summaries' && (
                <Typography variant="body2" color="text.secondary">
                  {pass.period} • {pass.total} ({pass.change})
                </Typography>
              )}
              
              {pass.type === 'lists' && (
                <Typography variant="body2" color="text.secondary">
                  {pass.items} items • {pass.category}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 10 
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
            px: 2,
            py: 2,
            gap: 2,
          }}
        >
          <IconButton
            onClick={() => navigate('/dashboard')}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ fontWeight: 500, flex: 1 }}>
            Wallet Passes
          </Typography>
          
          <IconButton 
            size="small"
            onClick={() => setSearchExpanded(!searchExpanded)}
          >
            <SearchIcon />
          </IconButton>
          
          <IconButton 
            size="small"
            onClick={handleUpdateAll}
            disabled={isRefreshing}
          >
            <UpdateIcon sx={{ 
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              }
            }} />
          </IconButton>
        </Box>

        {/* Expandable Search Bar */}
        {searchExpanded && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'grey.100',
                borderRadius: '24px',
                px: 2,
                py: 1,
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search wallet passes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1 }}
                autoFocus
              />
            </Box>
          </Box>
        )}

        {/* Type Filter Chips */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            {passTypes.map((type) => (
              <Chip
                key={type.key}
                label={type.label}
                variant={filterType === type.key ? 'filled' : 'outlined'}
                onClick={() => setFilterType(type.key)}
                sx={{
                  borderRadius: '16px',
                  '&.MuiChip-filled': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      <PageContainer>
        {/* Google Wallet Integration Test Section */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <WalletIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Google Wallet Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test our new Google Wallet pass creation feature
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <GoogleWalletButton
                passType="test"
                variant="contained"
                size="medium"
                onSuccess={(result) => {
                  setSnackbar({
                    open: true,
                    message: 'Test pass created successfully!',
                    severity: 'success'
                  });
                }}
                onError={(error) => {
                  setSnackbar({
                    open: true,
                    message: `Error: ${error}`,
                    severity: 'error'
                  });
                }}
              />
              
              <GoogleWalletButton
                passType="custom"
                passData={{
                  title: "Raseed Demo",
                  header: "Demo Pass",
                  description: "This is a demo pass showcasing Raseed's Google Wallet integration capabilities.",
                  barcode_value: "DEMO-2025-001",
                  background_color: "#1A73E8",
                  app_link_url: "https://raseed.app"
                }}
                variant="outlined"
                size="medium"
                onSuccess={(result) => {
                  setSnackbar({
                    open: true,
                    message: 'Demo pass created successfully!',
                    severity: 'success'
                  });
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        {Object.keys(groupedPasses()).length === 0 ? (
          // Empty State
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            px: 3,
          }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <WalletIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
            
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
              {searchQuery ? 'No matching passes' : 'No wallet passes yet'}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: 280 }}
            >
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Create your first wallet pass using our AI assistant'
              }
            </Typography>

            {!searchQuery && (
              <Button
                variant="contained"
                onClick={handleAddNewPass}
                sx={{
                  borderRadius: '24px',
                  textTransform: 'none',
                  py: 1.5,
                  px: 3,
                }}
              >
                Create wallet pass
              </Button>
            )}
          </Box>
        ) : (
          // Passes List
          <Box sx={{ pt: 2 }}>
            {Object.entries(groupedPasses()).map(([type, passes]) => (
              <Box key={type} sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2, 
                    px: 1,
                    textTransform: 'capitalize'
                  }}
                >
                  {type} ({passes.length})
                </Typography>
                
                <Stack spacing={2}>
                  {passes.map(renderPassCard)}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </PageContainer>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={handleAddNewPass}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedPass?.dynamic && (
          <MenuItem onClick={handleRefreshPass}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Refresh" />
          </MenuItem>
        )}
        
        {selectedPass?.dynamic && <Divider />}
        
        <MenuItem onClick={handleDeletePass} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default WalletPage;
