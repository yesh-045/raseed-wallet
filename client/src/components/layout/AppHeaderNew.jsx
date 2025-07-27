import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AppHeader = ({ 
  title = 'Raseed', 
  showBackButton = false, 
  showMenuButton = true,
  onBackClick,
  elevation = 0 
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={elevation} 
      sx={{ 
        backgroundColor: 'background.paper', 
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        {showBackButton ? (
          <IconButton 
            edge="start" 
            onClick={handleBackClick} 
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        ) : showMenuButton ? (
          <IconButton edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        ) : null}
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontFamily: 'Google Sans, Roboto, sans-serif',
            fontWeight: 500,
            color: title === 'Raseed' ? '#1A73E8' : 'text.primary'
          }}
        >
          {title}
        </Typography>
        
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#1A73E8',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          U
        </Avatar>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
