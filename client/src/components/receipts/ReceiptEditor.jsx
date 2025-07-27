import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  IconButton,
  Divider,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const ReceiptEditor = ({ receipt, onSave, onCancel, isEditing = false }) => {
  const [editedReceipt, setEditedReceipt] = useState({
    merchant: receipt?.merchant || '',
    date: receipt?.date || new Date().toISOString().split('T')[0],
    total: receipt?.total || 0,
    tax: receipt?.tax || 0,
    category: receipt?.category || '',
    items: receipt?.items || [{ name: '', price: 0, quantity: 1 }],
    notes: receipt?.notes || '',
    ...receipt
  });
  
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field, value) => {
    setEditedReceipt(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editedReceipt.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'price' || field === 'quantity' ? parseFloat(value) || 0 : value
    };
    
    setEditedReceipt(prev => ({
      ...prev,
      items: newItems
    }));
    setHasChanges(true);
  };

  const addItem = () => {
    setEditedReceipt(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: 0, quantity: 1 }]
    }));
    setHasChanges(true);
  };

  const removeItem = (index) => {
    if (editedReceipt.items.length > 1) {
      setEditedReceipt(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
      setHasChanges(true);
    }
  };

  const calculateSubtotal = () => {
    return editedReceipt.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedReceipt.merchant.trim()) {
      newErrors.merchant = 'Merchant name is required';
    }
    
    if (!editedReceipt.date) {
      newErrors.date = 'Date is required';
    }
    
    if (editedReceipt.total <= 0) {
      newErrors.total = 'Total must be greater than 0';
    }
    
    editedReceipt.items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}_name`] = 'Item name is required';
      }
      if (item.price <= 0) {
        newErrors[`item_${index}_price`] = 'Item price must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(editedReceipt);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    onCancel();
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {isEditing ? 'Edit Receipt' : 'Review Receipt Details'}
      </Typography>

      {/* Basic Information */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <TextField
          label="Merchant Name"
          value={editedReceipt.merchant}
          onChange={(e) => handleFieldChange('merchant', e.target.value)}
          error={!!errors.merchant}
          helperText={errors.merchant}
          fullWidth
          variant="outlined"
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={editedReceipt.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            error={!!errors.date}
            helperText={errors.date}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          
          <TextField
            label="Category"
            value={editedReceipt.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Items Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Items
      </Typography>
      
      {editedReceipt.items.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Item Name"
            value={item.name}
            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
            error={!!errors[`item_${index}_name`]}
            helperText={errors[`item_${index}_name`]}
            sx={{ flex: 2 }}
            size="small"
          />
          
          <TextField
            label="Price"
            type="number"
            value={item.price}
            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
            error={!!errors[`item_${index}_price`]}
            helperText={errors[`item_${index}_price`]}
            InputProps={{ startAdornment: '$' }}
            sx={{ flex: 1 }}
            size="small"
          />
          
          <TextField
            label="Qty"
            type="number"
            value={item.quantity}
            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ width: 80 }}
            size="small"
          />
          
          <IconButton 
            onClick={() => removeItem(index)}
            disabled={editedReceipt.items.length === 1}
            size="small"
          >
            <RemoveIcon />
          </IconButton>
        </Box>
      ))}
      
      <Button
        startIcon={<AddIcon />}
        onClick={addItem}
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
      >
        Add Item
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* Totals Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Tax"
            type="number"
            value={editedReceipt.tax}
            onChange={(e) => handleFieldChange('tax', parseFloat(e.target.value) || 0)}
            InputProps={{ startAdornment: '$' }}
            sx={{ flex: 1 }}
          />
          
          <TextField
            label="Total"
            type="number"
            value={editedReceipt.total}
            onChange={(e) => handleFieldChange('total', parseFloat(e.target.value) || 0)}
            error={!!errors.total}
            helperText={errors.total}
            InputProps={{ startAdornment: '$' }}
            sx={{ flex: 1 }}
          />
        </Box>
        
        {/* Calculated subtotal for reference */}
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="body2">
            Calculated subtotal from items: ${calculateSubtotal().toFixed(2)}
            {Math.abs(calculateSubtotal() + editedReceipt.tax - editedReceipt.total) > 0.01 && (
              <Chip 
                label="Totals don't match" 
                color="warning" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Alert>
      </Box>

      {/* Notes */}
      <TextField
        label="Notes"
        value={editedReceipt.notes}
        onChange={(e) => handleFieldChange('notes', e.target.value)}
        multiline
        rows={3}
        fullWidth
        sx={{ mb: 3 }}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </Box>
    </Paper>
  );
};

export default ReceiptEditor;
