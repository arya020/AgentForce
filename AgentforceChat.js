// AgentforceChat.js - React Native Chat Component using Agentforce API

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AgentforceService from './AgentforceService';

const AgentforceChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const flatListRef = useRef(null);
  const agentforceService = useRef(new AgentforceService()).current;

  useEffect(() => {
    initializeSession();
    return () => {
      // Cleanup: End session when component unmounts
      if (sessionInfo) {
        agentforceService.endSession().catch(console.error);
      }
    };
  }, []);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      //await agentforceService.current.getAccessToken();
      const session = await agentforceService.createAgentSession();
      setSessionInfo(session);
      setIsConnected(true);

      // Add welcome message
      setMessages([{
        id: '1',
        text: 'Hello! I\'m your Salesforce AI agent. How can I help you today?',
        sender: 'agent',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      Alert.alert('Connection Error', 'Failed to connect to Salesforce agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await agentforceService.sendMessage(inputText);

      const agentMessage = {
        id: (Date.now() + 1).toString(),
        text: response || 'I received your message but couldn\'t process it properly.',
        sender: 'agent',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    try {
      await agentforceService.endSession();
      setIsConnected(false);
      setSessionInfo(null);
      setMessages([]);
      Alert.alert('Session Ended', 'Your chat session has been ended.');
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session properly.');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.agentMessage,
      item.isError && styles.errorMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userMessageText : styles.agentMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agentforce Assistant</Text>
        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusIndicator,
            isConnected ? styles.connected : styles.disconnected
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        {isConnected && (
          <TouchableOpacity onPress={endSession} style={styles.endButton}>
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.loadingText}>Agent is typing...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          editable={isConnected && !isLoading}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading || !isConnected) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || !isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Reconnect button if disconnected */}
      {!isConnected && (
        <TouchableOpacity style={styles.reconnectButton} onPress={initializeSession}>
          <Text style={styles.reconnectButtonText}>Reconnect</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19191b',
  },
  header: {
    backgroundColor: '#1e1e1e',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  connected: {
    backgroundColor: '#19191b',
  },
  disconnected: {
    backgroundColor: '#19191b',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
  endButton: {
    backgroundColor: '#363636',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  endButtonText: {
    color: 'white',
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6a53e7',
  },
  agentMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#19191b',
  },
  errorMessage: {
    backgroundColor: '#19191b',
    borderColor: '#ff4444',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  userMessageText: {
    color: 'white',
  },
  agentMessageText: {
    color: '#f5f5f5',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#19191b',
    borderTopWidth: 1,
    borderTopColor: '#363636',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#363636',
    color: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6a53e7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#363636',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reconnectButton: {
    backgroundColor: '#19191b',
    margin: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  reconnectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AgentforceChat;