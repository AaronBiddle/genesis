import { writable, type Updater, get } from 'svelte/store';

// Common log levels (in order of increasing severity)
export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

export interface LogDomain {
    id: string;
    label: string;
    description: string;
}

// Log domains represent functional areas across the application
export const LOG_DOMAINS: LogDomain[] = [
    { id: 'network', label: 'Network', description: 'API calls, WebSocket, fetch operations' },
    { id: 'ui', label: 'User Interface', description: 'Component rendering, events, interactions' },
    { id: 'data', label: 'Data Layer', description: 'State management, data transformations' },
    { id: 'auth', label: 'Authentication', description: 'Login, sessions, permissions' },
    { id: 'perf', label: 'Performance', description: 'Timings, optimizations, memory usage' }
];

// Namespaces represent specific modules or components
// In a real app, these might be dynamically registered by different modules
export const NAMESPACES: string[] = [
    'frontend.components.MultiViewPanel',
    'frontend.components.ChatBox'
];

export type NamespaceFilterType = 'include' | 'exclude';

export interface LogConfiguration {
    globalLevel: LogLevel;
    domainOverrides: Record<string, LogLevel>;
    enabledDomains: string[];
    namespaceFilters: string[];
    namespaceFilterType: NamespaceFilterType;
}

// Default log configuration
export const DEFAULT_LOG_CONFIG: LogConfiguration = {
    globalLevel: 'INFO',
    domainOverrides: {}, // e.g., { network: 'DEBUG' }
    enabledDomains: LOG_DOMAINS.map(d => d.id), // All domains enabled by default
    namespaceFilters: [], // Empty means all namespaces
    namespaceFilterType: 'include' // 'include' or 'exclude'
};

// Create a writable store with localStorage persistence
function createPersistedLogStore() {
    // Try to load persisted state from localStorage
    let initialValue = DEFAULT_LOG_CONFIG;
    
    try {
        const persistedValue = localStorage.getItem('logConfig');
        if (persistedValue) {
            const parsedValue = JSON.parse(persistedValue);
            // Basic validation to ensure the parsed value has the expected structure
            if (parsedValue && 
                typeof parsedValue === 'object' && 
                typeof parsedValue.globalLevel === 'string' &&
                Array.isArray(parsedValue.enabledDomains)) {
                initialValue = parsedValue;
            }
        }
    } catch (error) {
        console.error('Failed to load persisted log configuration:', error);
    }
    
    // Create the store with the initial value
    const store = writable<LogConfiguration>(initialValue);
    
    // Subscribe to changes and persist to localStorage
    const unsubscribe = store.subscribe(value => {
        try {
            localStorage.setItem('logConfig', JSON.stringify(value));
        } catch (error) {
            console.error('Failed to persist log configuration:', error);
        }
    });
    
    // Extend store with additional methods
    return {
        ...store,
        updateGlobalLevel: (level: LogLevel) => {
            store.update(config => ({
                ...config,
                globalLevel: level
            }));
        },
        updateDomainLevel: (domain: string, level: LogLevel) => {
            store.update(config => ({
                ...config, 
                domainOverrides: {
                    ...config.domainOverrides,
                    [domain]: level
                }
            }));
        },
        resetDomainLevel: (domain: string) => {
            store.update(config => {
                const newOverrides = { ...config.domainOverrides };
                delete newOverrides[domain];
                return {
                    ...config,
                    domainOverrides: newOverrides
                };
            });
        },
        toggleDomain: (domain: string) => {
            store.update(config => {
                const enabledDomains = [...config.enabledDomains];
                const index = enabledDomains.indexOf(domain);
                
                if (index >= 0) {
                    enabledDomains.splice(index, 1);
                } else {
                    enabledDomains.push(domain);
                }
                
                return {
                    ...config,
                    enabledDomains
                };
            });
        },
        addNamespaceFilter: (namespace: string) => {
            store.update(config => {
                if (!config.namespaceFilters.includes(namespace)) {
                    return {
                        ...config,
                        namespaceFilters: [...config.namespaceFilters, namespace]
                    };
                }
                return config;
            });
        },
        removeNamespaceFilter: (namespace: string) => {
            store.update(config => ({
                ...config,
                namespaceFilters: config.namespaceFilters.filter(ns => ns !== namespace)
            }));
        },
        toggleNamespaceFilterType: () => {
            store.update(config => ({
                ...config,
                namespaceFilterType: config.namespaceFilterType === 'include' ? 'exclude' : 'include'
            }));
        },
        // New category-specific reset functions
        resetLevels: () => {
            store.update(config => ({
                ...config,
                globalLevel: DEFAULT_LOG_CONFIG.globalLevel,
                domainOverrides: {} // Clear all domain overrides
            }));
        },
        resetDomains: () => {
            store.update(config => ({
                ...config,
                enabledDomains: [] // Clear all enabled domains
            }));
        },
        resetNamespaces: () => {
            store.update(config => ({
                ...config,
                namespaceFilters: [], // Clear all namespace filters
                namespaceFilterType: DEFAULT_LOG_CONFIG.namespaceFilterType
            }));
        },
        resetToDefaults: () => {
            store.set(DEFAULT_LOG_CONFIG);
        }
    };
}

// Export a singleton instance of the store
export const logConfigStore = createPersistedLogStore();

// Example of how to use the logger (can be exported as a utility)
export function shouldLog(
    level: LogLevel, 
    namespace: string, 
    domain?: string
): boolean {
    const config = get(logConfigStore);
    
    // Check if the domain is enabled
    if (domain && !config.enabledDomains.includes(domain)) {
        return false;
    }
    
    // Apply namespace filtering
    if (config.namespaceFilters.length > 0) {
        const isNamespaceIncluded = config.namespaceFilters.some(filter => 
            namespace.startsWith(filter)
        );
        
        if ((config.namespaceFilterType === 'include' && !isNamespaceIncluded) ||
            (config.namespaceFilterType === 'exclude' && isNamespaceIncluded)) {
            return false;
        }
    }
    
    // Check domain-specific level override
    if (domain && config.domainOverrides[domain]) {
        const domainLevel = config.domainOverrides[domain];
        return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(domainLevel);
    }
    
    // Fall back to global level
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(config.globalLevel);
}

// Helper function to actually log messages (example implementation)
export function log(
    level: LogLevel,
    message: string,
    namespace: string,
    domain?: string,
    ...args: any[]
): void {
    if (!shouldLog(level, namespace, domain)) {
        return;
    }
    
    const timestamp = new Date().toISOString();
    const domainStr = domain ? `[${domain}] ` : '';
    
    switch (level) {
        case 'TRACE':
            console.debug(`${timestamp} TRACE ${domainStr}${namespace}:`, message, ...args);
            break;
        case 'DEBUG':
            console.debug(`${timestamp} DEBUG ${domainStr}${namespace}:`, message, ...args);
            break;
        case 'INFO':
            console.info(`${timestamp} INFO ${domainStr}${namespace}:`, message, ...args);
            break;
        case 'WARN':
            console.warn(`${timestamp} WARN ${domainStr}${namespace}:`, message, ...args);
            break;
        case 'ERROR':
            console.error(`${timestamp} ERROR ${domainStr}${namespace}:`, message, ...args);
            break;
        case 'FATAL':
            console.error(`${timestamp} FATAL ${domainStr}${namespace}:`, message, ...args);
            break;
    }
} 