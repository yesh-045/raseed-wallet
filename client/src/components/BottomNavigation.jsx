import React from 'react';
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptsIcon,
  Insights as InsightsIcon,
  SmartToy as AgentIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/receipts') return 1;
    if (path === '/insights') return 2;
    if (path === '/agent') return 3;
    if (path.startsWith('/wallet')) return 4;
    return 0;
  };

  const handleNavigation = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/receipts');
        break;
      case 2:
        navigate('/insights');
        break;
      case 3:
        navigate('/agent');
        break;
      case 4:
        navigate('/wallet');
        break;
      default:
        break;
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider'
      }} 
      elevation={3}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={handleNavigation}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main'
            }
          }
        }}
      >
        <BottomNavigationAction 
          label="Dashboard" 
          icon={<DashboardIcon />} 
        />
        <BottomNavigationAction 
          label="Receipts" 
          icon={<ReceiptsIcon />} 
        />
        <BottomNavigationAction 
          label="Insights" 
          icon={<InsightsIcon />} 
        />
        <BottomNavigationAction 
          label="Agent" 
          icon={<AgentIcon />} 
        />
        <BottomNavigationAction 
          label="Wallet" 
          icon={<WalletIcon />} 
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;
