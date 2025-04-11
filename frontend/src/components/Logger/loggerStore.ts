import { ref, reactive, watch, computed } from 'vue';

export interface LogEntry {
  namespace: string;
  message: string;
  isError: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'logger_enabled_namespaces';

// --- Reactive State ---
const allLogs = ref<LogEntry[]>([]);
const availableNamespaces = ref<string[]>(['FileManager.vue']); // Start with a default
const enabledNamespaces = reactive<Record<string, boolean>>({});

// --- Internal Functions ---
const saveEnabledNamespaces = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledNamespaces));
  } catch (e) {
    console.error("Failed to save logger namespace settings:", e);
  }
};

const loadEnabledNamespaces = () => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
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
};

// --- Exported Functions & State ---

export function useLogger() {
    const filteredLogs = computed(() => {
      return allLogs.value.filter(log => isNamespaceEnabled(log.namespace));
    });

    const isNamespaceEnabled = (namespace: string): boolean => {
      // Default to true if not specifically disabled
      return enabledNamespaces[namespace] !== false;
    };

    const toggleNamespace = (namespace: string) => {
      enabledNamespaces[namespace] = !isNamespaceEnabled(namespace);
      saveEnabledNamespaces();
    };

    const clearLogs = () => {
        allLogs.value = [];
    };

    // Load settings once when the store is initialized/used
    // Note: This runs when useLogger is first called.
    if (Object.keys(enabledNamespaces).length === 0) {
        loadEnabledNamespaces();
    }

    return {
        allLogs,
        availableNamespaces,
        enabledNamespaces,
        filteredLogs,
        isNamespaceEnabled,
        toggleNamespace,
        clearLogs
    };
}

export const log = (namespace: string, message: string, isError: boolean = false) => {
  const newLog: LogEntry = {
      namespace,
      message,
      isError,
      timestamp: Date.now()
  };
  allLogs.value.push(newLog);

  // Add namespace if it's new and ensure it has an enabled/disabled state
  if (!availableNamespaces.value.includes(namespace)) {
    availableNamespaces.value.push(namespace);
    if (enabledNamespaces[namespace] === undefined) {
        enabledNamespaces[namespace] = true; // Default new namespaces to true
        saveEnabledNamespaces();
    }
  }

  // Also log to console if enabled
  if (enabledNamespaces[namespace] !== false) { // Check explicitly for false
    if (isError) {
      console.error(`[${namespace}]`, message);
    } else {
      console.log(`[${namespace}]`, message);
    }
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