import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Store as StoreIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

const ReceiptCard = ({ 
  receipt, 
  onEdit, 
  onDelete, 
  onShare, 
  onDownload,
  onClick,
  showActions = true,
  compact = false 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action, event) => {
    event?.stopPropagation();
    handleMenuClose();
    action?.(receipt);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'needs correction':
        return 'warning';
      case 'processing':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        } : {},
        mb: compact ? 1 : 2,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Receipt Icon/Image */}
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              width: compact ? 40 : 48,
              height: compact ? 40 : 48,
            }}
          >
            {receipt.image ? (
              <img 
                src={receipt.image} 
                alt="Receipt" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <ReceiptIcon />
            )}
          </Avatar>

          {/* Receipt Details */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant={compact ? "subtitle2" : "h6"} 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {receipt.merchant || 'Unknown Merchant'}
              </Typography>
              
              {receipt.status && (
                <Chip
                  label={receipt.status}
                  size="small"
                  color={getStatusColor(receipt.status)}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Amount */}
            <Typography 
              variant={compact ? "h6" : "h5"} 
              color="primary" 
              sx={{ fontWeight: 700, mb: compact ? 1 : 1.5 }}
            >
              {formatAmount(receipt.total)}
            </Typography>

            {/* Date and Category */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(receipt.date)}
                </Typography>
              </Box>
              
              {receipt.category && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {receipt.category}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Items preview (for non-compact view) */}
            {!compact && receipt.items && receipt.items.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Items ({receipt.items.length}):
                </Typography>
                <Typography variant="body2" sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {receipt.items.slice(0, 3).map(item => item.name).join(', ')}
                  {receipt.items.length > 3 && ` +${receipt.items.length - 3} more`}
                </Typography>
              </>
            )}
          </Box>

          {/* Actions Menu */}
          {showActions && (
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ alignSelf: 'flex-start' }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>

      {/* Quick Actions (for non-compact view) */}
      {!compact && showActions && (
        <CardActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button 
            size="small" 
            startIcon={<EditIcon />}
            onClick={(e) => handleAction(onEdit, e)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            startIcon={<ShareIcon />}
            onClick={(e) => handleAction(onShare, e)}
          >
            Share
          </Button>
        </CardActions>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={(e) => handleAction(onEdit, e)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Receipt
        </MenuItem>
        <MenuItem onClick={(e) => handleAction(onShare, e)}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={(e) => handleAction(onDownload, e)}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={(e) => handleAction(onDelete, e)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ReceiptCard;
