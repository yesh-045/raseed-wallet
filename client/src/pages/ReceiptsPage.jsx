import React, { useState, useEffect, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import app from '../firebase';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Chip,
  Avatar,
  InputBase,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Divider,
  TextField,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarMonthIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
  Share as ShareIcon,
  Email as EmailIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components';

const ReceiptsPage = () => {
  // Calendar navigation state
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };
  const handleYearChange = (e) => {
    setCalendarYear(Number(e.target.value));
    setSelectedDate(null);
  };
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('date-desc');
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch receipts data
  useEffect(() => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    const uid = user?.uid;
    
    if (!uid) {
      setLoading(false);
      return;
    }
    
    const fetchReceipts = async () => {
      try {
        const response = await fetch(`http://localhost:8000/receipts/${uid}`);
        const data = await response.json();
        
        const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
        const receiptsArr = Array.isArray(data.receipts) ? data.receipts : [];
        
        const mapped = receiptsArr.map((r, idx) => {
          const rawDate = r.timestamp ? new Date(r.timestamp) : null;
          const dateStr = rawDate ? rawDate.toISOString().split('T')[0] : '';
          
          return {
            id: r.receipt_id || r.id,
            merchant: r.store || 'Unknown',
            total: r.total_amount ? `₹${r.total_amount}` : '',
            date: rawDate ? rawDate.toLocaleString('en-IN', { 
              dateStyle: 'medium', 
              timeStyle: 'short' 
            }) : '',
            category: r.items?.[0]?.category || '',
            color: googleColors[idx % googleColors.length],
            items: r.items?.length || 0,
            location: r.location || '',
            summary: r.summary || '',
            overspent: r.overspent,
            rawDate,
            rawAmount: parseFloat(r.total_amount) || 0,
            dateStr // Store the ISO date string for easy comparison
          };
        });
        
        setReceipts(mapped);
      } catch (error) {
        console.error('Error fetching receipts:', error);
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    const dateTotals = {};
    receipts.forEach(r => {
      if (r.dateStr && !isNaN(r.rawAmount)) {
        dateTotals[r.dateStr] = (dateTotals[r.dateStr] || 0) + r.rawAmount;
      }
    });
    return dateTotals;
  }, [receipts]);

  // Color scale for spend
  const getSpendColor = (amount) => {
    if (amount === 0) return '#e0e0e0';
    if (amount < 500) return '#A5D6A7';
    if (amount < 2000) return '#FFF59D';
    if (amount < 5000) return '#FFB74D';
    return '#E57373';
  };

  // Calendar grid for current month
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calendarYear, calendarMonth, d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const amount = calendarData[dateStr] || 0;
      const hasReceipts = amount > 0;
      cells.push({
        day: d,
        dateStr,
        amount,
        color: hasReceipts ? getSpendColor(amount) : '#e0e0e0',
        hasReceipts
      });
    }
    return cells;
  }, [calendarData, receipts, calendarMonth, calendarYear]);

  // Dynamic categories from receipts
  const categories = useMemo(() => {
    const allCategories = receipts
      .flatMap(r => 
        r.items && Array.isArray(r.items) 
          ? r.items.map(item => item.category) 
          : [r.category]
      )
      .filter(Boolean);
    
    const unique = ['All', ...new Set(allCategories)];
    return unique;
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    let result = [...receipts];
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(receipt => 
        receipt.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category tab
    if (tabValue > 0 && categories[tabValue]) {
      result = result.filter(receipt => 
        receipt.category === categories[tabValue]
      );
    }
    
    // Filter by selected date if calendar is shown and date is selected
    if (showCalendar && selectedDate) {
      result = result.filter(receipt => 
        receipt.dateStr === selectedDate
      );
    }
    
    return result;
  }, [receipts, searchQuery, tabValue, categories, showCalendar, selectedDate]);

  // Sort filteredReceipts
  const sortedReceipts = useMemo(() => {
    const arr = [...filteredReceipts];
    switch (sortCriteria) {
      case 'date-desc':
        return arr.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
      case 'date-asc':
        return arr.sort((a, b) => (a.rawDate || 0) - (b.rawDate || 0));
      case 'amount-desc':
        return arr.sort((a, b) => b.rawAmount - a.rawAmount);
      case 'amount-asc':
        return arr.sort((a, b) => a.rawAmount - b.rawAmount);
      case 'merchant-asc':
        return arr.sort((a, b) => a.merchant.localeCompare(b.merchant));
      case 'merchant-desc':
        return arr.sort((a, b) => b.merchant.localeCompare(a.merchant));
      default:
        return arr;
    }
  }, [filteredReceipts, sortCriteria]);

  // Event handlers
  const handleCalendarToggle = () => {
    setShowCalendar(prev => !prev);
    if (showCalendar) {
      setSelectedDate(null); // Clear date selection when hiding calendar
    }
  };

  const handleSearchToggle = () => setShowSearch(prev => !prev);
  
  const handleSortClick = (event) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = () => setSortAnchorEl(null);
  const handleSortSelect = (criteria) => {
    setSortCriteria(criteria);
    handleSortClose();
  };

  const handleReceiptClick = (receiptId) => {
    if (selectionMode) {
      handleReceiptSelect(receiptId);
    } else {
      const receipt = filteredReceipts.find(r => r.id === receiptId);
      if (receipt) {
        navigate(`/receipt/${receipt.id}`);
      }
    }
  };

  const handleReceiptSelect = (receiptId) => {
    setSelectedReceipts(prev => 
      prev.includes(receiptId) 
        ? prev.filter(id => id !== receiptId) 
        : [...prev, receiptId]
    );
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) setSelectedReceipts([]);
  };

  const handleSelectAll = () => {
    setSelectedReceipts(prev => 
      prev.length === filteredReceipts.length 
        ? [] 
        : filteredReceipts.map(r => r.id)
    );
  };

  const handleBulkDownloadPDF = async () => {
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar({
        open: true,
        message: `${selectedReceipts.length} receipts downloaded as PDF`,
        severity: 'success',
      });
      
      setSelectionMode(false);
      setSelectedReceipts([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download receipts',
        severity: 'error',
      });
    }
  };

  const handleMenuOpen = (event, receipt) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedReceipt(receipt);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReceipt(null);
  };

  const handleDownloadPDF = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSnackbar({
        open: true,
        message: `${selectedReceipt.merchant} receipt downloaded`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download PDF',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${selectedReceipt.merchant} Receipt`,
          text: `Receipt from ${selectedReceipt.merchant} - ${selectedReceipt.total}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `Receipt from ${selectedReceipt.merchant} - ${selectedReceipt.total} on ${selectedReceipt.date}`
        );
        setSnackbar({
          open: true,
          message: 'Receipt details copied',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to share receipt',
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleEmail = () => {
    setSnackbar({
      open: true,
      message: `Emailing ${selectedReceipt.merchant} receipt...`,
      severity: 'info',
    });
    handleMenuClose();
  };

  const handleDateSelect = (dateStr) => {
    if (dateStr === selectedDate) {
      setSelectedDate(null); // Deselect if same date clicked again
    } else {
      setSelectedDate(dateStr);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 10 
    }}>
      {/* Single Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: 100,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 2,
          gap: 2,
          justifyContent: 'space-between',
        }}>
          {selectionMode ? (
            <>
              <IconButton onClick={handleToggleSelectionMode} size="small">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 500, flex: 1 }}>
                {selectedReceipts.length} selected
              </Typography>
              <IconButton onClick={handleSelectAll} size="small">
                {selectedReceipts.length === filteredReceipts.length ? (
                  <CheckBoxIcon color="primary" />
                ) : (
                  <CheckBoxOutlineBlankIcon />
                )}
              </IconButton>
            </>
          ) : (
            <>
              <IconButton onClick={() => navigate('/dashboard')} size="small">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 500, flex: 1 }}>
                Receipts
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handleToggleSelectionMode} size="small">
                  <CheckBoxOutlineBlankIcon />
                </IconButton>
                <IconButton onClick={handleSearchToggle} size="small">
                  <SearchIcon />
                </IconButton>
                <IconButton 
                  onClick={handleCalendarToggle} 
                  size="small"
                  color={showCalendar ? 'primary' : 'default'}
                >
                  <CalendarMonthIcon />
                </IconButton>
                <IconButton onClick={handleSortClick} size="small">
                  <FilterIcon />
                </IconButton>
                <Menu
                  anchorEl={sortAnchorEl}
                  open={Boolean(sortAnchorEl)}
                  onClose={handleSortClose}
                  PaperProps={{ sx: { borderRadius: '12px', minWidth: 180 } }}
                >
                  <MenuItem onClick={() => handleSortSelect('date-desc')}>
                    Date (Newest)
                  </MenuItem>
                  <MenuItem onClick={() => handleSortSelect('date-asc')}>
                    Date (Oldest)
                  </MenuItem>
                  <MenuItem onClick={() => handleSortSelect('amount-desc')}>
                    Amount (High to Low)
                  </MenuItem>
                  <MenuItem onClick={() => handleSortSelect('amount-asc')}>
                    Amount (Low to High)
                  </MenuItem>
                  <MenuItem onClick={() => handleSortSelect('merchant-asc')}>
                    Merchant (A-Z)
                  </MenuItem>
                  <MenuItem onClick={() => handleSortSelect('merchant-desc')}>
                    Merchant (Z-A)
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Box>

        {/* Search Bar */}
        {!selectionMode && showSearch && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'grey.100',
              borderRadius: '24px',
              px: 2,
              py: 1,
            }}>
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search receipts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        )}

        {/* Bulk Actions */}
        {selectionMode && selectedReceipts.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleBulkDownloadPDF}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              Download PDF
            </Button>
          </Box>
        )}

        {/* Calendar Heatmap - shown only when toggled */}
        {showCalendar && (
          <Box sx={{
            px: 2,
            py: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <IconButton size="small" onClick={handlePrevMonth}>
                {'<'}
              </IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Typography>
              <IconButton size="small" onClick={handleNextMonth}>
                {'>'}
              </IconButton>
              <Box sx={{ ml: 2 }}>
                <TextField
                  select
                  value={calendarYear}
                  onChange={handleYearChange}
                  size="small"
                  sx={{ minWidth: 80 }}
                >
                  {[...Array(6)].map((_, i) => {
                    const y = today.getFullYear() - 2 + i;
                    return <MenuItem key={y} value={y}>{y}</MenuItem>;
                  })}
                </TextField>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <Typography key={i} variant="caption" sx={{ 
                  textAlign: 'center', 
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}>
                  {day}
                </Typography>
              ))}
              {calendarCells.map((cell, idx) => cell ? (
                <Box 
                  key={idx}
                  sx={{
                    aspectRatio: '1/1',
                    borderRadius: '4px',
                    bgcolor: cell.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: cell.hasReceipts ? 'pointer' : 'default',
                    border: cell.dateStr === selectedDate ? '2px solid #1976d2' : '1px solid transparent',
                    position: 'relative',
                    '&:hover': {
                      opacity: cell.hasReceipts ? 0.8 : 1
                    }
                  }}
                  onClick={() => cell.hasReceipts && handleDateSelect(cell.dateStr)}
                  title={cell.hasReceipts ? `₹${cell.amount} spent on ${cell.dateStr}` : 'No receipts'}
                >
                  <Typography variant="caption" sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.7rem',
                    color: '#000',
                    textShadow: 'none',
                  }}>
                    {cell.day}
                  </Typography>
                </Box>
              ) : (
                <Box key={idx} sx={{ aspectRatio: '1/1' }} />
              ))}
            </Box>
            {selectedDate && (
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Showing receipts for {new Date(selectedDate).toLocaleDateString()}
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedDate(null)}
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Typography>
            )}
          </Box>
        )}

        {/* Category Tabs */}
        {!selectionMode && (
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
            }}
          >
            {categories.map((category, index) => (
              <Tab key={index} label={category} />
            ))}
          </Tabs>
        )}
      </Box>

      <PageContainer>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh' 
          }}>
            <Typography variant="body1" color="text.secondary">
              Loading receipts...
            </Typography>
          </Box>
        ) : sortedReceipts.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            px: 3,
          }}>
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}>
              <ReceiptIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
            
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
              {searchQuery || selectedDate ? 'No matching receipts' : 'No receipts yet'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : selectedDate
                ? 'No receipts found for selected date'
                : 'Upload your first receipt to get started'
              }
            </Typography>

            {!searchQuery && !selectedDate && (
              <Button
                variant="contained"
                onClick={() => navigate('/upload')}
                sx={{
                  borderRadius: '24px',
                  textTransform: 'none',
                  py: 1.5,
                  px: 3,
                }}
              >
                Upload receipt
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 1 }}>
              {sortedReceipts.length} receipt{sortedReceipts.length !== 1 ? 's' : ''}
              {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
            </Typography>

            <Stack spacing={2}>
              {sortedReceipts.map((receipt) => (
                <Card
                  key={receipt.id}
                  elevation={0}
                  onClick={() => handleReceiptClick(receipt.id)}
                  sx={{
                    border: '1px solid',
                    borderColor: selectedReceipts.includes(receipt.id) 
                      ? 'primary.main' 
                      : 'divider',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    bgcolor: selectedReceipts.includes(receipt.id) 
                      ? 'primary.50' 
                      : 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      {selectionMode && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReceiptSelect(receipt.id);
                            }}
                          >
                            {selectedReceipts.includes(receipt.id) ? (
                              <CheckBoxIcon color="primary" />
                            ) : (
                              <CheckBoxOutlineBlankIcon />
                            )}
                          </IconButton>
                        </Box>
                      )}

                      <Avatar sx={{
                        width: 56,
                        height: 56,
                        bgcolor: receipt.color,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                      }}>
                        {receipt.merchant.charAt(0)}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {receipt.merchant}
                          </Typography>
                          
                          {!selectionMode && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleMenuOpen(e, receipt)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {receipt.location} • {receipt.items} item{receipt.items !== 1 ? 's' : ''}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {receipt.date}
                        </Typography>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <Chip 
                            label={receipt.category} 
                            size="small" 
                            variant="outlined"
                            sx={{ borderRadius: '8px' }}
                          />
                          
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {receipt.total}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </PageContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={handleDownloadPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download PDF" />
        </MenuItem>
        
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
        
        <MenuItem onClick={handleEmail}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Email" />
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceiptsPage;