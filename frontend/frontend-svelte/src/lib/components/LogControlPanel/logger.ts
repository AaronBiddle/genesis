import { log, type LogLevel } from './logConfig';

/**
 * Simple logger class that provides an easy-to-use interface for components
 * to log messages with proper namespace and domain information.
 */
export class Logger {
    private namespace: string;
    private domain?: string;
    
    /**
     * Create a new logger instance
     * 
     * @param namespace The namespace for this logger, usually the component name
     * @param domain Optional domain this component belongs to (e.g., 'ui', 'network')
     */
    constructor(namespace: string, domain?: string) {
        this.namespace = namespace;
        this.domain = domain;
    }
    
    /**
     * Log a message at TRACE level
     */
    trace(message: string, ...args: any[]): void {
        log('TRACE', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Log a message at DEBUG level
     */
    debug(message: string, ...args: any[]): void {
        log('DEBUG', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Log a message at INFO level
     */
    info(message: string, ...args: any[]): void {
        log('INFO', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Log a message at WARN level
     */
    warn(message: string, ...args: any[]): void {
        log('WARN', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Log a message at ERROR level
     */
    error(message: string, ...args: any[]): void {
        log('ERROR', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Log a message at FATAL level
     */
    fatal(message: string, ...args: any[]): void {
        log('FATAL', message, this.namespace, this.domain, ...args);
    }
    
    /**
     * Manually log at a specific level
     */
    log(level: LogLevel, message: string, ...args: any[]): void {
        log(level, message, this.namespace, this.domain, ...args);
    }
}

/**
 * Create a logger for a specific namespace and optional domain
 * 
 * @example
 * // In a UI component
 * const logger = getLogger('frontend.components.ChatBox', 'ui');
 * logger.debug('Rendering component');
 * 
 * @example
 * // In a network service
 * const logger = getLogger('frontend.services.ApiService', 'network');
 * logger.info('Sending API request', { url, method, payload });
 */
export function getLogger(namespace: string, domain?: string): Logger {
    return new Logger(namespace, domain);
} 