<template>
  <div class="file-service-tester">
    
    <!-- Test Selection & Execution Row -->
    <div class="test-selection-row">
      <label for="test-select">Select Test:</label>
      <select id="test-select" v-model="selectedTest" class="test-select">
        <option disabled value="">Please select a test</option>
        <option v-for="test in availableTests" :key="test.value" :value="test.value">
          {{ test.name }}
        </option>
      </select>
      <button @click="executeTest" :disabled="!canExecuteTest" class="execute-button">
        Test
      </button>
    </div>

    <!-- Input Fields based on selected test -->
    <div v-if="selectedTestInfo" class="inputs-section">      
      <!-- Mount Name Dropdown (shown for tests that require it) -->
      <div v-if="selectedTestInfo.requiresMount" class="control-group">
        <label for="mount-select">Mount Name:</label>
        <select id="mount-select" v-model="mountNameInput" class="mount-select">
          <option disabled value="">Please select a mount</option>
          <option v-for="mount in availableMounts" :key="mount.name" :value="mount.name">
            {{ mount.name }}
          </option>
        </select>
      </div>

      <!-- File Path Input -->
      <div v-if="selectedTestInfo.requiresFilePath" class="control-group">
        <label for="file-path">File Path:</label>
        <input type="text" id="file-path" v-model="filePathInput" placeholder="e.g., /path/to/your/file.txt" />
      </div>

      <!-- Directory Path Input -->
      <div v-if="selectedTestInfo.requiresDirPath" class="control-group">
        <label for="dir-path">Directory Path:</label>
        <input type="text" id="dir-path" v-model="dirPathInput" placeholder="e.g., /path/to/your/directory" />
      </div>

      <!-- File Content Input -->
      <div v-if="selectedTestInfo.requiresContent" class="control-group">
        <label for="file-content">File Content:</label>
        <textarea id="file-content" v-model="fileContentInput" rows="5"></textarea>
      </div>
    </div>

    <!-- Result Area (no longer in a separate bordered box) -->
    <div v-if="executionResult" class="result-container">
       <h4>Execution Result/Status</h4>
        <pre :class="{ 'error-result': isErrorResult }">{{ executionResult }}</pre>
     </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  readFile,
  writeFile,
  deleteFile,
  listDirectory,
  createDirectory,
  deleteDirectory,
  getMounts,
} from '@/services/FileClient';
import type { MountInfo } from '@/services/FileClient';

// Define available tests with mount requirement
const availableTests = [
  { name: 'Get Mounts', value: 'getMounts', requiresMount: false },
  { name: 'Write File', value: 'writeFile', requiresMount: true, requiresFilePath: true, requiresContent: true }, 
  { name: 'Read File', value: 'readFile', requiresMount: true, requiresFilePath: true },  
  { name: 'Delete File', value: 'deleteFile', requiresMount: true, requiresFilePath: true },
  { name: 'List Directory', value: 'listDirectory', requiresMount: true, requiresDirPath: true },
  { name: 'Create Directory', value: 'createDirectory', requiresMount: true, requiresDirPath: true },
  { name: 'Delete Directory', value: 'deleteDirectory', requiresMount: true, requiresDirPath: true },  
];

// Reactive state
const selectedTest = ref<string>('');
const mountNameInput = ref<string>('');
const availableMounts = ref<MountInfo[]>([]);
const filePathInput = ref<string>('test.txt'); 
const dirPathInput = ref<string>(''); 
const fileContentInput = ref<string>('This is the file content.\nHello World!'); 
const executionResult = ref<string | null>(null);
const isErrorResult = ref<boolean>(false);

// Computed property to get info about the selected test
const selectedTestInfo = computed(() => {
  return availableTests.find(test => test.value === selectedTest.value);
});

// Computed property to check if the execute button should be enabled
const canExecuteTest = computed(() => {
  if (!selectedTestInfo.value) return false;
  // Check mount requirement first
  if (selectedTestInfo.value.requiresMount && !mountNameInput.value) return false;
  if (selectedTestInfo.value.requiresFilePath && !filePathInput.value) return false;
  // Allow empty dirPath for listDirectory, but require it for other directory operations
  if (selectedTestInfo.value.requiresDirPath && !dirPathInput.value && selectedTestInfo.value.value !== 'listDirectory') return false;
  // Content can technically be empty for writeFile, so we don't check it here
  return true;
});

