import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Chip, Stack, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAuth } from 'firebase/auth';
import app from '../firebase';

const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user || !id) {
        setLoading(false);
        return;
      }
      console.log(`Fetching receipt with id: ${id} for user: ${user.uid}`);
      const res = await fetch(`http://localhost:8000/receipts/${user.uid}`);
      const data = await res.json();
      const found = (data.receipts || []).find(r => (r.receipt_id || r.id) === id);
      setReceipt(found || null);
      setLoading(false);
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Loading...</Typography></Box>;
  }

  if (!receipt) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Receipt not found.</Typography></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Card elevation={3} sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: 4 }}>
          {/* Card Header */}
          <Box sx={{ bgcolor: '#4285F4', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none', bgcolor: 'white', color: '#4285F4', borderRadius: '8px', px: 2, minWidth: 0, height: 40, ml: 2 }} />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>{receipt.store || 'Unknown Store'}</Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.85 }}>{receipt.location || 'N/A'}</Typography>
              </Box>
            </Box>
            <Chip label={receipt.overspent ? 'Overspent' : 'On Budget'} color={receipt.overspent ? 'error' : 'success'} sx={{ fontWeight: 600, alignSelf: 'center' }} />
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{receipt.timestamp ? new Date(receipt.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">OCR Source</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{receipt.ocr_source || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{receipt.total_amount}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Goal Amount</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{receipt.goal_amount}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Summary</Typography>
                <Typography variant="body1" sx={{ fontWeight: 400 }}>{receipt.summary || '-'}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Items</Typography>
            <Stack spacing={2}>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, idx) => (
                  <Card key={idx} elevation={0} sx={{ borderRadius: '12px', bgcolor: 'grey.50', p: 2, boxShadow: 0, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{item.item_name}</Typography>
                      <Chip label={item.category} size="small" sx={{ fontWeight: 500 }} />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Brand: {item.brand}</Typography>
                      <Typography variant="body2" color="text.secondary">Qty: {item.quantity}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2" color="text.secondary">Unit Price: ₹{item.unit_price}</Typography>
                      <Typography variant="body2" color="text.secondary">Market Price: ₹{item.market_price}</Typography>
                      <Typography variant="body2" color="text.secondary">Above Market: {item.above_market_price ? 'Yes' : 'No'}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">Wastage: {item.wastage_probability}</Typography>
                      <Typography variant="body2" color="text.secondary">Classified: {item.classified_as}</Typography>
                    </Stack>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No items found.</Typography>
              )}
            </Stack>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Gemini Inference</Typography>
            {receipt.gemini_inference ? (
              <Card elevation={0} sx={{ bgcolor: 'grey.50', borderRadius: '12px', p: 2, boxShadow: 0, border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Category Spend:</Typography>
                    {receipt.gemini_inference.category_spend && Object.keys(receipt.gemini_inference.category_spend).length > 0 ? (
                      <Stack spacing={1} sx={{ pl: 2 }}>
                        {Object.entries(receipt.gemini_inference.category_spend).map(([cat, amt], idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>{cat}</Typography>
                            <Typography variant="body2" color="text.secondary"><b>₹{amt}</b></Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Need vs Want Split:</Typography>
                    {receipt.gemini_inference.need_vs_want_split && Object.keys(receipt.gemini_inference.need_vs_want_split).length > 0 ? (
                      <Stack spacing={1} sx={{ pl: 2 }}>
                        {(() => {
                          const split = receipt.gemini_inference.need_vs_want_split;
                          const total = Object.values(split).reduce((sum, v) => sum + (typeof v === 'number' ? v : parseFloat(v)), 0);
                          return Object.entries(split).map(([type, amt], idx) => {
                            const percent = total > 0 ? ((typeof amt === 'number' ? amt : parseFloat(amt)) / total * 100).toFixed(1) : 0;
                            return (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>{type}</Typography>
                                <Typography variant="body2" color="text.secondary"><b>{percent}%</b></Typography>
                              </Box>
                            );
                          });
                        })()}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Sentence Summary:</Typography>
                    <Typography variant="body2" color="text.secondary">{receipt.gemini_inference.sentence_summary || '-'}</Typography>
                  </Box>
                </Stack>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">No inference data.</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ReceiptDetailPage;
