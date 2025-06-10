import { useState, useCallback, useEffect } from 'react';
import { getSessionMessages, storeSessionMessages } from '@/lib/persist-session';

type CodeInterpreterOptions = {
  sessionId: string;
  onError?: (error: Error) => void;
};

type MessageType = {
  role: 'user' | 'assistant';
  content: string;
};

export function useCodeInterpreter({ sessionId, onError }: CodeInterpreterOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MessageType[]>([]);
  
  // Load history from session storage on mount
  useEffect(() => {
    if (sessionId) {
      const savedMessages = getSessionMessages(sessionId);
      if (savedMessages && savedMessages.length > 0) {
        setHistory(savedMessages);
      }
    }
  }, [sessionId]);
  
  // Save history to session storage when it changes
  useEffect(() => {
    if (sessionId && history.length > 0) {
      storeSessionMessages(sessionId, history);
    }
  }, [sessionId, history]);

  const executeCode = useCallback(async (input: string) => {
    if (!input.trim()) return null;
    
    setIsLoading(true);
    
    try {
      // Add user message to history
      const userMessage = { role: 'user' as const, content: input };
      const updatedHistory = [...history, userMessage];
      setHistory(updatedHistory);
      
      // Send request to API
      const response = await fetch('/api/bedrock-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          history: updatedHistory.slice(-10) // Send last 10 messages for context
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to history
      const assistantMessage = { role: 'assistant' as const, content: data.text };
      setHistory([...updatedHistory, assistantMessage]);
      
      return {
        text: data.text,
        files: data.files || [],
        sessionId: data.sessionId || sessionId
      };
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        console.error('Code interpreter error:', error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [history, sessionId, onError]);

  return {
    executeCode,
    isLoading,
    history,
    clearHistory: () => setHistory([])
  };
}