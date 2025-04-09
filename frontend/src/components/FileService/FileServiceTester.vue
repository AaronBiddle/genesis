<template>
  <div class="file-service-tester">
    <h2>File Service Tester</h2>

    <!-- Test Selection -->
    <div class="control-group">
      <label for="test-select">Select Test:</label>
      <select id="test-select" v-model="selectedTest" class="test-select">
        <option disabled value="">Please select a test</option>
        <option v-for="test in availableTests" :key="test.value" :value="test.value">
          {{ test.name }}
        </option>
      </select>
    </div>

    <!-- Input Fields based on selected test -->
    <div v-if="selectedTestInfo" class="inputs-section">
      <h4>Parameters</h4>
      
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

      <!-- Execute Button (moved here) -->
      <button @click="executeTest" :disabled="!canExecuteTest" class="execute-button">
        Execute {{ selectedTestInfo.name }}
      </button>
    </div>

    <div v-if="executionResult" class="result-section">
       <h4>Execution Result/Status</h4>
       <pre :class="{ 'error-result': isErrorResult }">{{ executionResult }}</pre>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  readFile,
  writeFile,
  deleteFile,
  listDirectory,
  createDirectory,
  deleteDirectory,
  getMounts
} from '@/services/FileClient';

// Define available tests
const availableTests = [
  { name: 'Read File', value: 'readFile', requiresFilePath: true },
  { name: 'Write File', value: 'writeFile', requiresFilePath: true, requiresContent: true },
  { name: 'Delete File', value: 'deleteFile', requiresFilePath: true },
  { name: 'List Directory', value: 'listDirectory', requiresDirPath: true },
  { name: 'Create Directory', value: 'createDirectory', requiresDirPath: true },
  { name: 'Delete Directory', value: 'deleteDirectory', requiresDirPath: true },
  { name: 'Get Mounts', value: 'getMounts' },
];

// Reactive state
const selectedTest = ref<string>('');
const filePathInput = ref<string>('/home/user/test.txt'); // Default example
const dirPathInput = ref<string>('/home/user/new_folder'); // Default example
const fileContentInput = ref<string>('This is the file content.\nHello World!'); // Default example
const executionResult = ref<string | null>(null);
const isErrorResult = ref<boolean>(false);

// Computed property to get info about the selected test
const selectedTestInfo = computed(() => {
  return availableTests.find(test => test.value === selectedTest.value);
});

// Computed property to check if the execute button should be enabled
const canExecuteTest = computed(() => {
  if (!selectedTestInfo.value) return false;
  if (selectedTestInfo.value.requiresFilePath && !filePathInput.value) return false;
  if (selectedTestInfo.value.requiresDirPath && !dirPathInput.value) return false;
  // Content can technically be empty for writeFile, so we don't check it here
  return true;
});

// Function to execute the selected test
const executeTest = async () => {
  if (!selectedTestInfo.value || !canExecuteTest.value) return;

  executionResult.value = 'Executing...';
  isErrorResult.value = false;

  const test = selectedTestInfo.value.value;
  let result: any;

  try {
    switch (test) {
      case 'readFile':
        result = await readFile(filePathInput.value);
        break;
      case 'writeFile':
        result = await writeFile(filePathInput.value, fileContentInput.value);
        break;
      case 'deleteFile':
        result = await deleteFile(filePathInput.value);
        break;
      case 'listDirectory':
        result = await listDirectory(dirPathInput.value);
        break;
      case 'createDirectory':
        result = await createDirectory(dirPathInput.value);
        break;
      case 'deleteDirectory':
        result = await deleteDirectory(dirPathInput.value);
        break;
      case 'getMounts':
        result = await getMounts();
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

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #444;
}

.test-select,
input[type="text"],
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box; /* Include padding and border in the element's total width and height */
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.inputs-section {
  margin-top: 16px;
}

.preview-section, .result-section {
  margin-top: 20px;
  background-color: #fff;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.preview-content pre, .result-section pre {
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
}

.execute-button:hover {
  background-color: #0366d6;
}

.execute-button:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}
</style> 