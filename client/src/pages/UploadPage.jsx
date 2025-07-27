import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Stack,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material';
import {
  CameraAlt as CameraAltIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import { PageContainer, UploadDropZone, FileUploadItem } from '../components';

const UploadPage = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showTextForm, setShowTextForm] = useState(false);
  const [manualReceipt, setManualReceipt] = useState({
    store: '',
    location: '',
    timestamp: '',
    total_amount: '',
    goal_amount: '',
    summary: '',
    ocr_source: 'manual',
    items: [{ 
      item_name: '', 
      brand: '', 
      quantity: '', 
      unit_price: '', 
      above_market_price: false, 
      classified_as: '', 
      category: '' 
    }],
  });

  const supportedFormats = ['PDF', 'JPG', 'PNG', 'HEIC'];

  const handleFilesAdded = useCallback(async (newFiles) => {
    const processedFiles = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      status: 'processing',
      progress: 0,
      name: file.name,
      size: file.size,
    }));
    
    setFiles(prev => [...prev, ...processedFiles]);
    setProcessing(true);
    
    await startProcessing(processedFiles);
  }, []);

  const startProcessing = async (filesToProcess) => {
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileItem = filesToProcess[i];
      
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, progress } : f
        ));
      }

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
      ));
    }

    setProcessing(false);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesAdded(Array.from(e.target.files));
      }
    };
    input.click();
  };

  const removeFile = (fileId) => {
    if (!processing) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleReviewResults = () => {
    const completedFiles = files.filter(f => f.status === 'completed').length;
    navigate('/processing', { 
      state: { 
        processedFiles: completedFiles 
      } 
    });
  };

  const handleTextFormSubmit = () => {
    // In a real app, you would send this data to your backend
    setSnackbar({
      open: true,
      message: 'Manual receipt added successfully',
      severity: 'success'
    });
    setShowTextForm(false);
    
    // Reset form
    setManualReceipt({
      store: '',
      location: '',
      timestamp: '',
      total_amount: '',
      goal_amount: '',
      summary: '',
      ocr_source: 'manual',
      items: [{ 
        item_name: '', 
        brand: '', 
        quantity: '', 
        unit_price: '', 
        above_market_price: false, 
        classified_as: '', 
        category: '' 
      }],
    });
    // Prepare receipt data with default values for missing fields
    const hasItems = manualReceipt.items && manualReceipt.items.length > 0 && manualReceipt.items.some(item => item.item_name || item.brand || item.quantity || item.unit_price || item.classified_as || item.category);
    const defaultReceipt = {
      store: manualReceipt.store || 'Unknown Store',
      location: manualReceipt.location || 'Unknown Location',
      timestamp: manualReceipt.timestamp || new Date().toISOString(),
      total_amount: manualReceipt.total_amount || '0',
      goal_amount: manualReceipt.goal_amount || '',
      summary: manualReceipt.summary || '',
      ocr_source: manualReceipt.ocr_source || 'manual',
      ...(hasItems && {
        items: manualReceipt.items.map(item => ({
          item_name: item.item_name || 'Unknown Item',
          brand: item.brand || '',
          quantity: item.quantity || '1',
          unit_price: item.unit_price || '0',
          above_market_price: item.above_market_price || false,
          classified_as: item.classified_as || '',
          category: item.category || ''
        }))
      })
    };
    console.log('Manual Receipt Data:', defaultReceipt);
    // Navigate to ReceiptReviewPage with defaultReceipt data
    navigate('/receiptreview', { state: { receipt: defaultReceipt } });
  };

  const handleManualReceiptChange = (e) => {
    const { name, value } = e.target;
    setManualReceipt(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setManualReceipt(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [name]: name === 'above_market_price' ? e.target.checked : value
      };
      return {
        ...prev,
        items: newItems
      };
    });
  };

  const addItemField = () => {
    setManualReceipt(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          item_name: '', 
          brand: '', 
          quantity: '', 
          unit_price: '', 
          above_market_price: false, 
          classified_as: '', 
          category: '' 
        }
      ]
    }));
  };

  const removeItemField = (index) => {
    setManualReceipt(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 10 
    }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 100,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 2,
            gap: 2,
          }}
        >
          <IconButton
            onClick={() => navigate('/dashboard')}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 500, flex: 1 }}>
            Upload receipts
          </Typography>
        </Box>
      </Box>

      <PageContainer>
        {/* Empty State or Upload Zone */}
        <Box sx={{
          display: files.length === 0 ? 'flex' : 'block',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: files.length === 0 ? '60vh' : undefined,
          textAlign: files.length === 0 ? 'center' : undefined,
          px: 3,
        }}>
          {files.length === 0 && (
            <>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <AddIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                No receipts yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 280 }}
              >
                Upload receipts to extract and save details securely
              </Typography>
            </>
          )}
          <UploadDropZone
            onFilesSelected={handleFilesAdded}
            supportedFormats={supportedFormats}
            disabled={processing}
          />
          <Button
            variant="outlined"
            sx={{ mt: 3, borderRadius: '12px', textTransform: 'none' }}
            onClick={() => setShowTextForm(true)}
          >
            Import receipt details as text
          </Button>
          {files.length > 0 && (
            <Box sx={{ pt: 2, width: '100%' }}>
              {/* Processing Header */}
              <Box sx={{ mb: 3, px: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                  {processing ? 'AI extracting data...' : 'Processing complete'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {files.length} receipt{files.length !== 1 ? 's' : ''} {processing ? 'being processed' : 'ready for review'}
                </Typography>
              </Box>
              {/* File List */}
              <Stack spacing={1}>
                {files.map((fileItem) => (
                  <FileUploadItem
                    key={fileItem.id}
                    file={fileItem}
                    onRemove={removeFile}
                    showProgress={true}
                    disabled={processing}
                  />
                ))}
              </Stack>
              {/* Review Button */}
              {!processing && files.some(f => f.status === 'completed') && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleReviewResults}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Review & confirm data
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </PageContainer>

      {/* Floating Camera Button */}
      <Fab
        color="primary"
        onClick={handleCameraCapture}
        disabled={processing}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <CameraAltIcon />
      </Fab>

      {/* Manual Receipt Dialog */}
      <Dialog 
        open={showTextForm} 
        onClose={() => setShowTextForm(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Receipt Details Manually</Typography>
            <IconButton onClick={() => setShowTextForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                name="store"
                label="Store Name"
                value={manualReceipt.store}
                onChange={handleManualReceiptChange}
                fullWidth
              />
              <TextField
                name="location"
                label="Location"
                value={manualReceipt.location}
                onChange={handleManualReceiptChange}
                fullWidth
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                name="timestamp"
                label="Date & Time"
                type="datetime-local"
                value={manualReceipt.timestamp}
                onChange={handleManualReceiptChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="total_amount"
                label="Total Amount"
                type="number"
                value={manualReceipt.total_amount}
                onChange={handleManualReceiptChange}
                fullWidth
              />
            </Stack>
            
            <TextField
              name="summary"
              label="Summary"
              value={manualReceipt.summary}
              onChange={handleManualReceiptChange}
              fullWidth
              multiline
              rows={3}
            />
            
            <Divider />
            
            <Typography variant="subtitle1">Items</Typography>
            
            {manualReceipt.items.map((item, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                position: 'relative',
                zIndex: 2
              }}>
                {manualReceipt.items.length > 1 && (
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItemField(index);
                    }}
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      color: 'error.main',
                      zIndex: 3
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      name="item_name"
                      label="Item Name"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                    <TextField
                      name="brand"
                      label="Brand"
                      value={item.brand}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      name="quantity"
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                    <TextField
                      name="unit_price"
                      label="Unit Price"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      name="classified_as"
                      label="Classified As"
                      value={item.classified_as}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                    <TextField
                      name="category"
                      label="Category"
                      value={item.category}
                      onChange={(e) => handleItemChange(index, e)}
                      fullWidth
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
            
            <Button 
              onClick={addItemField}
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Item
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowTextForm(false)}
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTextFormSubmit}
            variant="contained"
            sx={{ borderRadius: '8px' }}
            disabled={!manualReceipt.store || !manualReceipt.total_amount || !manualReceipt.timestamp}
          >
            Add Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
          }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadPage;