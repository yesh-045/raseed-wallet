import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  alpha,
  Paper,
  Chip,
} from '@mui/material';

const ToolSelector = ({ tools, onSelect, activeToolId, loadingTool }) => {
  return (
    <Box sx={{ 
      position: 'fixed',
      bottom: 80, // Above bottom navigation
      left: 16,
      right: 16,
      zIndex: 1000,
      maxWidth: 'calc(100vw - 32px)',
      mx: 'auto',
    }}>
      <Paper
        elevation={8}
        sx={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          p: 2.5,
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 2, 
            fontWeight: 600,
            color: 'text.primary',
            textAlign: 'center',
            fontSize: '1rem'
          }}
        >
          {activeToolId ? 'Switch Analysis Tool' : 'Select Analysis Tool'}
        </Typography>
        
        {/* Tool Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1.5,
          maxHeight: '180px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { 
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '2px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '2px',
          },
        }}>
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeToolId === tool.id;
            const isLoading = loadingTool === tool.id;
            
            return (
              <Box
                key={tool.id}
                onClick={() => !isLoading && onSelect(tool)}
                sx={{
                  position: 'relative',
                  background: isActive 
                    ? `linear-gradient(135deg, ${tool.color} 0%, ${alpha(tool.color, 0.8)} 100%)`
                    : 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  p: 1.5,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  border: `2px solid ${isActive ? tool.color : 'transparent'}`,
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isActive 
                    ? `0 4px 12px ${alpha(tool.color, 0.3)}`
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: isLoading ? 'scale(1)' : 'scale(1.05)',
                    boxShadow: isLoading 
                      ? '0 2px 8px rgba(0,0,0,0.1)'
                      : `0 6px 16px ${alpha(tool.color, 0.4)}`,
                    background: isActive 
                      ? `linear-gradient(135deg, ${tool.color} 0%, ${alpha(tool.color, 0.9)} 100%)`
                      : `linear-gradient(135deg, ${alpha(tool.color, 0.1)} 0%, ${alpha(tool.color, 0.05)} 100%)`,
                  },
                }}
              >
                {/* Loading Overlay */}
                {isLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress size={20} sx={{ color: tool.color }} />
                  </Box>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <IconComponent 
                    sx={{ 
                      fontSize: 24,
                      color: isActive ? 'white' : tool.color,
                      mb: 1,
                      transition: 'color 0.2s ease',
                    }} 
                  />
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: isActive ? 'white' : 'text.primary',
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {tool.name}
                  </Typography>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        height: 16,
                        fontSize: '0.65rem',
                        bgcolor: 'white',
                        color: tool.color,
                        fontWeight: 600,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
        
        {/* Helper text */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            mt: 2,
            fontSize: '0.7rem',
            opacity: 0.8
          }}
        >
          Tap a tool to view AI-powered insights about your spending
        </Typography>
      </Paper>
    </Box>
  );
};

export default ToolSelector;