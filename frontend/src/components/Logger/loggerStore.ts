import { ref, reactive, watch, computed } from 'vue';
import { initialNamespaces } from './namespaces'; // Import initial namespaces

export interface LogEntry {
  namespace: string;
  message: string;
  isError: boolean;
  timestamp: number;
  windowId?: string | number; // Added optional windowId
}

const STORAGE_KEY_NAMESPACES = 'logger_enabled_namespaces';
const STORAGE_KEY_STORE_DISABLED = 'logger_store_disabled_pref'; // New key for the setting

// --- Reactive State ---
const allLogs = ref<LogEntry[]>([]);
const availableNamespaces = ref<string[]>([...initialNamespaces]); // Use imported namespaces
const enabledNamespaces = reactive<Record<string, boolean>>({});
const storeDisabledLogs = ref<boolean>(true); // New state: default to true (store all)

// --- Internal Functions ---
const saveEnabledNamespaces = () => {
  try {
    localStorage.setItem(STORAGE_KEY_NAMESPACES, JSON.stringify(enabledNamespaces));
  } catch (e) {
    console.error("Failed to save logger namespace settings:", e);
  }
};

const saveStoreDisabledPreference = () => {
    try {
        localStorage.setItem(STORAGE_KEY_STORE_DISABLED, JSON.stringify(storeDisabledLogs.value));
    } catch (e) {
        console.error("Failed to save logger store disabled preference:", e);
    }
};

// Renamed function to load all settings
const loadSettings = () => {
  // Load Namespace Settings
  // Clear existing reactive state before loading/setting defaults
  availableNamespaces.value = [...initialNamespaces];
  Object.keys(enabledNamespaces).forEach(key => delete enabledNamespaces[key]);

  try {
    const storedNamespaceSettings = localStorage.getItem(STORAGE_KEY_NAMESPACES);
    if (storedNamespaceSettings) {
      const parsedSettings = JSON.parse(storedNamespaceSettings);
      // Ensure only known namespaces from parsed settings are loaded initially
      // Also pre-populate with available namespaces
      const initialAvailable = new Set(availableNamespaces.value);
      Object.keys(parsedSettings).forEach(ns => initialAvailable.add(ns));
      availableNamespaces.value = Array.from(initialAvailable);

      availableNamespaces.value.forEach(ns => {
        // Default to true if namespace is new or wasn't stored as false
        enabledNamespaces[ns] = parsedSettings[ns] !== false;
      });

    } else {
      // Default all initially available namespaces to enabled if nothing is stored
      availableNamespaces.value.forEach(ns => {
        enabledNamespaces[ns] = true;
      });
      saveEnabledNamespaces(); // Save the defaults
    }
  } catch (e) {
    console.error("Failed to load logger namespace settings:", e);
    // Fallback: enable all available namespaces
    availableNamespaces.value.forEach(ns => {
        enabledNamespaces[ns] = true;
    });
  }

  // Load Store Disabled Preference
  try {
    const storedStoreDisabledPref = localStorage.getItem(STORAGE_KEY_STORE_DISABLED);
    if (storedStoreDisabledPref !== null) {
        storeDisabledLogs.value = JSON.parse(storedStoreDisabledPref);
    } else {
        storeDisabledLogs.value = true; // Default to true if not found
        saveStoreDisabledPreference(); // Save the default
    }
  } catch (e) {
     console.error("Failed to load logger store disabled preference:", e);
     storeDisabledLogs.value = true; // Fallback to true
  }
};

