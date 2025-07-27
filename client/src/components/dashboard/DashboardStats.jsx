import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon = ReceiptIcon, 
  trend, 
  trendValue, 
  color = 'primary',
  onClick 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? (
      <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
    );
  };

  const getTrendColor = () => {
    return trend === 'up' ? 'success.main' : 'error.main';
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
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: `${color}.main` }}>
              {value}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            
            {(trend && trendValue) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {getTrendIcon()}
                <Typography 
                  variant="caption" 
                  sx={{ color: getTrendColor(), fontWeight: 500 }}
                >
                  {trendValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
          
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 40, height: 40 }}>
            <Icon fontSize="small" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardStats = ({ stats, onStatClick }) => {
  const defaultStats = {
    totalReceipts: { value: 0, trend: null, trendValue: null },
    totalSpent: { value: 0, trend: null, trendValue: null },
    avgTransaction: { value: 0, trend: null, trendValue: null },
    categories: { value: 0, trend: null, trendValue: null },
    ...stats
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Total Receipts"
          value={defaultStats.totalReceipts.value}
          subtitle="This month"
          icon={ReceiptIcon}
          trend={defaultStats.totalReceipts.trend}
          trendValue={defaultStats.totalReceipts.trendValue}
          color="primary"
          onClick={() => onStatClick?.('receipts')}
        />
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Total Spent"
          value={formatCurrency(defaultStats.totalSpent.value)}
          subtitle="This month"
          icon={AttachMoneyIcon}
          trend={defaultStats.totalSpent.trend}
          trendValue={defaultStats.totalSpent.trendValue}
          color="success"
          onClick={() => onStatClick?.('spending')}
        />
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Avg Transaction"
          value={formatCurrency(defaultStats.avgTransaction.value)}
          subtitle="Per receipt"
          icon={TrendingUpIcon}
          trend={defaultStats.avgTransaction.trend}
          trendValue={defaultStats.avgTransaction.trendValue}
          color="info"
          onClick={() => onStatClick?.('average')}
        />
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <StatCard
          title="Categories"
          value={defaultStats.categories.value}
          subtitle="Active"
          icon={CategoryIcon}
          trend={defaultStats.categories.trend}
          trendValue={defaultStats.categories.trendValue}
          color="warning"
          onClick={() => onStatClick?.('categories')}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardStats;
