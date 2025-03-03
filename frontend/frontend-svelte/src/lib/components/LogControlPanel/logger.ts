import { log } from './logConfig';
import type { LogLevel } from '$lib/appConfig';

/**
 * Log a message with the given namespace, level, domain, and message.
 * 
 * @example
 * logger('frontend.components.ChatBox', 'DEBUG', 'ui', 'Rendering component');
 * 
 * @example
 * logger('frontend.services.ApiService', 'INFO', 'network', 'Sending API request', { url, method, payload });
 */
export function logger(level: LogLevel, domain: string, namespace: string, message: string, ...args: any[]): void {
    log(level, domain, namespace, message, ...args);
} 