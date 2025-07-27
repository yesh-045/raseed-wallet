import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const ErrorBoundary = ({ 
  error, 
  onRetry, 
  onGoHome,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  showHome = true 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <ErrorIcon 
          sx={{ 
            fontSize: 64, 
            color: 'error.main', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
        
        {error && process.env.NODE_ENV === 'development' && (
          <Box sx={{ 
            bgcolor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            mb: 3,
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: 200,
          }}>
            <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
              {error.toString()}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
          
          {showHome && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={onGoHome}
            >
              Go Home
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ErrorBoundary;
