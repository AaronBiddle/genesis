<template>
  <div class="ai-service-tester">

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      Loading...
    </div>

    <!-- Test Selection & Execution Row -->
    <div class="test-selection-row">
      <label for="ai-test-select">Select Test:</label>
      <select id="ai-test-select" v-model="selectedTest" class="test-select">
        <option disabled value="">Please select a test</option>
        <option v-for="test in availableTests" :key="test.value" :value="test.value">
          {{ test.name }}
        </option>
      </select>
      <button @click="executeTest" :disabled="!canExecuteTest || isLoading" class="execute-button">
        {{ isLoading ? 'Testing...' : 'Test' }}
      </button>
    </div>

    <!-- Input Fields based on selected test -->
    <div v-if="selectedTestInfo" class="inputs-section">
      <!-- Model Selection Dropdown (shown for generateResponse) -->
      <div v-if="selectedTestInfo.requiresModel" class="control-group">
        <label for="model-select">Select Model:</label>
        <select id="model-select" v-model="modelNameInput" class="model-select" :disabled="modelOptions.length === 0">
          <option disabled value="">{{ modelOptions.length > 0 ? 'Please select a model' : 'Fetching models...' }}</option>
          <option v-for="model in modelOptions" :key="model.value" :value="model.value">
            {{ model.name }} ({{ model.provider }})
          </option>
        </select>
      </div>

      <!-- System Prompt Input -->
      <div v-if="selectedTestInfo.requiresSystemPrompt" class="control-group">
        <label for="system-prompt">System Prompt (Optional):</label>
        <textarea id="system-prompt" v-model="systemPromptInput" rows="3" placeholder="e.g., You are a helpful assistant."></textarea>
      </div>

      <!-- User Message Input -->
      <div v-if="selectedTestInfo.requiresUserMessage" class="control-group">
        <label for="user-message">User Message:</label>
        <textarea id="user-message" v-model="userMessageInput" rows="4" placeholder="Enter your message to the AI here."></textarea>
      </div>

      <!-- Note: Conversation history display could be added here later -->

    </div>

    <!-- Result Area -->
    <div v-if="executionResult" class="result-container">
      <h4>Execution Result/Status</h4>
      <pre :class="{ 'error-result': isErrorResult }">{{ executionResult }}</pre>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  getModels,
  generateResponse,
} from '@/services/AIClient';
import type {
  ModelDetails,
  GetModelsResponse,
  GenerateRequest,
  Message,
} from '@/services/AIClient';

// Define available tests
const availableTests = [
  { name: 'Get Available Models', value: 'getModels', requiresModel: false, requiresSystemPrompt: false, requiresUserMessage: false },
  { name: 'Generate Response', value: 'generateResponse', requiresModel: true, requiresSystemPrompt: true, requiresUserMessage: true },
];

// Reactive state
const isLoading = ref<boolean>(false);
const selectedTest = ref<string>('');
const availableModels = ref<Record<string, ModelDetails>>({});
const modelNameInput = ref<string>('');
const systemPromptInput = ref<string>('You are a helpful assistant called Genesis running inside a simulated desktop environment.');
const userMessageInput = ref<string>('Write a short poem about a computer mouse.');
// const conversationHistory = ref<Message[]>([]); // Future enhancement
const executionResult = ref<string | null>(null);
const isErrorResult = ref<boolean>(false);

// Watch for changes in selectedTest to clear previous results and model selection
watch(selectedTest, (newTest) => {
  executionResult.value = null;
  isErrorResult.value = false;
  // Reset model selection if the new test doesn't require it
  const info = availableTests.find(test => test.value === newTest);
  if (info && !info.requiresModel) {
      // modelNameInput.value = ''; // Keep model selected for convenience? Decide later.
  }
  // Fetch models if generateResponse is selected and models aren't loaded
  if (newTest === 'generateResponse' && Object.keys(availableModels.value).length === 0) {
      fetchModels();
  }
});

// Computed property to get info about the selected test
const selectedTestInfo = computed(() => {
  return availableTests.find(test => test.value === selectedTest.value);
});

