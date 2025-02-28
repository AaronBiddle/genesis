import { log, type LogLevel } from './logConfig';

/**
 * Log a message with the given namespace, level, domain, and message.
 * 
 * @example
 * logger('frontend.components.ChatBox', 'DEBUG', 'ui', 'Rendering component');
 * 
 * @example
 * logger('frontend.services.ApiService', 'INFO', 'network', 'Sending API request', { url, method, payload });
 */
export function logger(namespace: string, level: LogLevel, domain: string, message: string, ...args: any[]): void {
    log(level, message, namespace, domain, ...args);
} 