import { create } from 'zustand';

interface ChatSettingsStore {
  systemPrompt: string;
  temperature: number;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
}

export const useChatSettings = create<ChatSettingsStore>((set) => ({
  systemPrompt: "You are a helpful assistant...",
  temperature: 0.7,
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setTemperature: (temp) => set({ temperature: temp }),
})); 