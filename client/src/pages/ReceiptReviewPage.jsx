import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  Chip,
  Alert,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../components';

const ReceiptReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get extracted data from processing (stub data for now)
  const initialData = location.state?.extractedData || {
    merchant: 'Starbucks Coffee',
    date: '2024-01-15',
    time: '14:30',
    total: '15.47',
    category: 'Coffee & Dining',
    paymentMethod: 'Credit Card',
    location: '123 Main Street, Downtown',
    items: [
      { name: 'Grande Latte', quantity: 1, price: '5.25' },
      { name: 'Blueberry Scone', quantity: 1, price: '3.95' },
      { name: 'Americano', quantity: 2, price: '3.14' }
    ],
    tax: '1.23',
    tip: '1.90'
  };

  const [formData, setFormData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

  useEffect(() => {
    // Check if user made any changes
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  }, [formData, initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: '0.00' }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity || 1)), 0
    );
    const tax = parseFloat(formData.tax || 0);
    const tip = parseFloat(formData.tip || 0);
    return (itemsTotal + tax + tip).toFixed(2);
  };

  const handleSaveChanges = async () => {
    setSaveStatus('saving');
    
    // Simulate API call to save changes
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the total based on items
      const calculatedTotal = calculateTotal();
      const finalData = {
        ...formData,
        total: calculatedTotal
      };
      
      setFormData(finalData);
      setSaveStatus('saved');
      setIsEditing(false);
      
      // Clear save status after a moment
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleConfirmAndProceed = () => {
    // Navigate to wallet preview with confirmed data
    navigate('/wallet-preview', {
      state: {
        confirmedData: formData,
        files: location.state?.files || [],
        readyForWallet: true
      }
    });
  };

  const categories = [
    'Coffee & Dining',
    'Groceries', 
    'Transportation',
    'Retail',
    'Entertainment',
    'Health & Fitness',
    'Gas & Fuel',
    'Other'
  ];

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
            onClick={() => navigate('/processing')}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 500, flex: 1 }}>
            Review extracted data
          </Typography>
          
          {!isEditing && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      <PageContainer>
        {/* Save Status Alert */}
        {saveStatus && (
          <Alert 
            severity={saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'error' : 'info'}
            sx={{ mb: 2 }}
          >
            {saveStatus === 'saving' && 'Saving changes...'}
            {saveStatus === 'saved' && 'Changes saved successfully!'}
            {saveStatus === 'error' && 'Error saving changes. Please try again.'}
          </Alert>
        )}

        {/* Basic Information */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
              Receipt Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Merchant Name"
                  value={formData.merchant}
                  onChange={(e) => handleInputChange('merchant', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Category
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => isEditing && handleInputChange('category', category)}
                      variant={formData.category === category ? 'filled' : 'outlined'}
                      color={formData.category === category ? 'primary' : 'default'}
                      clickable={isEditing}
                      sx={{ borderRadius: '8px' }}
                    />
                  ))}
                </Stack>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Items Purchased
              </Typography>
              {isEditing && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={addNewItem}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Add item
                </Button>
              )}
            </Box>
            
            <List sx={{ p: 0 }}>
              {formData.items.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="Item Name"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          fullWidth
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          fullWidth
                          disabled={!isEditing}
                          size="small"
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Price"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          fullWidth
                          disabled={!isEditing}
                          size="small"
                          InputProps={{
                            startAdornment: '$'
                          }}
                        />
                      </Grid>
                      {isEditing && (
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            onClick={() => removeItem(index)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  </ListItem>
                  {index < formData.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Total & Summary */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
              Receipt Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Tax"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  size="small"
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Tip"
                  value={formData.tip}
                  onChange={(e) => handleInputChange('tip', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  size="small"
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Total Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                ${isEditing ? calculateTotal() : formData.total}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack spacing={2}>
          {isEditing ? (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(initialData); // Reset changes
                }}
                sx={{ flex: 1, py: 1.5, textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                disabled={saveStatus === 'saving'}
                sx={{ flex: 1, py: 1.5, textTransform: 'none' }}
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckIcon />}
              onClick={handleConfirmAndProceed}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 500,
              }}
              fullWidth
            >
              Confirm & Generate Wallet Pass
            </Button>
          )}
        </Stack>
      </PageContainer>
    </Box>
  );
};

export default ReceiptReviewPage;
