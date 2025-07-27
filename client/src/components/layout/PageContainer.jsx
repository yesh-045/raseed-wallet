import React from 'react';
import { Box } from '@mui/material';

const PageContainer = ({ children, maxWidth = 'lg', disablePadding = false }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        width: '100%',
      }}
    >
      <Box
        sx={{
          maxWidth: maxWidth,
          mx: 'auto',
          px: disablePadding ? 0 : { xs: 2, sm: 3 },
          py: disablePadding ? 0 : 2,
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageContainer;
