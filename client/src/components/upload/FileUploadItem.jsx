import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const FileUploadItem = ({ 
  file, 
  onRemove, 
  showProgress = true,
  disabled = false 
}) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <ScheduleIcon color="primary" />;
      case 'processing':
        return <ScheduleIcon color="primary" />;
      default:
        return <ScheduleIcon color="disabled" />;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'uploading':
      case 'processing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading to Firebase...';
      case 'processing':
        return 'AI Processing...';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* File preview/icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {file.file?.type?.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file.file)}
                alt={file.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {file.file?.type?.includes('pdf') ? 'PDF' : 'FILE'}
              </Typography>
            )}
          </Box>

          {/* File details */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {file.name}
              </Typography>
              {getStatusIcon()}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
              <Chip
                label={getStatusText()}
                size="small"
                color={getStatusColor()}
                variant="outlined"
              />
              {file.firebaseId && (
                <Typography variant="caption" color="success.main">
                  • Uploaded
                </Typography>
              )}
            </Box>

            {/* Progress bar for processing */}
            {(file.status === 'uploading' || file.status === 'processing') && showProgress && (
              <LinearProgress
                variant="determinate"
                value={file.progress || 0}
                sx={{ mt: 1, height: 4, borderRadius: 2 }}
              />
            )}

            {/* Error message */}
            {file.status === 'failed' && file.error && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {file.error}
              </Typography>
            )}

            {/* Success info */}
            {file.status === 'completed' && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                  ✅ Receipt uploaded and sent for AI processing
                </Typography>
                {file.firebaseId && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    ID: {file.firebaseId.substring(0, 8)}...
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={() => onRemove?.(file.id)}
              disabled={disabled}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileUploadItem;
