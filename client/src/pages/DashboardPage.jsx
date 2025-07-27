import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import app from '../firebase';
import apiService from '../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Fab,
  Avatar,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageContainer, BottomNavigation } from '../components';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    uid: '',
    name: '',
    email: '',
    phone: '',
    preferred_currency: '',
    budget_monthly: 0,
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Stats from backend receipts
  const [stats, setStats] = useState({
    totalSpend: '',
    totalReceipts: 0,
    thisMonth: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  // Array of weeks, each week is [Sun, Mon, ..., Sat]
  const [monthlyWeeklySpend, setMonthlyWeeklySpend] = useState([]);

  // Fetch recent receipts from backend
  const fetchRecentActivity = async () => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;
      
      // Use the API service instead of direct fetch
      apiService.setUserId(user.uid);
      const res = await fetch(`${apiService.baseURL}/receipts/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const receiptsArr = data.receipts || [];
        // Sort by timestamp descending and take the 3 most recent
        const sorted = receiptsArr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Google logo colors
        const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
        const mapped = sorted.slice(0, 3).map((r, idx) => ({
          id: r.receipt_id || r.id || idx,
          store: r.store || '',
          summary: r.summary || '',
          timestamp: r.timestamp || '',
          total_amount: r.total_amount,
          items: r.items || [],
          location: r.location || '',
          color: googleColors[idx % googleColors.length],
        }));
        setRecentActivity(mapped);
        // Update stats
        const totalReceipts = receiptsArr.length;
        const thisMonth = receiptsArr.filter(r => {
          if (!r.timestamp) return false;
          const d = new Date(r.timestamp);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        const totalSpend = receiptsArr.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        setStats({
          totalSpend: `₹${totalSpend.toFixed(2)}`,
          totalReceipts,
          thisMonth,
        });

        // Monthly weekly spend calculation
        // Find all weeks in current month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        // Find the first Sunday on/after the first day
        const firstSunday = new Date(firstDay);
        firstSunday.setDate(firstDay.getDate() + (7 - firstDay.getDay()) % 7);
        // Build week ranges (start/end dates)
        let weekRanges = [];
        let weekStart = new Date(firstDay);
        while (weekStart.getMonth() === month) {
          let weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekRanges.push({ start: new Date(weekStart), end: new Date(weekEnd) });
          weekStart.setDate(weekStart.getDate() + 7);
        }

        // For each week, sum spend per day
        const weeksData = weekRanges.map(({ start, end }) => {
          const weekSpend = [0,0,0,0,0,0,0];
          receiptsArr.forEach(r => {
            if (!r.timestamp) return;
            const d = new Date(r.timestamp);
            if (d >= start && d <= end) {
              const dayIdx = d.getDay();
              weekSpend[dayIdx] += r.total_amount || 0;
            }
          });
          return weekSpend;
        });
        setMonthlyWeeklySpend(weeksData);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  // Fetch user profile from Firestore
  const fetchProfile = async (autoOpen = false) => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) throw new Error('User not signed in');
      
      // Use the API service instead of direct fetch
      apiService.setUserId(user.uid);
      const res = await fetch(`${apiService.baseURL}/user/${user.uid}`);
      const data = await res.json();
      if (data.success === false) {
        // Use the empty profile from backend, but fill in Firebase info if available
        setProfile({
          ...data,
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
        });
        if (autoOpen) setProfileOpen(true);
      } else if (data.success === true) {
        setProfile({
          ...data,
          uid: data.uid || user.uid,
          name: data.name || user.displayName || '',
          email: data.email || user.email || '',
          phone: data.phone || user.phoneNumber || '',
        });
      } else {
        // Other errors
        let errMsg = 'Failed to fetch profile';
        errMsg = data.error || errMsg;
        setProfileError(errMsg);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to fetch profile');
    }
    setLoadingProfile(false);
  };

  // Save user profile to backend
  const handleProfileSave = async () => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) throw new Error('User not signed in');
      // Always send the full profile object, updating created_at to now
      const updatedProfile = {
        ...profile
      };
      const res = await fetch(`${apiService.baseURL}/user/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save profile');
      }
      setProfileOpen(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile');
    }
    setLoadingProfile(false);
  };

  // Open profile dialog and fetch profile
  const handleProfileClick = () => {
    setProfileOpen(true);
    fetchProfile();
  };

  // On mount, check for profile and auto-open if not found
  // Track if profile check has run to avoid repeated dialog opening
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const auth = getAuth(app);
      // Wait for Firebase Auth to be ready
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (user && !profileChecked) {
          fetchProfile(true);
          fetchRecentActivity();
          setProfileChecked(true);
        }
      });
      return () => unsubscribe();
    };
    checkProfile();
    // eslint-disable-next-line
  }, [profileChecked]);

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
            justifyContent: 'space-between',
            px: 2,
            py: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Raseed
          </Typography>
          <IconButton onClick={handleProfileClick} sx={{ ml: 2 }}>
            <AccountCircleIcon fontSize="large" />
          </IconButton>
        </Box>
      </Box>

      <PageContainer>
        <Box sx={{ pt: 3 }}>
          {/* Greeting & Stats */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Here's your spending overview
            </Typography>
          </Box>
          {/* Stats Cards */}
          <Stack spacing={3} sx={{ mb: 4 }}>
            <Card elevation={2} sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total spend extracted
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 400, mb: 2 }}>
                      {stats.totalSpend}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From {stats.totalReceipts} receipts
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ReceiptIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Card 
                elevation={2} 
                sx={{ 
                  flex: 1, 
                  borderRadius: '16px' 
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Receipts saved
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {stats.totalReceipts}
                  </Typography>
                </CardContent>
              </Card>

              <Card 
                elevation={2} 
                sx={{ 
                  flex: 1, 
                  borderRadius: '16px' 
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This month
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {stats.thisMonth}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Stack>

          {/* Recent Activity */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Recent activity
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/receipts')}
                sx={{ textTransform: 'none' }}
              >
                See all
              </Button>
            </Box>

            <Stack spacing={1}>
              {recentActivity.map((item) => (
                <Card
                  key={item.id}
                  elevation={2}
                  sx={{
                    borderRadius: '12px',
                    cursor: 'pointer',
                    '&:hover': {
                      elevation: 4,
                    },
                  }}
                  onClick={() => {
                    const backendId = String(item.receipt_id || item.id);
                    navigate(`/receipt/${backendId}`);
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: item.color,
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {item.store ? item.store.charAt(0) : '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {item.store || 'Unknown Store'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.total_amount ? `₹${item.total_amount}` : ''}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Weekly Spending Comparison Chart for all weeks in current month */}
          <Box sx={{ mt: 6, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
              Weekly Spend Comparison
            </Typography>
            <Card elevation={2} sx={{ borderRadius: '16px', p: 2 }}>
              <Bar
                data={{
                  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  datasets: monthlyWeeklySpend.map((week, idx) => ({
                    label: `Week ${idx + 1}`,
                    data: week,
                    backgroundColor: `rgba(66,133,244,${0.3 + 0.2 * idx})`,
                    borderRadius: 8,
                  })),
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true },
                    title: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 100 },
                    },
                  },
                }}
                height={260}
              />
            </Card>
          </Box>
        </Box>
      </PageContainer>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent>
          {loadingProfile ? (
            <Typography>Loading...</Typography>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                fullWidth
                sx={{ mt: '5px', mb: '3px' }}
              />
              <TextField
                label="Email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                fullWidth
              />
              <TextField
                label="Preferred Currency"
                value={profile.preferred_currency}
                onChange={e => setProfile({ ...profile, preferred_currency: e.target.value })}
                fullWidth
              />
              <TextField
                label="Monthly Budget"
                type="number"
                value={profile.budget_monthly}
                onChange={e => setProfile({ ...profile, budget_monthly: e.target.value })}
                fullWidth
              />
              {profileError && <Typography color="error">{profileError}</Typography>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleProfileSave} color="primary" disabled={loadingProfile}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => navigate('/upload')}
        sx={{
          position: 'fixed',
          bottom: 88, // Above bottom navigation
          right: 24,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      <BottomNavigation />
    </Box>
  );
};

export default DashboardPage;
