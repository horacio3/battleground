import { useState, useCallback, useEffect } from 'react';
import { useSessionStorage } from './use-session-storage';

type CodeInterpreterSession = {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  variables?: Record<string, any>;
  lastUpdated: number;
};

/**
 * Custom hook for managing code interpreter session state
 * @param sessionId Unique identifier for the session
 * @returns Methods and state for working with code interpreter sessions
 */
export function useCodeInterpreterSession(sessionId: string) {
  const storageKey = `code-interpreter-session-${sessionId}`;
  
  const [session, setSession] = useSessionStorage<CodeInterpreterSession>(storageKey, {
    messages: [],
    variables: {},
    lastUpdated: Date.now()
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Add a message to the session
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, { role, content }],
      lastUpdated: Date.now()
    }));
  }, [setSession]);
  
  // Clear all messages in the session
  const clearMessages = useCallback(() => {
    setSession(prev => ({
      ...prev,
      messages: [],
      lastUpdated: Date.now()
    }));
  }, [setSession]);
  
  // Set a variable in the session
  const setVariable = useCallback((name: string, value: any) => {
    setSession(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [name]: value
      },
      lastUpdated: Date.now()
    }));
  }, [setSession]);
  
  // Execute code in the session
  const executeCode = useCallback(async (code: string) => {
    if (!code.trim()) return null;
    
    setIsLoading(true);
    addMessage('user', code);
    
    try {
      const response = await fetch('/api/bedrock-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: code,
          sessionId,
          history: session.messages.slice(-10) // Send last 10 messages for context
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to history
      addMessage('assistant', data.text || 'No response');
      
      return {
        text: data.text,
        files: data.files || [],
        sessionId: data.sessionId || sessionId
      };
    } catch (error) {
      console.error('Code interpreter error:', error);
      addMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, session.messages, addMessage]);
  
  return {
    messages: session.messages,
    variables: session.variables || {},
    lastUpdated: session.lastUpdated,
    isLoading,
    addMessage,
    clearMessages,
    setVariable,
    executeCode
  };
}