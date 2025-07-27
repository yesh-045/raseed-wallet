import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const WelcomePage = () => {
  const { signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (currentUser) {
        navigate('/dashboard');
        return;
      }
      setIsCheckingSession(false);
    };
    
    checkAuth();
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking session
  if (isCheckingSession) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={40} sx={{ color: '#1A73E8' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        {/* Logo */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Google Sans, Roboto, sans-serif',
              fontWeight: 700,
              color: '#1A73E8',
              mb: 1,
            }}
          >
            Raseed
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'Google Sans, Roboto, sans-serif',
              color: 'text.secondary',
              fontSize: '0.875rem',
            }}
          >
            Powered by Google Wallet APIs
          </Typography>
        </Box>
        <img src={logo} alt="Raseed Logo" style={{ width: '170px', marginBottom: '10px' }} />
        
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            {error}
          </Alert>
        )}

        {/* Primary Authentication Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 500,
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#1A73E8',
            color: 'white',
            fontFamily: 'Google Sans, Roboto, sans-serif',
            maxWidth: 280,
            width: '100%',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1557B0',
              boxShadow: 'none',
            },
            '&:disabled': {
              bgcolor: '#E0E0E0',
              color: '#9E9E9E',
            },
          }}
        >
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        {/* Footer Text */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            mt: 4,
            display: 'block',
            lineHeight: 1.4,
            maxWidth: 320,
            mx: 'auto',
            fontSize: '0.75rem',
          }}
        >
          By continuing, you agree to our Privacy Policy. Data is securely synced to your Google account.
        </Typography>
      </Container>
    </Box>
  );
};

export default WelcomePage;
