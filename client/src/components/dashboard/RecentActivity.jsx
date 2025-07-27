import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

const RecentActivity = ({ 
  activities = [], 
  onViewAll, 
  onActivityClick,
  maxItems = 5,
  showHeader = true 
}) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <ReceiptIcon />;
      case 'edit':
        return <ReceiptIcon />;
      case 'merchant':
        return <StoreIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'upload':
        return 'primary';
      case 'edit':
        return 'info';
      case 'merchant':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Box>
      {showHeader && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Activity
          </Typography>
          {activities.length > maxItems && (
            <Button 
              endIcon={<ArrowForwardIcon />}
              size="small"
              onClick={onViewAll}
            >
              View All
            </Button>
          )}
        </Box>
      )}

      {displayActivities.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4,
          color: 'text.secondary'
        }}>
          <ReceiptIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            No recent activity
          </Typography>
          <Typography variant="caption">
            Upload your first receipt to get started
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayActivities.map((activity, index) => (
            <React.Fragment key={activity.id || index}>
              <ListItem
                sx={{
                  px: 0,
                  cursor: onActivityClick ? 'pointer' : 'default',
                  '&:hover': onActivityClick ? {
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  } : {},
                }}
                onClick={() => onActivityClick?.(activity)}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(activity.timestamp)}
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getActivityColor(activity.type)}.light`, 
                      color: `${getActivityColor(activity.type)}.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {activity.title}
                      </Typography>
                      {activity.status && (
                        <Chip 
                          label={activity.status} 
                          size="small" 
                          variant="outlined"
                          color={activity.status === 'completed' ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      {activity.amount && (
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                          ${activity.amount.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              
              {index < displayActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default RecentActivity;