// Function to clear stored settings and reset state
const clearNamespaceSettings = () => {
  log('LoggerInternal', 'Clearing stored namespace settings and resetting state.'); // Log the action
  try {
    localStorage.removeItem(STORAGE_KEY_NAMESPACES);
    // Optionally clear the storeDisabledLogs preference too, or keep it separate?
    // Let's keep it separate for now. User can toggle it if they want to reset.
    // localStorage.removeItem(STORAGE_KEY_STORE_DISABLED);

    // Reset reactive state to initial defaults
    availableNamespaces.value = [...initialNamespaces];
    Object.keys(enabledNamespaces).forEach(key => delete enabledNamespaces[key]);
    initialNamespaces.forEach(ns => {
        enabledNamespaces[ns] = true;
    });
    // Note: We don't clear allLogs here, that's separate
  } catch (e) {
    log('LoggerInternal', 'Failed to clear namespace settings from localStorage', true);
    console.error("Failed to clear namespace settings:", e);
  }
};

// --- Exported Functions & State ---

export function useLogger() {
    const filteredLogs = computed(() => {
      return allLogs.value.filter(log => 
        log.isError || isNamespaceEnabled(log.namespace)
      );
    });

    const isNamespaceEnabled = (namespace: string): boolean => {
      // Default to true if not specifically disabled
      return enabledNamespaces[namespace] !== false;
    };

    const toggleNamespace = (namespace: string) => {
      enabledNamespaces[namespace] = !isNamespaceEnabled(namespace);
      saveEnabledNamespaces();
    };

    const toggleStoreDisabledLogs = () => {
        storeDisabledLogs.value = !storeDisabledLogs.value;
        saveStoreDisabledPreference();
    };

    const clearLogs = () => {
        allLogs.value = [];
    };

    // Load settings once when the store is initialized/used
    // Note: This runs when useLogger is first called.
    if (Object.keys(enabledNamespaces).length === 0) { // Check if namespaces are loaded as a proxy for settings load
        loadSettings();
    }

    return {
        allLogs,
        availableNamespaces,
        enabledNamespaces,
        filteredLogs,
        isNamespaceEnabled,
        toggleNamespace,
        clearLogs,
        clearNamespaceSettings,
        storeDisabledLogs, // Export new state
        toggleStoreDisabledLogs // Export toggle function
    };
}

export const log = (namespace: string, message: string, isError: boolean = false, windowId?: string | number) => {
  // Determine if the namespace is currently enabled
  const namespaceIsEnabled = enabledNamespaces[namespace] !== false;

  // Determine if this log entry should be added to allLogs
  // Add if:
  // 1. It's an error OR
  // 2. Storing disabled logs is enabled OR
  // 3. Storing disabled logs is disabled BUT the namespace is enabled
  const shouldStoreLog = isError || storeDisabledLogs.value || (!storeDisabledLogs.value && namespaceIsEnabled);

  if (shouldStoreLog) {
    const newLog: LogEntry = {
        namespace,
        message,
        isError,
        timestamp: Date.now(),
        windowId
    };
    allLogs.value.push(newLog);
  }

  // Add namespace if it's new and ensure it has an enabled/disabled state
  if (!availableNamespaces.value.includes(namespace)) {
    availableNamespaces.value.push(namespace);
    if (enabledNamespaces[namespace] === undefined) {
        enabledNamespaces[namespace] = true; // Default new namespaces to true
        saveEnabledNamespaces();
    }
  }

  // Construct the log prefix based on whether windowId is provided
  const logPrefix = windowId !== undefined ? `[${namespace}:${windowId}]` : `[${namespace}]`;

  // Always log errors to console, regardless of namespace setting
  if (isError) {
    console.error(logPrefix, message);
  } else if (namespaceIsEnabled) { // Only check if namespace is enabled for console.log
    console.log(logPrefix, message);
  }
};

// Watch availableNamespaces to ensure enabledNamespaces stays in sync
// This might be redundant now as we handle new namespaces within log()
// but keeping it for safety in case namespaces are added externally somehow.
watch(availableNamespaces, (newNamespaces) => {
    let updated = false;
    newNamespaces.forEach(ns => {
        if (enabledNamespaces[ns] === undefined) {
            enabledNamespaces[ns] = true; // Default new namespaces to true
            updated = true;
        }
    });
    if (updated) {
        saveEnabledNamespaces();
    }
}, { deep: true });

// Initialize by loading settings when the store module is first loaded
loadSettings(); 