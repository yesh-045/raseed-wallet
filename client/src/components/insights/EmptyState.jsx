import React from 'react';
import {
  Box,
  Typography,
  Fade,
  Paper,
  Grid,
} from '@mui/material';
import { 
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Insights as InsightsIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';

const EmptyState = ({ onGetStarted }) => (
  <Fade in={true}>
    <Box sx={{ py: 4, px: 2 }}>
      <Paper
        elevation={0}
        sx={{ 
          textAlign: 'center', 
          py: 6, 
          px: 3,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            borderRadius: '50%',
            opacity: 0.1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 80,
            height: 80,
            background: 'linear-gradient(45deg, #9c27b0, #ba68c8)',
            borderRadius: '50%',
            opacity: 0.1,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <AIIcon sx={{ fontSize: 72, color: 'primary.main', mb: 3, opacity: 0.9 }} />
          
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
            AI Financial Insights
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ 
            mb: 4, 
            maxWidth: 480, 
            mx: 'auto',
            lineHeight: 1.6,
            fontSize: '1.1rem'
          }}>
            Get personalized analysis of your spending patterns, discover hidden insights, 
            and make smarter financial decisions with our AI-powered tools.
          </Typography>

          {/* Feature highlights */}
          <Grid container spacing={3} sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Spending Trends
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <InsightsIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Smart Analysis
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <SparkleIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  AI Recommendations
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ 
            mt: 4,
            opacity: 0.8,
            fontStyle: 'italic'
          }}>
            👇 Select an analysis tool below to get started
          </Typography>
        </Box>
      </Paper>
    </Box>
  </Fade>
);

export default EmptyState;