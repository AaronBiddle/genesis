import { useState } from 'react';
import { WindowLayout } from '../types/WindowLayout';

export function useWindowLayout() {
  const [windowLayout, setWindowLayout] = useState<WindowLayout>(null);

  return {
    windowLayout,
    setWindowLayout
  };
} 