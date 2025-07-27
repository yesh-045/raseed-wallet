import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Receipt as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from '../components';

const AgentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m your AI receipt assistant. I can help you analyze your spending patterns, search for specific receipts, or provide insights about your expenses.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);

  // Quick insight chips for common queries
  const quickInsights = [
    'This month\'s grocery spend',
    'Top merchants',
    'Average daily spend',
    'Coffee shop visits',
    'Weekend vs weekday spending',
    'Last week\'s total',
  ];

  // Initialize speech recognition on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = () => {
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Handle initial context from navigation state
  useEffect(() => {
    const initialContext = location.state?.context;
    const initialMessage = location.state?.message;
    
    if (initialContext && initialMessage) {
      // Clear navigation state and set initial input
      setInputValue(initialMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceToggle = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response with more realistic delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateBotResponse(inputValue),
        timestamp: new Date().toISOString(),
        actions: generateActionButtons(inputValue),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1200);
  };

  const generateActionButtons = (query) => {
    const lowerQuery = query.toLowerCase();
    const actions = [];

    if (lowerQuery.includes('receipt') || lowerQuery.includes('find') || lowerQuery.includes('show')) {
      actions.push({
        label: 'View Receipts',
        action: () => navigate('/receipts'),
        icon: 'receipt'
      });
    }

    if (lowerQuery.includes('summary') || lowerQuery.includes('wallet') || lowerQuery.includes('total')) {
      actions.push({
        label: 'Open Wallet',
        action: () => navigate('/wallet'),
        icon: 'wallet'
      });
    }

    return actions.length > 0 ? actions : null;
  };

  const generateBotResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Enhanced responses with more specific data
    if (lowerQuery.includes('grocery') || lowerQuery.includes('groceries')) {
      return 'This month you\'ve spent $284.67 on groceries across 8 trips. Your main stores are:\n• Whole Foods: $156.30 (3 visits)\n• Trader Joe\'s: $89.45 (3 visits)\n• Local Market: $38.92 (2 visits)\n\nAverage per trip: $35.58';
    }
    
    if (lowerQuery.includes('coffee') || lowerQuery.includes('starbucks')) {
      return 'Coffee spending this month: $78.40 across 12 visits\n• Starbucks: $52.20 (8 visits)\n• Local Café: $26.20 (4 visits)\n\nYour most frequent order appears to be around $6.50. Peak coffee times: 8-9 AM and 2-3 PM.';
    }
    
    if (lowerQuery.includes('top merchants') || lowerQuery.includes('top 5')) {
      return 'Your top merchants this month:\n1. Starbucks - $52.20 (8 transactions)\n2. Whole Foods - $156.30 (3 transactions)\n3. Shell Gas - $89.40 (4 transactions)\n4. Amazon - $234.10 (6 transactions)\n5. Target - $78.50 (2 transactions)\n\nTotal: $610.50 across 23 transactions';
    }
    
    if (lowerQuery.includes('daily') || lowerQuery.includes('average daily')) {
      return 'Your average daily spending this month is $28.73.\n\nBreakdown:\n• Weekdays: $32.45/day\n• Weekends: $19.85/day\n• Highest day: $89.40 (Jan 15th)\n• Lowest day: $4.50 (Jan 3rd)';
    }
    
    if (lowerQuery.includes('this month') || lowerQuery.includes('monthly')) {
      return 'January 2024 spending summary:\n• Total: $862.19\n• Transactions: 31\n• Categories:\n  - Food & Dining: $341.27\n  - Gas & Transport: $127.85\n  - Shopping: $312.60\n  - Other: $80.47\n\nCompared to last month: +12.4%';
    }
    
    if (lowerQuery.includes('week') || lowerQuery.includes('weekly')) {
      return 'This week\'s spending: $127.43 across 9 transactions\n\n• Monday: $23.50 (Starbucks, lunch)\n• Tuesday: $45.20 (Grocery shopping)\n• Wednesday: $18.75 (Coffee, snacks)\n• Thursday: $32.40 (Gas station)\n• Friday: $7.58 (Coffee)\n\nWeekend spending: Not yet recorded.';
    }
    
    if (lowerQuery.includes('weekend') || lowerQuery.includes('weekday')) {
      return 'Spending pattern analysis:\n\n**Weekdays** (Mon-Fri):\n• Average: $32.45/day\n• Main categories: Coffee, lunch, commute\n• Peak: Thursday ($45.20 avg)\n\n**Weekends** (Sat-Sun):\n• Average: $19.85/day\n• Main categories: Groceries, entertainment\n• More varied transaction amounts';
    }
    
    // Default response for unrecognized queries
    return 'I can help you analyze your spending patterns from your existing receipts. Try asking about:\n• Specific merchants or categories\n• Time periods (this week, last month)\n• Spending comparisons\n• Transaction details\n\nWhat would you like to know about your expenses?';
  };

  const handleQuickInsight = (insight) => {
    setInputValue(insight);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      bgcolor: 'background.default',
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
            AI Assistant
          </Typography>
        </Box>

        {/* Quick Insight Chips */}
        {messages.length <= 2 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Quick insights:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              overflowX: 'auto',
              pb: 1,
            }}>
              {quickInsights.map((insight, index) => (
                <Chip
                  key={index}
                  label={insight}
                  variant="outlined"
                  onClick={() => handleQuickInsight(insight)}
                  sx={{ 
                    fontSize: '0.875rem',
                    borderRadius: '16px',
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Messages Container */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        py: 2,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        mb: '140px', // Space for input area
      }}>
        {/* Messages List */}
        <List sx={{ flex: 1, p: 0 }}>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                px: 0,
                py: 1,
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                maxWidth: '85%',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                    mt: 0.5,
                  }}
                >
                  {message.type === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                
                <Box sx={{ minWidth: 0 }}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: message.type === 'user' ? 'primary.main' : 'grey.50',
                      color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: message.type === 'user' ? 'primary.main' : 'divider',
                      ...(message.type === 'user' && {
                        borderBottomRightRadius: 6,
                      }),
                      ...(message.type === 'bot' && {
                        borderBottomLeftRadius: 6,
                      }),
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-line',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {message.content}
                      </Typography>

                      {/* Action Buttons */}
                      {message.actions && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              size="small"
                              startIcon={action.icon === 'receipt' ? <ReceiptIcon /> : <WalletIcon />}
                              onClick={action.action}
                              sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderColor: 'divider',
                                color: 'text.secondary',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                }
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      px: 1,
                      textAlign: message.type === 'user' ? 'right' : 'left',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <BotIcon />
                </Avatar>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing your data...
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          )}
        </List>

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area - Fixed at bottom */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 64, // Above bottom navigation
        left: 0,
        right: 0,
        p: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: 1000,
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', maxWidth: '100%', mx: 'auto' }}>
          {/* Voice Button */}
          <IconButton
            onClick={handleVoiceToggle}
            disabled={isLoading}
            sx={{
              bgcolor: isRecording ? 'error.main' : 'action.hover',
              color: isRecording ? 'white' : 'text.secondary',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: isRecording ? 'error.dark' : 'action.selected',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </IconButton>

          {/* Text Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your spending patterns..."
            variant="outlined"
            size="small"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: 'background.default',
              }
            }}
          />
          
          {/* Send Button */}
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Recording indicator */}
        {isRecording && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 1,
            color: 'error.main',
            fontSize: '0.875rem',
            justifyContent: 'center',
          }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            <Typography variant="caption" color="error.main">
              Recording... Tap to stop
            </Typography>
          </Box>
        )}
      </Box>

      <BottomNavigation />
    </Box>
  );
};

export default AgentPage;
