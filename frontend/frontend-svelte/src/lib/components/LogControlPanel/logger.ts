import { log } from './logConfig';
import type { LogLevel } from '$lib/appConfig';
import { NAMESPACES } from '$lib/appConfig';

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
    // Check if the namespace is valid
    if (!NAMESPACES.includes(namespace)) {
        console.error(`INVALID NAMESPACE ERROR: "${namespace}" is not a valid namespace. Valid namespaces are: ${NAMESPACES.join(', ')}`);
    }
    
    // Continue with logging regardless of namespace validity
    log(level, domain, namespace, message, ...args);
} 