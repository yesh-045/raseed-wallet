import React, { useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Slide,
  alpha,
  useTheme,
  Grid,
  Card,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AIIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const InsightCard = ({ tool, data, onClose, onRefresh, loading }) => {
  const theme = useTheme();
  const IconComponent = tool.icon;
  const [showFullAI, setShowFullAI] = useState(false);
  
  // Format AI insights with better structure
  const formatAIInsights = (text) => {
    if (!text) return null;
    
    // Ensure text is a string
    const textString = typeof text === 'string' ? text : String(text);
    
    const paragraphs = textString.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Handle bullet points
      if (paragraph.includes('*') || paragraph.includes('•')) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        const title = lines[0]?.replace(/^\*+\s*/, '').replace(/^#+\s*/, '');
        const bullets = lines.slice(1).filter(line => 
          line.trim().startsWith('*') || line.trim().startsWith('•')
        );
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            {title && !title.startsWith('*') && (
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: 'primary.main'
              }}>
                {title.replace(/\*\*/g, '')}
              </Typography>
            )}
            {bullets.length > 0 && (
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {bullets.map((bullet, bulletIndex) => (
                  <Typography component="li" key={bulletIndex} variant="body2" sx={{ 
                    mb: 0.5,
                    lineHeight: 1.5
                  }}>
                    {bullet.replace(/^[\s\*\•]+/, '').trim()}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );
      }
      
      // Regular paragraph
      return (
        <Typography key={index} variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
          {paragraph.replace(/\*\*/g, '')}
        </Typography>
      );
    });
  };

  // Truncate text for preview
  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    
    // Ensure text is a string
    const textString = typeof text === 'string' ? text : String(text);
    
    if (textString.length <= maxLength) return textString;
    return textString.substring(0, maxLength) + '...';
  };

  // Render simplified metrics
  const renderMetrics = () => {
    if (!data || loading) return null;

    // Extract metrics based on tool type and API response structure
    let metrics = {};
    
    switch (tool.id) {
      case 'fhs':
        metrics = {
          'FHS Score': data.fhs_score || data.score,
          'Category': data.category,
          'Total Spending': data.total_spending ? `₹${data.total_spending.toFixed(2)}` : null,
          'Income Ratio': data.income_ratio ? `${data.income_ratio.toFixed(1)}%` : null,
        };
        break;
        
      case 'need_want':
        metrics = {
          'Essential': data.essential_spending ? `₹${data.essential_spending.toFixed(2)}` : null,
          'Discretionary': data.discretionary_spending ? `₹${data.discretionary_spending.toFixed(2)}` : null,
          'Essential %': data.essential_percentage ? `${data.essential_percentage.toFixed(1)}%` : null,
          'Discretionary %': data.discretionary_percentage ? `${data.discretionary_percentage.toFixed(1)}%` : null,
        };
        break;
        
      case 'recurring':
        metrics = {
          'Total Recurring': data.total_recurring ? `₹${data.total_recurring.toFixed(2)}` : null,
          'Active Subs': data.recurring_count || data.subscription_count,
          'Monthly Impact': data.monthly_impact ? `₹${data.monthly_impact.toFixed(2)}` : null,
          'Savings Potential': data.potential_savings ? `₹${data.potential_savings.toFixed(2)}` : null,
        };
        break;
        
      default:
        // Fallback to data.metrics if available, or extract common fields
        metrics = data.metrics || {
          'Total Amount': data.total_amount ? `₹${data.total_amount.toFixed(2)}` : null,
          'Count': data.total_transactions || data.count,
          'Average': data.average_amount ? `₹${data.average_amount.toFixed(2)}` : null,
          'Score': data.score,
        };
    }

    // Filter out null/undefined values
    const metricEntries = Object.entries(metrics).filter(([key, value]) => 
      value !== null && value !== undefined && value !== ''
    );

    if (metricEntries.length === 0) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricEntries.slice(0, 4).map(([key, value], index) => {
          const isMonetary = typeof value === 'string' && value.includes('₹');
          const isPercentage = typeof value === 'string' && value.includes('%');
          const isNegative = typeof value === 'number' && value < 0;
          
          return (
            <Grid item xs={6} sm={3} key={index}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  background: alpha(tool.color, 0.05)
                }}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: isMonetary ? 'error.main' : isPercentage ? 'warning.main' : tool.color,
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  fontSize: '1rem'
                }}>
                  {isNegative && <TrendingDownIcon fontSize="small" />}
                  {!isNegative && typeof value === 'number' && value > 0 && <TrendingUpIcon fontSize="small" />}
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  textTransform: 'capitalize',
                  fontSize: '0.75rem'
                }}>
                  {key.replace(/_/g, ' ')}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Render AI insights section
  const renderAIInsights = () => {
    if (loading) return null;

    // Extract AI insights from different possible fields in the API response
    let insights = data?.ai_insights || 
                  data?.insights || 
                  data?.analysis || 
                  data?.summary?.insights ||
                  data?.recommendations ||
                  data?.description;

    // Convert to string if it's an object or array
    if (insights && typeof insights === 'object') {
      if (Array.isArray(insights)) {
        insights = insights.join('\n');
      } else {
        insights = JSON.stringify(insights, null, 2);
      }
    }

    // If no insights field found, generate basic insights from data
    if (!insights && data) {
      switch (tool.id) {
        case 'fhs':
          insights = `Your Financial Health Score is ${data.fhs_score || data.score} (${data.category}). `;
          if (data.category === 'Critical') {
            insights += "This indicates areas for improvement in your financial management. Consider reviewing your spending patterns and creating a budget plan.";
          } else if (data.category === 'Good') {
            insights += "You're doing well financially! Keep maintaining good spending habits.";
          }
          break;
          
        case 'need_want':
          insights = `You spent ₹${data.essential_spending?.toFixed(2) || '0'} on essentials and ₹${data.discretionary_spending?.toFixed(2) || '0'} on discretionary items. `;
          const essentialRatio = data.essential_spending / (data.essential_spending + data.discretionary_spending) * 100;
          if (essentialRatio > 70) {
            insights += "Your spending is well-balanced with a focus on essentials.";
          } else {
            insights += "Consider reviewing your discretionary spending to optimize your budget.";
          }
          break;
          
        default:
          insights = "Analysis complete. Review the metrics above for detailed insights into your financial data.";
      }
    }

    // Ensure insights is a string
    if (insights && typeof insights !== 'string') {
      insights = String(insights);
    }

    if (!insights) return null;

    const isLongContent = insights.length > 300;

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          border: '1px solid',
          borderColor: alpha(tool.color, 0.3),
          borderRadius: 2,
          background: alpha(tool.color, 0.05)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AIIcon sx={{ color: tool.color, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: tool.color }}>
            AI Analysis
          </Typography>
        </Box>
        
        {isLongContent && !showFullAI ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
              {truncateText(insights)}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowFullAI(true)}
              endIcon={<ExpandMoreIcon />}
              sx={{ 
                textTransform: 'none',
                borderColor: tool.color,
                color: tool.color,
                '&:hover': {
                  borderColor: tool.color,
                  background: alpha(tool.color, 0.1)
                }
              }}
            >
              Read Full Analysis
            </Button>
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: isLongContent ? 2 : 0 }}>
              {formatAIInsights(insights)}
            </Box>
            {isLongContent && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowFullAI(false)}
                endIcon={<ExpandLessIcon />}
                sx={{ 
                  textTransform: 'none',
                  borderColor: tool.color,
                  color: tool.color,
                  '&:hover': {
                    borderColor: tool.color,
                    background: alpha(tool.color, 0.1)
                  }
                }}
              >
                Show Less
              </Button>
            )}
          </Box>
        )}
      </Paper>
    );
  };

  // Render data summary for specific tools
  const renderDataSummary = () => {
    if (!data || loading) return null;

    // Tool-specific data rendering based on actual API response structure
    switch (tool.id) {
      case 'fhs':
        // FHS specific summary
        if (data.fhs_score || data.score) {
          return (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Financial Health Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Health Score:</Typography>
                  <Chip 
                    label={`${data.fhs_score || data.score}/100`} 
                    size="small" 
                    color={data.category === 'Critical' ? 'error' : data.category === 'Good' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Category:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{data.category}</Typography>
                </Box>
                {data.total_spending && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Spending:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{data.total_spending.toFixed(2)}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        }
        break;

      case 'need_want':
        // Need vs Want specific summary
        if (data.essential_spending !== undefined && data.discretionary_spending !== undefined) {
          const total = data.essential_spending + data.discretionary_spending;
          const essentialPercentage = total > 0 ? (data.essential_spending / total * 100).toFixed(1) : 0;
          const discretionaryPercentage = total > 0 ? (data.discretionary_spending / total * 100).toFixed(1) : 0;
          
          return (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Spending Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha('#4caf50', 0.1), borderRadius: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{data.essential_spending.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Essentials ({essentialPercentage}%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha('#ff9800', 0.1), borderRadius: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      ₹{data.discretionary_spending.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Discretionary ({discretionaryPercentage}%)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          );
        }
        break;

      case 'recurring':
        if (data.recurring_transactions?.length > 0) {
          return (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Recurring Subscriptions ({data.recurring_transactions.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {data.recurring_transactions.slice(0, 5).map((transaction, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < 4 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2">{transaction.merchant_name}</Typography>
                    <Chip 
                      label={`₹${transaction.amount}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          );
        }
        break;

      default:
        // Generic data display for other tools - check for summary object
        if (data.summary && typeof data.summary === 'object') {
          return (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Summary
              </Typography>
              {Object.entries(data.summary).map(([key, value], index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {typeof value === 'number' && key.includes('amount') ? `₹${value.toFixed(2)}` : value}
                  </Typography>
                </Box>
              ))}
            </Paper>
          );
        }
        // Fallback for simple summary
        else if (data.total_amount || data.total_transactions || typeof data.summary === 'string') {
          return (
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Summary
              </Typography>
              {data.total_amount && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total Amount: ₹{data.total_amount.toFixed(2)}
                </Typography>
              )}
              {data.total_transactions && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total Transactions: {data.total_transactions}
                </Typography>
              )}
              {typeof data.summary === 'string' && (
                <Typography variant="body2">{data.summary}</Typography>
              )}
            </Paper>
          );
        }
    }

    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Card 
          elevation={8}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${alpha(tool.color, 0.2)}`,
            position: 'relative',
            zIndex: 1100,
            backgroundColor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }}
        >
          <Box sx={{ 
            background: `linear-gradient(135deg, ${tool.color} 0%, ${alpha(tool.color, 0.8)} 100%)`,
            color: 'white',
            p: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconComponent sx={{ fontSize: 28, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Analyzing your data...
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                sx={{ 
                  backgroundColor: alpha('#ffffff', 0.3),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#ffffff'
                  }
                }} 
              />
            </Box>
          </Box>
        </Card>
      </Slide>
    );
  }

  // Error state
  if (data?.error) {
    return (
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Card 
          elevation={8}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${alpha('#f44336', 0.2)}`,
            position: 'relative',
            zIndex: 1100,
            backgroundColor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }}
        >
          <Box sx={{ 
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            p: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconComponent sx={{ fontSize: 28, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {data.message || 'Failed to load insights'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <IconButton onClick={onRefresh} sx={{ color: 'white', mr: 1 }}>
                  <RefreshIcon />
                </IconButton>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Card>
      </Slide>
    );
  }

  // Main content
  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Card 
        elevation={8}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          overflow: 'hidden',
          border: `2px solid ${alpha(tool.color, 0.2)}`,
          position: 'relative',
          zIndex: 1100, // Higher than ToolSelector (1000)
          backgroundColor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          background: `linear-gradient(135deg, ${tool.color} 0%, ${alpha(tool.color, 0.8)} 100%)`,
          color: 'white',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconComponent sx={{ fontSize: 28, mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {tool.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {tool.description}
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton onClick={onRefresh} sx={{ color: 'white', mr: 1 }}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Metrics */}
          {renderMetrics()}
          
          {/* Data Summary */}
          {renderDataSummary()}
          
          {/* AI Insights */}
          {renderAIInsights()}
        </Box>
      </Card>
    </Slide>
  );
};

export default InsightCard;