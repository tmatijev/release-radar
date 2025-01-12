import { useState, useEffect } from 'react';
import { handleApiError } from '../utils/errorHandling';

interface UserInfo {
  email: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { token } = await chrome.identity.getAuthToken({ interactive: false });
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      setUserEmail(data.email);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUserEmail(null);
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { token } = await chrome.identity.getAuthToken({ interactive: true });
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }
      
      const data = await response.json();
      setUserEmail(data.email);
      setIsAuthenticated(true);

      chrome.runtime.sendMessage({ 
        type: 'AUTH_STATE_CHANGED', 
        isAuthenticated: true 
      });
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { token } = await chrome.identity.getAuthToken({ interactive: false });
      
      // Revoke access with Google
      const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${token}`;
      await fetch(revokeUrl);
      
      // Remove from Chrome's cache
      // @ts-ignore
      await chrome.identity.removeCachedAuthToken({ token });
      
      setIsAuthenticated(false);
      setUserEmail(null);

      // Notify background script
      chrome.runtime.sendMessage({ 
        type: 'AUTH_STATE_CHANGED', 
        isAuthenticated: false 
      });
    } catch (err) {
      console.error('Sign out failed:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isAuthenticated,
    userEmail,
    signIn,
    signOut
  };
} 