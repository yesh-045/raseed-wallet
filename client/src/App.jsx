import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import WelcomePage from './pages/WelcomePage';
import ProcessingStatusPage from './pages/ProcessingStatusPage';
import ReceiptReviewPage from './pages/ReceiptReviewPage';
import WalletPassDetailPage from './pages/WalletPassDetailPage';
import WalletPassPreviewPage from './pages/WalletPassPreviewPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReceiptsPage from './pages/ReceiptsPage';
import WalletPage from './pages/WalletPage';
import InsightsPage from './pages/InsightsPage';
import InsightsAdvancedPage from './pages/InsightsAdvancedPage';
import AgentPage from './pages/AgentPage';
import ReceiptDetailPage from './pages/ReceiptDetailPage';
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A73E8', // Google Blue 600
      light: '#E8F0FE',
      dark: '#1557B0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#26A69A', // Teal 400
      light: '#E0F2F1',
      dark: '#00695C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124',
      secondary: '#5F6368',
    },
    error: {
      main: '#D93025',
      light: '#FCE8E6',
      dark: '#B52D20',
    },
    warning: {
      main: '#F9AB00',
      light: '#FEF7E0',
      dark: '#E37400',
    },
    success: {
      main: '#137333',
      light: '#E6F4EA',
      dark: '#0D652D',
    },
    divider: '#DADCE0',
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontFamily: '"Google Sans", "Roboto", sans-serif',
    },
  },
  spacing: 4, // Base unit: 4px grid
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: '"Google Sans", "Roboto", sans-serif',
          padding: '10px 24px',
          boxShadow: 'none', // Avoid shadows where elevation is used
          '&:hover': {
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)', // Use MUI elevation tokens (1–4)
          },
          '&:focus': {
            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.16)',
          },
          '&:active': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)', // Use MUI elevation tokens
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.14)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Google Sans", "Roboto", sans-serif',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <PrivateRoute>
                  <ReceiptsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <PrivateRoute>
                  <WalletPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <PrivateRoute>
                  <UploadPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/receipt/:id"
              element={
                <PrivateRoute>
                  <ReceiptDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/processing"
              element={
                <PrivateRoute>
                  <ProcessingStatusPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/receipt-review"
              element={
                <PrivateRoute>
                  <ReceiptReviewPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/wallet-preview"
              element={
                <PrivateRoute>
                  <WalletPassDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/agent"
              element={
                <PrivateRoute>
                  <AgentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/wallet/:passId"
              element={
                <PrivateRoute>
                  <WalletPassPreviewPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <PrivateRoute>
                  <InsightsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/insights/advanced"
              element={
                <PrivateRoute>
                  <InsightsAdvancedPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
