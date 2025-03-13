import { log } from './logConfig';
import type { LogLevel } from '$lib/logConfig';
import { NAMESPACES } from '$lib/logConfig';

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
    // Extract the base namespace (before the first slash)
    const baseNamespace = namespace.split('/')[0];
    
    // Check if the base namespace is valid
    if (!NAMESPACES.includes(baseNamespace)) {
        console.error(`INVALID NAMESPACE ERROR: "${baseNamespace}" is not a valid namespace. Valid namespaces are: ${NAMESPACES.join(', ')}`);
    }
    
    // Continue with logging regardless of namespace validity
    log(level, domain, namespace, message, ...args);
} 