// Computed property to format models for the dropdown
const modelOptions = computed(() => {
  return Object.entries(availableModels.value).map(([key, details]) => ({
    value: key, // The actual model ID/key
    name: details.display_name, // User-friendly name
    provider: details.provider,
  }));
});

// Computed property to check if the execute button should be enabled
const canExecuteTest = computed(() => {
  if (!selectedTestInfo.value) return false;
  if (isLoading.value) return false; // Disable while loading

  const info = selectedTestInfo.value;
  if (info.requiresModel && !modelNameInput.value) return false;
  if (info.requiresUserMessage && !userMessageInput.value.trim()) return false;
  // System prompt is optional, so no check needed

  return true;
});

// Function to fetch available models
const fetchModels = async () => {
  isLoading.value = true;
  isErrorResult.value = false;
  executionResult.value = 'Fetching models...';
  try {
    const result: GetModelsResponse = await getModels();
    availableModels.value = result.models;
    // Set a default model if available and none is selected
    if (modelOptions.value.length > 0 && !modelNameInput.value) {
        modelNameInput.value = modelOptions.value[0].value;
    }
    // Clear the fetching message if successful and no other test is running
    if (selectedTest.value !== 'generateResponse') { // Only clear if just fetching models
        executionResult.value = `Success: Found ${Object.keys(availableModels.value).length} models.`;
    }
  } catch (error: any) {
    console.error('Failed to fetch AI models:', error);
    executionResult.value = `Error fetching models:
${error.message || 'Unknown error'}`;
    isErrorResult.value = true;
    availableModels.value = {}; // Clear models on error
  } finally {
    isLoading.value = false;
  }
};

// Fetch models when component is mounted or if needed later
onMounted(() => {
  // Optionally fetch models immediately, or wait until generateResponse is selected
   fetchModels(); // Fetch on mount for immediate availability
});

// Function to execute the selected test
const executeTest = async () => {
  if (!selectedTestInfo.value || !canExecuteTest.value) return;

  isLoading.value = true;
  executionResult.value = 'Executing...';
  isErrorResult.value = false;

  const test = selectedTestInfo.value.value;

  try {
    let result: any;
    switch (test) {
      case 'getModels':
        // Refetch models when explicitly requested
        await fetchModels(); // Reuse the fetch function
        // The fetchModels function already sets the executionResult
        return; // Exit early as fetchModels handles result display

      case 'generateResponse':
        const messages: Message[] = [];
        // Add user message to history (simple version)
        messages.push({ role: 'user', content: userMessageInput.value });

        const requestData: GenerateRequest = {
          model: modelNameInput.value,
          messages: messages,
          system_prompt: systemPromptInput.value || null,
        };
        result = await generateResponse(requestData);
        // TODO: Optionally update conversation history here
        break;

      default:
        throw new Error('Invalid test selected');
    }
    // Display success result (for generateResponse)
    executionResult.value = `Success:
${JSON.stringify(result, null, 2)}`;

  } catch (error: any) {
    console.error(`AI Service Test Error (${test}):`, error);
    executionResult.value = `Error:
${error.message || 'Unknown error'}`;
    isErrorResult.value = true;
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
.ai-service-tester {
  padding: 16px;
  font-family: sans-serif;
  background-color: #f9f9f9;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative; /* Needed for absolute positioning of overlay */
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  color: #333;
  z-index: 10;
}

h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #555;
}

.test-selection-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.test-selection-row label {
  flex-shrink: 0;
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
.model-select,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.test-select {
  flex-grow: 1;
}

textarea {
  resize: vertical;
  min-height: 60px; /* Adjusted min-height */
}

.inputs-section {
  margin-top: 0px;
  flex-shrink: 0;
}

.execute-button {
  padding: 10px 15px;
  background-color: #5a67d8; /* Indigo color */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.execute-button:hover {
  background-color: #434190;
}

.execute-button:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}

.result-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.result-container pre {
  background-color: #ffffff;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-y: auto;
  margin-top: 4px;
  flex-grow: 1;
  min-height: 100px; /* Ensure it has some minimum height */
}

.result-container pre.error-result {
    background-color: #ffebee;
    color: #c62828;
}
</style> 