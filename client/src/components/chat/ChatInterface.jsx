import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';

const ChatMessage = ({ message, isBot = false, timestamp, isLoading = false }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      mb: 3,
      alignItems: 'flex-start',
      flexDirection: isBot ? 'row' : 'row-reverse',
    }}>
      <Avatar 
        sx={{ 
          bgcolor: isBot ? 'primary.main' : 'secondary.main',
          width: 32,
          height: 32,
        }}
      >
        {isBot ? <SmartToyIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
      </Avatar>
      
      <Box sx={{ 
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isBot ? 'flex-start' : 'flex-end',
      }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isBot ? 'grey.50' : 'primary.main',
            color: isBot ? 'text.primary' : 'primary.contrastText',
            borderRadius: 2,
            borderTopLeftRadius: isBot ? 0.5 : 2,
            borderTopRightRadius: isBot ? 2 : 0.5,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">
                Thinking...
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message}
            </Typography>
          )}
        </Paper>
        
        {timestamp && !isLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const SuggestionChips = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Suggestions:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {suggestions.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            variant="outlined"
            size="small"
            onClick={() => onSuggestionClick(suggestion)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  );
};

const ChatInterface = ({ 
  messages = [], 
  onSendMessage, 
  isLoading = false,
  suggestions = [],
  placeholder = "Ask me anything about your receipts...",
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !disabled && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      minHeight: 400,
    }}>
      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: 2,
        maxHeight: 500,
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            color: 'text.secondary',
            py: 4,
          }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Hi! I'm your receipt assistant
            </Typography>
            <Typography variant="body2">
              Ask me anything about your receipts, expenses, or spending patterns.
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.text}
              isBot={message.isBot}
              timestamp={message.timestamp}
              isLoading={message.isLoading}
            />
          ))
        )}
        
        {isLoading && (
          <ChatMessage
            message=""
            isBot={true}
            isLoading={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2 }}>
        <SuggestionChips 
          suggestions={suggestions} 
          onSuggestionClick={handleSuggestionClick}
        />
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              }
            }}
          />
          
          <IconButton 
            onClick={handleSend}
            disabled={!inputValue.trim() || disabled || isLoading}
            color="primary"
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;
