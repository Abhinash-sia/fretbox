'use client';

import * as React from 'react';
import { ChatMessage, FaqCategory } from '../types/ai';

interface AiDrawerContextType {
  isOpen: boolean;
  openDrawer: (prompt?: string, category?: FaqCategory) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  selectedCategory: FaqCategory | 'ALL';
  setSelectedCategory: (cat: FaqCategory | 'ALL') => void;
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

const AiDrawerContext = React.createContext<AiDrawerContextType | undefined>(undefined);

export function AiDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<FaqCategory | 'ALL'>('ALL');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const openDrawer = React.useCallback((prompt?: string, category?: FaqCategory) => {
    if (category) {
      setSelectedCategory(category);
    }
    setIsOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const addMessage = React.useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearMessages = React.useCallback(() => {
    setMessages([]);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      selectedCategory,
      setSelectedCategory,
      messages,
      addMessage,
      clearMessages,
    }),
    [isOpen, openDrawer, closeDrawer, toggleDrawer, selectedCategory, messages, addMessage, clearMessages],
  );

  return <AiDrawerContext.Provider value={value}>{children}</AiDrawerContext.Provider>;
}

export function useAiDrawer() {
  const context = React.useContext(AiDrawerContext);
  if (!context) {
    throw new Error('useAiDrawer must be used within an AiDrawerProvider');
  }
  return context;
}
