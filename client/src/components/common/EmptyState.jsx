import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  InboxOutlined as InboxIcon,
  CloudUpload as CloudUploadIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const EmptyState = ({ 
  icon: Icon = InboxIcon,
  title = 'No data found',
  description = 'Get started by adding some content.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  image,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 48,
          padding: 3,
          titleVariant: 'subtitle1',
          bodyVariant: 'body2',
        };
      case 'large':
        return {
          iconSize: 80,
          padding: 6,
          titleVariant: 'h4',
          bodyVariant: 'body1',
        };
      default: // medium
        return {
          iconSize: 64,
          padding: 4,
          titleVariant: 'h6',
          bodyVariant: 'body2',
        };
    }
  };

  const styles = getSizeStyles();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: size === 'large' ? 400 : size === 'small' ? 200 : 300,
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: styles.padding,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          bgcolor: 'transparent',
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image}
            alt={title}
            sx={{
              width: styles.iconSize * 1.5,
              height: styles.iconSize * 1.5,
              mb: 2,
              opacity: 0.8,
            }}
          />
        ) : (
          <Icon 
            sx={{ 
              fontSize: styles.iconSize, 
              color: 'text.secondary', 
              mb: 2,
              opacity: 0.7,
            }} 
          />
        )}
        
        <Typography 
          variant={styles.titleVariant} 
          sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant={styles.bodyVariant} 
          color="text.secondary" 
          sx={{ mb: 3, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
        
        {(actionLabel || secondaryActionLabel) && (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            {actionLabel && (
              <Button
                variant="contained"
                onClick={onAction}
                startIcon={<AddIcon />}
                size={size === 'small' ? 'small' : 'medium'}
              >
                {actionLabel}
              </Button>
            )}
            
            {secondaryActionLabel && (
              <Button
                variant="outlined"
                onClick={onSecondaryAction}
                size={size === 'small' ? 'small' : 'medium'}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Predefined empty states for common scenarios
export const EmptyReceipts = (props) => (
  <EmptyState
    icon={ReceiptIcon}
    title="No receipts yet"
    description="Upload your first receipt to start tracking your expenses and get AI-powered insights."
    actionLabel="Upload Receipt"
    {...props}
  />
);

export const EmptyUploads = (props) => (
  <EmptyState
    icon={CloudUploadIcon}
    title="Ready to upload"
    description="Drag and drop your receipt images or PDFs here to get started with automatic extraction."
    actionLabel="Choose Files"
    {...props}
  />
);

export const EmptySearch = (props) => (
  <EmptyState
    icon={InboxIcon}
    title="No results found"
    description="Try adjusting your search criteria or upload more receipts."
    secondaryActionLabel="Clear Search"
    size="small"
    {...props}
  />
);

export default EmptyState;
