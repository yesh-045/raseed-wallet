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
  Alert,
  Skeleton,
  Fade,
  Divider,
  Paper,
  LinearProgress,
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
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  SmartToy as SmartToyIcon,
  Analytics as AnalyticsIcon,
  Savings as SavingsIcon,
  ShoppingCart as ShoppingCartIcon,
  AutoAwesome as AutoAwesomeIcon,
  Security as SecurityIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { chatWithAgent, getAgentStatus } from '../services/api';

// Add custom animations for enhanced UX
const animationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
    40%, 43% { transform: translateY(-8px); }
    70% { transform: translateY(-4px); }
    90% { transform: translateY(-2px); }
  }
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes fadeInScale {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('agent-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'agent-animations';
  styleSheet.type = 'text/css';
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}

const AgentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m **Raseed**, your personal AI financial intelligence agent. I\'ve analyzed your account and I\'m ready to help you:\n\n💰 **Track & Analyze** your spending patterns\n📊 **Generate Insights** from your receipts\n🎯 **Optimize** your budget and savings\n💡 **Recommend** smart financial decisions\n\nWhat would you like to explore first?',
      timestamp: new Date().toISOString(),
      isThinking: false,
      messageType: 'welcome',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Advanced agentic conversation starters
  const quickInsights = [
    { 
      text: 'Analyze my spending patterns this month', 
      icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
      category: 'analysis'
    },
    { 
      text: 'Where can I save money right now?', 
      icon: <LightbulbIcon sx={{ fontSize: 16 }} />,
      category: 'recommendations'
    },
    { 
      text: 'Show me my financial health score', 
      icon: <SpeedIcon sx={{ fontSize: 16 }} />,
      category: 'health'
    },
    { 
      text: 'What are my biggest spending categories?', 
      icon: <AssessmentIcon sx={{ fontSize: 16 }} />,
      category: 'insights'
    },
    { 
      text: 'Help me create a better budget', 
      icon: <AttachMoneyIcon sx={{ fontSize: 16 }} />,
      category: 'planning'
    },
    { 
      text: 'Find unusual spending patterns', 
      icon: <PsychologyIcon sx={{ fontSize: 16 }} />,
      category: 'intelligence'
    },
  ];

  // Check agent status on component mount
  useEffect(() => {
    console.log('🔍 Current user:', currentUser);
    console.log('🔑 Current user UID:', currentUser?.uid);
    
    const checkAgentStatus = async () => {
      try {
        const status = await getAgentStatus();
        setAgentStatus(status);
        setConnectionError(!status.agent_available);
      } catch (error) {
        console.error('Failed to get agent status:', error);
        setConnectionError(true);
      }
    };

    checkAgentStatus();
  }, [currentUser]);

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

    const messageText = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsThinking(true);

    // Simulate intelligent thinking process
    const thinkingSteps = [
      'Analyzing your financial data...',
      'Processing spending patterns...',
      'Generating personalized insights...',
      'Crafting intelligent recommendations...',
      'Finalizing response...'
    ];

    let stepIndex = 0;
    const thinkingInterval = setInterval(() => {
      if (stepIndex < thinkingSteps.length) {
        setThinkingMessage(thinkingSteps[stepIndex]);
        stepIndex++;
      }
    }, 800);

    try {
      // Call the real agent API
      console.log('🎯 Sending message to agent:', messageText);
      console.log('🔑 Using UID:', currentUser?.uid);
      const response = await chatWithAgent(messageText, currentUser?.uid);
      
      clearInterval(thinkingInterval);
      console.log('📥 Agent response:', response);
      
      if (response.success) {
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.response,
          timestamp: response.timestamp,
          actions: generateActionButtons(messageText),
          messageType: 'analysis',
        };
        
        // Add slight delay for better UX
        setTimeout(() => {
          setMessages(prev => [...prev, botResponse]);
          setConnectionError(false);
        }, 300);
      } else {
        // Handle API error with intelligent fallback
        const errorResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.response || '❌ I encountered an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
          messageType: 'error',
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      clearInterval(thinkingInterval);
      console.error('Agent chat error:', error);
      setConnectionError(true);
      
      // Intelligent offline response
      const fallbackResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: '🔌 **I\'m currently offline**, but I can still help with general financial advice.\n\nFor personalized insights based on your actual spending data, please try again when I\'m back online. In the meantime, I can provide:\n\n• General budgeting tips\n• Savings strategies\n• Investment basics\n• Financial planning advice\n\nWhat would you like to know?',
        timestamp: new Date().toISOString(),
        messageType: 'offline',
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setThinkingMessage('');
    }
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

  const handleQuickInsight = (insight) => {
    const query = typeof insight === 'object' ? insight.text : insight;
    setInputValue(query);
    
    // Auto-send the insight query
    setTimeout(() => {
      handleSendMessage(query);
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Advanced message content formatter
  const formatMessageContent = (content, messageType) => {
    // Convert markdown-style formatting to React components
    const formatText = (text) => {
      return text
        .split('\n')
        .map((line, lineIndex) => {
          if (!line.trim()) return <br key={lineIndex} />;
          
          // Handle headers
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <Typography 
                key={lineIndex} 
                variant="subtitle2" 
                sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}
              >
                {line.slice(2, -2)}
              </Typography>
            );
          }
          
          // Handle bullet points
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <Typography 
                key={lineIndex} 
                variant="body2" 
                sx={{ ml: 2, mb: 0.5, display: 'flex', alignItems: 'flex-start' }}
              >
                <span style={{ marginRight: 8, color: '#1976d2' }}>•</span>
                <span dangerouslySetInnerHTML={{ 
                  __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
              </Typography>
            );
          }
          
          // Handle emoji + content lines
          if (/^[🎯💰📊🎯💡📈📋🔍💳⭐]/u.test(line)) {
            return (
              <Box key={lineIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ mr: 1 }}>
                  {line.charAt(0)}
                </Typography>
                <Typography 
                  variant="body2" 
                  dangerouslySetInnerHTML={{ 
                    __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} 
                />
              </Box>
            );
          }
          
          // Regular text with markdown formatting
          return (
            <Typography 
              key={lineIndex} 
              variant="body2" 
              sx={{ mb: 0.5, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ 
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }}
            />
          );
        });
    };
    
    return <Box>{formatText(content)}</Box>;
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
          
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon sx={{ color: 'primary.main' }} />
              Raseed AI Agent
            </Box>
          </Typography>

          {/* Agent Status with Intelligence Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {connectionError && (
              <Chip
                label="Offline Mode"
                size="small"
                color="warning"
                variant="outlined"
                icon={<SpeedIcon />}
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            {agentStatus && agentStatus.agent_available && (
              <Chip
                label={`AI Online • ${agentStatus.tools_count} Tools`}
                size="small"
                color="success"
                variant="outlined"
                icon={<PsychologyIcon />}
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Agent Status Alert */}
        {connectionError && (
          <Alert 
            severity="warning" 
            sx={{ mx: 2, mb: 1 }}
            variant="filled"
            icon={<PsychologyIcon />}
          >
            <Typography variant="body2">
              <strong>Intelligence Engine Offline</strong> - Operating in reduced capability mode. 
              Personal data analysis unavailable.
            </Typography>
          </Alert>
        )}
        
        

        {/* AI Capabilities Showcase */}
        {messages.length <= 2 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
              🤖 Try my AI capabilities:
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
                  label={insight.text}
                  icon={insight.icon}
                  variant="outlined"
                  onClick={() => handleQuickInsight(insight)}
                  sx={{ 
                    fontSize: '0.875rem',
                    borderRadius: '20px',
                    py: 2,
                    px: 1,
                    height: 'auto',
                    '& .MuiChip-label': { 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      whiteSpace: 'normal',
                      textAlign: 'left'
                    },
                    '&:hover': { 
                      bgcolor: 'primary.light',
                      borderColor: 'primary.main',
                      color: 'primary.contrastText',
                      transform: 'translateY(-1px)',
                      boxShadow: 2
                    },
                    transition: 'all 0.2s ease-in-out'
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

          {/* Enhanced Loading & Thinking Indicator */}
          {(isLoading || isThinking) && (
            <ListItem sx={{ px: 0, py: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.5,
                maxWidth: '85%'
              }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'secondary.main',
                  position: 'relative',
                  animation: 'pulse 2s infinite'
                }}>
                  <SmartToyIcon />
                  {/* Active indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 10,
                      height: 10,
                      bgcolor: 'success.main',
                      borderRadius: '50%',
                      border: '2px solid white',
                      animation: 'heartbeat 1.5s ease-in-out infinite',
                    }}
                  />
                </Avatar>
                <Card
                  sx={{
                    bgcolor: 'grey.50',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    borderRadius: '12px 12px 12px 4px',
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    minWidth: 200,
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LinearProgress 
                        sx={{ 
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'primary.main',
                          }
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: 'primary.main',
                        mb: 0.5 
                      }}
                    >
                      🧠 AI Intelligence Engine
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontStyle: 'italic',
                        display: 'block',
                        lineHeight: 1.4
                      }}
                    >
                      {isThinking ? thinkingMessage : 'Analyzing your financial data...'}
                    </Typography>
                  </CardContent>
                </Card>
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
