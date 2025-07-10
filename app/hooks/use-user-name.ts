import { useState, useEffect } from 'react';

const USER_NAME_KEY = 'wrkinspace_user_name';
const DEFAULT_USER_NAME = 'Anonymous';

// Custom event for user name changes
const USER_NAME_CHANGED_EVENT = 'user-name-changed';

// Global state management
let globalUserName = DEFAULT_USER_NAME;
const listeners = new Set<(name: string) => void>();

// Initialize global state from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(USER_NAME_KEY);
  if (stored) {
    globalUserName = stored;
  }
}

// Notify all listeners when user name changes
const notifyListeners = (newName: string) => {
  globalUserName = newName;
  listeners.forEach(listener => listener(newName));
};

export function useUserName() {
  const [userName, setUserName] = useState<string>(globalUserName);
  const [isLoading, setIsLoading] = useState(true);

  // Load user name from localStorage on mount
  useEffect(() => {
    const storedUserName = localStorage.getItem(USER_NAME_KEY);
    if (storedUserName) {
      setUserName(storedUserName);
      globalUserName = storedUserName;
    }
    setIsLoading(false);
  }, []);

  // Subscribe to user name changes
  useEffect(() => {
    const listener = (newName: string) => {
      setUserName(newName);
    };
    
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Save user name to localStorage and notify all listeners
  const saveUserName = (newUserName: string) => {
    const nameToSave = newUserName.trim() || DEFAULT_USER_NAME;
    localStorage.setItem(USER_NAME_KEY, nameToSave);
    notifyListeners(nameToSave);
  };

  // Get current user name from localStorage (for comparisons)
  const getCurrentUserName = () => {
    return localStorage.getItem(USER_NAME_KEY) || DEFAULT_USER_NAME;
  };

  return {
    userName,
    saveUserName,
    getCurrentUserName,
    isLoading,
    isAnonymous: userName === DEFAULT_USER_NAME
  };
} 