export const NAMESPACES: string[] = [
    'MultiViewPanel',
    'Generate',
    'LogControlPanel',
    'FileOperations',
    'DocumentEditor',
    // Add other project-specific namespaces here
];
export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

export interface LogDomain {
    id: string;
    label: string;
    description: string;
}

export const LOG_DOMAINS: LogDomain[] = [
    { id: 'network', label: 'Network', description: 'API calls, WebSocket, fetch operations' },
    { id: 'ui', label: 'User Interface', description: 'Component rendering, events, interactions' },
    { id: 'data', label: 'Data Layer', description: 'State management, data transformations' },
    { id: 'auth', label: 'Authentication', description: 'Login, sessions, permissions' },
    { id: 'perf', label: 'Performance', description: 'Timings, optimizations, memory usage' }
];

// To log a message, pass the following information to the logger located at 
// $lib/components/LogControlPanel/logger.ts/logger():
//   - namespace: a string from the NAMESPACES array.
//   - level: one of the LOG_LEVELS (TRACE, DEBUG, INFO, WARN, ERROR, FATAL).
//   - domain: one of the domain ids defined in LOG_DOMAINS (e.g., 'network', 'ui', etc.).
//   - message: a log message string.
//   - ...args: any additional arguments for message formatting.
//
// Example:
// logger('MultiViewPanel', 'INFO', 'ui', 'Coordinates:', x, y);
