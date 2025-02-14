import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

interface LoggingStore {
  level: LogLevel;
  setLevel: (level: LogLevel) => void;
  log: (level: LogLevel, namespace: string, message: string, data?: any) => void;
}

export const useLoggingStore = create<LoggingStore>()(
  persist(
    (set, get) => ({
      level: LogLevel.INFO,
      setLevel: (level: LogLevel) => set({ level }),
      log: (level: LogLevel, namespace: string, message: string, data?: any) => {
        if (level <= get().level) {
          const prefix = `${namespace}`;
          
          switch (level) {
            case LogLevel.ERROR:
              console.error(`${prefix} ${message}`, data);
              break;
            case LogLevel.WARN:
              console.warn(`${prefix} ${message}`, data);
              break;
            case LogLevel.INFO:
              console.info(`${prefix} ${message}`, data);
              break;
            case LogLevel.DEBUG:
            case LogLevel.TRACE:
              console.debug(`${prefix} ${message}`, data);
              break;
          }
        }
      }
    }),
    {
      name: 'logging-storage',
    }
  )
); 