import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Camera as CameraIcon,
} from '@mui/icons-material';

const UploadDropZone = ({ onFilesSelected, isProcessing = false, processingProgress = 0 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    const files = e.dataTransfer.files;
    validateAndProcessFiles(files);
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    validateAndProcessFiles(files);
  };

  const validateAndProcessFiles = (files) => {
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name} is not a supported file type. Please upload JPG, PNG, or PDF files.`);
        return;
      }
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Please upload files smaller than 10MB.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleCameraCapture = () => {
    // This would typically open camera on mobile
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = handleFileInput;
    input.click();
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: dragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? 'primary.main' : 'text.secondary',
            mb: 2 
          }} 
        />
        
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
          {dragActive ? 'Drop files here' : 'Upload receipts'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Drag and drop your receipt images or PDFs here, or click to browse
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ minWidth: 140 }}
          >
            Choose Files
            <input
              id="file-input"
              type="file"
              hidden
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileInput}
            />
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={handleCameraCapture}
            sx={{ minWidth: 140 }}
          >
            Take Photo
          </Button>
        </Box>
      </Box>

      {isProcessing && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Processing receipts... {Math.round(processingProgress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={processingProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
    </Box>
  );
};

export default UploadDropZone;
