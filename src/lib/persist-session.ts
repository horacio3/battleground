/**
 * Utility functions for persisting and retrieving session data for code interpreter
 */

// Store session data in localStorage
export const storeSessionData = (sessionId: string, data: any) => {
  try {
    const sessionKey = `code-interpreter-session-${sessionId}`;
    localStorage.setItem(sessionKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to store session data:", error);
    return false;
  }
};

// Retrieve session data from localStorage
export const getSessionData = (sessionId: string) => {
  try {
    const sessionKey = `code-interpreter-session-${sessionId}`;
    const data = localStorage.getItem(sessionKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to retrieve session data:", error);
    return null;
  }
};

// Clear session data from localStorage
export const clearSessionData = (sessionId: string) => {
  try {
    const sessionKey = `code-interpreter-session-${sessionId}`;
    localStorage.removeItem(sessionKey);
    return true;
  } catch (error) {
    console.error("Failed to clear session data:", error);
    return false;
  }
};

// Store the last N messages for a session
export const storeSessionMessages = (sessionId: string, messages: any[], maxMessages = 20) => {
  try {
    // Only store the last maxMessages
    const messagesToStore = messages.slice(-maxMessages);
    return storeSessionData(sessionId, { messages: messagesToStore });
  } catch (error) {
    console.error("Failed to store session messages:", error);
    return false;
  }
};

// Get messages for a session
export const getSessionMessages = (sessionId: string) => {
  try {
    const data = getSessionData(sessionId);
    return data?.messages || [];
  } catch (error) {
    console.error("Failed to get session messages:", error);
    return [];
  }
};