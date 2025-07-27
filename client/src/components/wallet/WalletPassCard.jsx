import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Store as StoreIcon,
  QrCode as QrCodeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  LocalOffer as LocalOfferIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

const WalletPassCard = ({ 
  pass, 
  onAddToWallet, 
  onToggleFavorite, 
  onViewDetails,
  compact = false 
}) => {
  const getPassTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'loyalty':
        return <StarIcon />;
      case 'coupon':
        return <LocalOfferIcon />;
      case 'store':
        return <StoreIcon />;
      default:
        return <QrCodeIcon />;
    }
  };

  const getPassTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'loyalty':
        return 'warning';
      case 'coupon':
        return 'success';
      case 'store':
        return 'primary';
      default:
        return 'info';
    }
  };

  const formatExpiryDate = (date) => {
    if (!date) return null;
    const expiryDate = new Date(date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry === 0) return 'Expires today';
    if (daysUntilExpiry === 1) return 'Expires tomorrow';
    if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;
    
    return expiryDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: expiryDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getExpiryColor = (date) => {
    if (!date) return 'default';
    const expiryDate = new Date(date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'error';
    if (daysUntilExpiry <= 3) return 'error';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'success';
  };

  return (
    <Card 
      variant="outlined"
      sx={{
        cursor: onViewDetails ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        background: pass.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        '&:hover': onViewDetails ? {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        } : {},
        mb: compact ? 1 : 2,
      }}
      onClick={onViewDetails}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                width: compact ? 32 : 40,
                height: compact ? 32 : 40,
              }}
            >
              {pass.logo ? (
                <img 
                  src={pass.logo} 
                  alt={pass.organizationName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getPassTypeIcon(pass.passType)
              )}
            </Avatar>
            
            <Box>
              <Typography 
                variant={compact ? "subtitle2" : "h6"} 
                sx={{ fontWeight: 600, color: 'white' }}
              >
                {pass.organizationName || 'Business Pass'}
              </Typography>
              <Chip
                label={pass.passType || 'Generic'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(pass);
              }}
              sx={{ color: 'white' }}
            >
              {pass.isFavorite ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            
            <IconButton size="small" sx={{ color: 'white' }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'white' }}>
            {pass.primaryValue || pass.balance || '$0.00'}
          </Typography>
          
          {pass.secondaryValue && (
            <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
              {pass.secondaryValue}
            </Typography>
          )}
          
          {pass.description && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 1, 
                opacity: 0.8,
                color: 'white',
              }}
            >
              {pass.description}
            </Typography>
          )}
        </Box>

        {/* Progress for loyalty cards */}
        {pass.passType === 'loyalty' && pass.progress !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                Progress to next reward
              </Typography>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                {Math.round(pass.progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pass.progress}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                },
              }}
            />
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {pass.expiryDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 14, color: 'white', opacity: 0.8 }} />
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                  {formatExpiryDate(pass.expiryDate)}
                </Typography>
              </Box>
            )}
          </Box>
          
          {!pass.isInWallet && (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                onAddToWallet?.(pass);
              }}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Add to Wallet
            </Button>
          )}
          
          {pass.isInWallet && (
            <Chip
              label="In Wallet"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletPassCard;
