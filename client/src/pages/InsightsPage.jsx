import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Restaurant as RestaurantIcon,
  LocalGasStation as GasIcon,
  ShoppingCart as ShoppingIcon,
  Coffee as CoffeeIcon,
  Analytics as AnalyticsIcon,
  Home as HomeIcon,
  FitnessCenter as FitnessIcon,
  Movie as EntertainmentIcon,
  MedicalServices as HealthIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import app from '../firebase';
import apiService from '../services/api';
import { AppHeader, PageContainer, BottomNavigation } from '../components';

const InsightsPage = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month');
  const [spendingData, setSpendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category icon mapping
  const getCategoryIcon = (category) => {
    const iconMap = {
      'restaurant': RestaurantIcon,
      'food': RestaurantIcon,
      'grocery': RestaurantIcon,
      'gas': GasIcon,
      'transport': GasIcon,
      'shopping': ShoppingIcon,
      'coffee': CoffeeIcon,
      'entertainment': EntertainmentIcon,
      'fitness': FitnessIcon,
      'health': HealthIcon,
      'utilities': HomeIcon,
      'default': ShoppingIcon
    };
    return iconMap[category.toLowerCase()] || iconMap.default;
  };

  // Category color mapping
  const getCategoryColor = (category) => {
    const colorMap = {
      'restaurant': '#1976d2',
      'food': '#1976d2',
      'grocery': '#1976d2',
      'gas': '#388e3c',
      'transport': '#388e3c',
      'shopping': '#f57c00',
      'coffee': '#d32f2f',
      'entertainment': '#9c27b0',
      'fitness': '#00acc1',
      'health': '#e91e63',
      'utilities': '#795548',
      'default': '#757575'
    };
    return colorMap[category.toLowerCase()] || colorMap.default;
  };

  // Fetch receipts and calculate insights
  const fetchSpendingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Set user ID for API service
      apiService.setUserId(user.uid);
      
      // Fetch receipts data
      const response = await fetch(`${apiService.baseURL}/receipts/${user.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }
      
      const data = await response.json();
      const receipts = data.receipts || [];
      
      // Calculate insights for different time ranges
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const processReceiptsForPeriod = (receipts, startDate, previousStartDate) => {
        // Filter receipts for current period
        const currentPeriodReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.timestamp || receipt.date);
          return receiptDate >= startDate && receiptDate <= now;
        });
        
        // Filter receipts for previous period (for comparison)
        const previousPeriodReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.timestamp || receipt.date);
          return receiptDate >= previousStartDate && receiptDate < startDate;
        });
        
        // Calculate totals
        const currentTotal = currentPeriodReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const previousTotal = previousPeriodReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        
        // Calculate percentage change
        let change = '+0%';
        let trend = 'stable';
        if (previousTotal > 0) {
          const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
          if (percentChange > 0) {
            change = `+${percentChange.toFixed(1)}%`;
            trend = 'up';
          } else if (percentChange < 0) {
            change = `${percentChange.toFixed(1)}%`;
            trend = 'down';
          }
        }
        
        // Group by category
        const categoryTotals = {};
        currentPeriodReceipts.forEach(receipt => {
          const category = receipt.category || 'other';
          categoryTotals[category] = (categoryTotals[category] || 0) + (receipt.total_amount || 0);
        });
        
        // Convert to array and sort by amount
        const categories = Object.entries(categoryTotals)
          .map(([name, amount]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            amount,
            percent: currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0,
            icon: getCategoryIcon(name),
            color: getCategoryColor(name)
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6); // Top 6 categories
        
        return {
          total: currentTotal,
          change,
          trend,
          categories,
          receiptCount: currentPeriodReceipts.length
        };
      };
      
      // Calculate data for both time ranges
      const weekData = processReceiptsForPeriod(
        receipts, 
        weekAgo, 
        new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      
      const monthData = processReceiptsForPeriod(
        receipts, 
        monthAgo, 
        new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
      );
      
      setSpendingData({
        week: weekData,
        month: monthData
      });
      
    } catch (err) {
      console.error('Error fetching spending data:', err);
      setError(err.message || 'Failed to load spending data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpendingData();
  }, []);

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const handleAdvancedInsights = () => {
    if (!spendingData) return;
    
    const currentData = spendingData[timeRange];
    if (!currentData) return;
    
    // Create serializable data without React components
    const serializableData = {
      total: currentData.total,
      change: currentData.change,
      trend: currentData.trend,
      categories: currentData.categories ? currentData.categories.map(cat => ({
        name: cat.name,
        amount: cat.amount,
        percent: cat.percent,
        color: cat.color
        // Remove icon component - not serializable
      })) : []
    };
    
    // Navigate to advanced insights page
    navigate('/insights/advanced', { 
      state: { 
        timeRange, 
        data: serializableData 
      } 
    });
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ pb: 8 }}>
        <PageContainer>
          <AppHeader 
            title="Spending Insights" 
            showBackButton={true}
            onBackClick={() => navigate('/dashboard')}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </PageContainer>
        <BottomNavigation />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ pb: 8 }}>
        <PageContainer>
          <AppHeader 
            title="Spending Insights" 
            showBackButton={true}
            onBackClick={() => navigate('/dashboard')}
          />
          <Box sx={{ py: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={fetchSpendingData} fullWidth>
              Retry
            </Button>
          </Box>
        </PageContainer>
        <BottomNavigation />
      </Box>
    );
  }

  // No data state
  if (!spendingData || !spendingData[timeRange]) {
    return (
      <Box sx={{ pb: 8 }}>
        <PageContainer>
          <AppHeader 
            title="Spending Insights" 
            showBackButton={true}
            onBackClick={() => navigate('/dashboard')}
          />
          <Box sx={{ py: 3 }}>
            <Alert severity="info">
              No spending data available for the selected time period.
            </Alert>
          </Box>
        </PageContainer>
        <BottomNavigation />
      </Box>
    );
  }

  const currentData = spendingData[timeRange];

  return (
    <Box sx={{ pb: 8 }}>
      <PageContainer>
        <AppHeader 
          title="Spending Insights" 
          showBackButton={true}
          onBackClick={() => navigate('/dashboard')}
        />

        <Box sx={{ py: 3 }}>
          {/* Time Range Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
              sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
            >
              <ToggleButton value="week" sx={{ px: 3 }}>
                This Week
              </ToggleButton>
              <ToggleButton value="month" sx={{ px: 3 }}>
                This Month
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Key Metrics Hero Card */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 300, mb: 1 }}>
                ₹{currentData.total.toFixed(2)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentData.trend === 'up' ? (
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                ) : currentData.trend === 'down' ? (
                  <TrendingDownIcon sx={{ fontSize: 20 }} />
                ) : null}
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {currentData.change} from last {timeRange}
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                Based on {currentData.receiptCount} receipt{currentData.receiptCount !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Categories
              </Typography>
              
              {currentData.categories.length > 0 ? (
                <List disablePadding>
                  {currentData.categories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <ListItem key={index} sx={{ px: 0, py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 48 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: category.color,
                              width: 36, 
                              height: 36 
                            }}
                          >
                            <IconComponent sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {category.name}
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ₹{category.amount.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={category.percent}
                                sx={{
                                  height: 4,
                                  borderRadius: 2,
                                  bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: category.color,
                                    borderRadius: 2,
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {category.percent}% of total
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No spending data available for this period
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card elevation={0} sx={{ borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {currentData.categories.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6}>
              <Card elevation={0} sx={{ borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    ₹{currentData.total > 0 ? (currentData.total / (timeRange === 'week' ? 7 : 30)).toFixed(0) : '0'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily Average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Advanced Insights Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AnalyticsIcon />}
            onClick={handleAdvancedInsights}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Advanced Insights
          </Button>
        </Box>
      </PageContainer>

      <BottomNavigation />
    </Box>
  );
};

export default InsightsPage;