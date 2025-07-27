import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

const InsightMetric = ({ value, label, color = 'primary.main', prefix = '$' }) => (
  <Box sx={{ textAlign: 'center', py: 2 }}>
    <Typography 
      variant="h4" 
      sx={{ 
        fontWeight: 300, 
        color, 
        mb: 0.5,
        fontSize: { xs: '1.8rem', sm: '2.5rem' }
      }}
    >
      {prefix}{value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
      {label}
    </Typography>
  </Box>
);

export default InsightMetric;