// Function to fetch available mounts
const fetchMounts = async () => {
  try {
    const result = await getMounts();
    if (result && Array.isArray(result)) {
      availableMounts.value = result;
      // Set the first mount as default if one exists and none is selected
      if (availableMounts.value.length > 0 && !mountNameInput.value) {
        mountNameInput.value = availableMounts.value[0].name;
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch mounts:', error);
  }
};

// Fetch mounts when component is mounted
onMounted(() => {
  fetchMounts();
});

// Function to execute the selected test
const executeTest = async () => {
  if (!selectedTestInfo.value || !canExecuteTest.value) return;

  executionResult.value = 'Executing...';
  isErrorResult.value = false;

  const test = selectedTestInfo.value.value;
  const mountName = mountNameInput.value; // Get the mount name
  let result: any;

  try {
    switch (test) {
      case 'readFile':
        // Pass mountName as the first argument
        result = await readFile(mountName, filePathInput.value);
        break;
      case 'writeFile':
        // Pass mountName as the first argument
        result = await writeFile(mountName, filePathInput.value, fileContentInput.value);
        break;
      case 'deleteFile':
        // Pass mountName as the first argument
        result = await deleteFile(mountName, filePathInput.value);
        break;
      case 'listDirectory':
        // Pass mountName as the first argument
        result = await listDirectory(mountName, dirPathInput.value || ''); // Ensure empty string is passed for root
        break;
      case 'createDirectory':
        // Pass mountName as the first argument
        result = await createDirectory(mountName, dirPathInput.value);
        break;
      case 'deleteDirectory':
        // Pass mountName as the first argument
        result = await deleteDirectory(mountName, dirPathInput.value);
        break;
      case 'getMounts':
        // getMounts does not require mountName
        result = await getMounts();
        // Update available mounts when getMounts is executed
        if (result && Array.isArray(result)) {
          availableMounts.value = result;
        }
        break;
      default:
        throw new Error('Invalid test selected');
    }
    executionResult.value = `Success:\n${JSON.stringify(result, null, 2)}`;
  } catch (error: any) {
    console.error(`File Service Test Error (${test}):`, error);
    executionResult.value = `Error:\n${error.message || 'Unknown error'}`;
    isErrorResult.value = true;
  }
};

</script>

<style scoped>
.file-service-tester {
  padding: 16px;
  font-family: sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #555;
}

/* New style for the row containing dropdown and button */
.test-selection-row {
  display: flex;
  align-items: center; /* Vertically align items */
  gap: 8px; /* Space between dropdown and button */
  margin-bottom: 12px;
}

.test-selection-row label {
  /* margin-bottom: 0; Remove bottom margin if label is in the row */
  flex-shrink: 0; /* Prevent label from shrinking */
}

.control-group {
  margin-bottom: 12px; /* Add some space between input groups */
}

.control-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #444;
}

.test-select,
.mount-select,
input[type="text"],
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box; /* Include padding and border in the element's total width and height */
}

/* Adjust test-select width to allow space for the button */
.test-select {
  flex-grow: 1; /* Allow dropdown to take available space */
  /* Remove width: 100% if it was set previously */
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.inputs-section { /* This section should not grow */
  margin-top: 0px;
  flex-shrink: 0; /* Prevent shrinking */
}

/* Removed preview-section styles as it's not present */

.result-section pre { /* Adjusted selector */
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap; /* Handle long lines */
  word-break: break-all; /* Break long words/paths */
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px; /* Added margin for content preview */
}

.result-section pre.error-result {
    background-color: #ffebee;
    color: #c62828;
}

.execute-button {
  padding: 10px 15px;
  background-color: #2188ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0; /* Prevent button from shrinking */
}

.execute-button:hover {
  background-color: #0366d6;
}

.execute-button:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}

/* New container for results to manage flex growth */
.result-container {
  margin-top: 0px;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow this container to fill remaining space */
  min-height: 0; /* Crucial for flex-grow in column layout */
}

/* Style for the result <pre> block */
.result-container pre {
  background-color: #ffffff; /* White background */
  padding: 10px;
  border: 1px solid #eee; /* Add border */
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-y: auto; /* Scroll only if needed */
  margin-top: 4px;
  flex-grow: 1; /* Allow pre to fill the result-container */
  min-height: 0; /* Prevent shrinking */
}

/* Error styling for the result <pre> block */
.result-container pre.error-result {
    background-color: #ffebee;
    color: #c62828;
}
</style> 