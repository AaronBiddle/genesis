<template>
  <div class="flex flex-col h-full bg-gray-50 p-2">
    <div ref="messageContainer" class="flex-grow overflow-y-auto mb-2 space-y-2 pr-2">
      <div v-for="(message, index) in messages" :key="index" :class="getMessageClass(message)">
        <div class="px-3 py-2 rounded-lg max-w-xs" :class="getMessageBubbleClass(message)">
          {{ message.text }}
        </div>
      </div>
    </div>
    <div class="flex items-center border-t pt-2">
      <input
        type="text"
        v-model="newMessage"
        placeholder="Type your message..."
        class="flex-grow border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        @keyup.enter="sendMessage"
      />
      <button
        @click="sendMessage"
        :disabled="!newMessage.trim()"
        class="bg-cyan-600 text-white px-4 py-2 rounded-r-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const messages = ref<Message[]>([]);
const newMessage = ref('');
const messageContainer = ref<HTMLElement | null>(null);

const dummyResponses = [
  "That's interesting!",
  "Tell me more.",
  "I see.",
  "Okay.",
  "Hmm, let me think about that.",
  "Can you elaborate?",
  "Got it.",
];

const addMessage = (text: string, sender: 'user' | 'bot') => {
  messages.value.push({ text, sender });
  // Scroll to bottom after adding message
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

const getBotResponse = () => {
  const randomIndex = Math.floor(Math.random() * dummyResponses.length);
  addMessage(dummyResponses[randomIndex], 'bot');
};

const sendMessage = () => {
  const text = newMessage.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  newMessage.value = '';

  // Simulate bot thinking time
  setTimeout(() => {
    getBotResponse();
  }, 500 + Math.random() * 500); // Respond after 0.5-1 seconds
};

const getMessageClass = (message: Message) => {
  return message.sender === 'user' ? 'flex justify-end' : 'flex justify-start';
};

const getMessageBubbleClass = (message: Message) => {
  return message.sender === 'user'
    ? 'bg-cyan-500 text-white'
    : 'bg-gray-200 text-gray-800';
};

// Initial bot message
onMounted(() => {
    setTimeout(() => {
        addMessage("Hello! How can I help you today?", 'bot');
    }, 500);
});

</script>

<style scoped>
/* Optional: Add custom scrollbar styling if desired */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #aaaaaa;
}
</style> 