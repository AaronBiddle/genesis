<template>
  <div class="p-4 flex flex-col h-full bg-gray-50">
    <div class="mb-4 pb-2 border-b border-gray-300">
      <h3 class="text-lg font-semibold mb-2">Namespace Filters</h3>
      <div v-for="ns in availableNamespaces" :key="ns" class="flex items-center mb-1">
        <input
          type="checkbox"
          :id="`ns-${ns}`"
          :checked="isNamespaceEnabled(ns)"
          @change="toggleNamespace(ns)"
          class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label :for="`ns-${ns}`" class="text-sm text-gray-700">{{ ns }}</label>
      </div>
       <button
         @click="clearLogs"
         class="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
       >
         Clear Logs
       </button>
    </div>

    <div class="flex-grow overflow-y-auto bg-white p-2 border border-gray-200 rounded shadow-inner">
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        :class="['text-xs font-mono mb-1 p-1 rounded', log.isError ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']"
      >
        <span class="font-semibold mr-2">[{{ log.namespace }}]</span>
        <span>{{ log.message }}</span>
      </div>
       <div v-if="filteredLogs.length === 0" class="text-xs text-gray-500 italic">
         No logs to display for enabled namespaces.
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

interface LogEntry {
  namespace: string;
  message: string;
  isError: boolean;
  timestamp: number;
}

// --- State ---
const availableNamespaces = ref<string[]>(['FileManager.vue']); // Initial namespaces
const enabledNamespaces = ref<Record<string, boolean>>({});
const allLogs = ref<LogEntry[]>([]);
const STORAGE_KEY = 'logger_enabled_namespaces';

// --- Computed Properties ---
const filteredLogs = computed(() => {
  return allLogs.value.filter(log => isNamespaceEnabled(log.namespace));
});

// --- Methods ---
const isNamespaceEnabled = (namespace: string): boolean => {
  // Default to true if not specifically disabled
  return enabledNamespaces.value[namespace] !== false;
};

const toggleNamespace = (namespace: string) => {
  enabledNamespaces.value[namespace] = !isNamespaceEnabled(namespace);
  saveEnabledNamespaces();
};

const saveEnabledNamespaces = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledNamespaces.value));
  } catch (e) {
    console.error("Failed to save logger namespace settings:", e);
  }
};

const loadEnabledNamespaces = () => {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Ensure only known namespaces are loaded
      const validSettings: Record<string, boolean> = {};
      availableNamespaces.value.forEach(ns => {
        if (parsedSettings[ns] !== undefined) {
          validSettings[ns] = parsedSettings[ns];
        } else {
           // Initialize newly discovered namespaces as enabled by default
           validSettings[ns] = true;
        }
      });
       // Also add any settings for namespaces that might have been stored but are not currently 'available'
       // This handles cases where namespaces might appear dynamically later.
       Object.keys(parsedSettings).forEach(storedNs => {
         if (!validSettings.hasOwnProperty(storedNs)) {
            validSettings[storedNs] = parsedSettings[storedNs];
         }
       })

      enabledNamespaces.value = validSettings;
    } else {
       // Default all available namespaces to enabled if nothing is stored
       const defaultSettings: Record<string, boolean> = {};
       availableNamespaces.value.forEach(ns => defaultSettings[ns] = true);
       enabledNamespaces.value = defaultSettings;
       saveEnabledNamespaces(); // Save the defaults
    }
  } catch (e) {
    console.error("Failed to load logger namespace settings:", e);
     // Fallback: enable all available namespaces
     const defaultSettings: Record<string, boolean> = {};
     availableNamespaces.value.forEach(ns => defaultSettings[ns] = true);
     enabledNamespaces.value = defaultSettings;
  }
};

const addLog = (log: Omit<LogEntry, 'timestamp'>) => {
  const newLog = { ...log, timestamp: Date.now() };
  allLogs.value.push(newLog);

  // Add namespace if it's new
  if (!availableNamespaces.value.includes(log.namespace)) {
    availableNamespaces.value.push(log.namespace);
    // Ensure new namespaces are initialized in enabled settings (default to true)
    if(enabledNamespaces.value[log.namespace] === undefined) {
        enabledNamespaces.value[log.namespace] = true;
        saveEnabledNamespaces();
    }
  }

  // Also log to console if enabled
  if (isNamespaceEnabled(log.namespace)) {
    if (log.isError) {
      console.error(`[${log.namespace}]`, log.message);
    } else {
      console.log(`[${log.namespace}]`, log.message);
    }
  }
};

const clearLogs = () => {
   allLogs.value = [];
}

// --- Event Bus Handling (Example using simple CustomEvent) ---
// Replace this with your actual event bus implementation (e.g., mitt, Vue's provide/inject)
const handleLogMessage = (event: Event) => {
  const customEvent = event as CustomEvent<Omit<LogEntry, 'timestamp'>>;
  if (customEvent.detail && customEvent.detail.namespace && customEvent.detail.message !== undefined) {
    addLog(customEvent.detail);
  } else {
    console.warn("Received invalid log message event:", event);
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  loadEnabledNamespaces();
  // Subscribe to log messages
  window.addEventListener('log-message', handleLogMessage);

  // Example: Simulate receiving logs after mount
  // setTimeout(() => {
  //   window.dispatchEvent(new CustomEvent('log-message', { detail: { namespace: 'FileManager.vue', message: 'File Manager initialized.', isError: false } }));
  //   window.dispatchEvent(new CustomEvent('log-message', { detail: { namespace: 'OtherComponent', message: 'Something else happened.', isError: false } }));
  //   window.dispatchEvent(new CustomEvent('log-message', { detail: { namespace: 'FileManager.vue', message: 'Could not read directory /data', isError: true } }));
  // }, 1000);
});

onUnmounted(() => {
  // Unsubscribe from log messages
  window.removeEventListener('log-message', handleLogMessage);
});

// Watch availableNamespaces to ensure enabledNamespaces stays in sync
watch(availableNamespaces, (newNamespaces) => {
    let updated = false;
    newNamespaces.forEach(ns => {
        if (enabledNamespaces.value[ns] === undefined) {
            enabledNamespaces.value[ns] = true; // Default new namespaces to true
            updated = true;
        }
    });
    if (updated) {
        saveEnabledNamespaces();
    }
}, { deep: true });


</script>

<style scoped>
/* Add any specific styles if needed */
</style> 