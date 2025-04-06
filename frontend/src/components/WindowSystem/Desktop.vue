<script setup lang="ts">
import { ref } from 'vue';
import { apps, type App } from './apps'; // Updated import path
import Window from './Window.vue'; // Import the Window component
import { addWindow, windows } from './WindowManager'; // Import from WindowManager
import { svgIcons } from "@/components/Icons/SvgIcons"; // Import the icons map

const showAppDropdown = ref(false);
// const openWindows = ref<App[]>([]); // Remove local state, use WindowManager's state

function toggleAppDropdown() {
  showAppDropdown.value = !showAppDropdown.value;
}

function launchApp(app: App) {
  console.log(`Launching ${app.title}`); // Use title
  addWindow(app); // Use WindowManager to add the window
  showAppDropdown.value = false; // Close dropdown after selection
}
</script>

<template>
  <div class="w-full h-full flex flex-col relative"> <!-- Added relative positioning -->
    <!-- Toolbar -->
    <div class=" bg-gray-50 flex items-center h-8 shrink-0 px-1">
      <button @click="toggleAppDropdown" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-200 mr-1 bg-transparent transition-colors duration-150">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <!-- Add other toolbar items here -->
    </div>

    <!-- App Dropdown -->
    <div v-if="showAppDropdown" class="absolute top-8 left-0 w-48 bg-gray-200 z-10">
       <ul>
         <li v-for="app in apps" :key="app.id" 
             @click="launchApp(app)"
             class="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer">
           <span
             class="mr-2"
             :style="{ color: app.iconColor || '' }"
             v-html="svgIcons.get(app.iconId) || ''"
           ></span> <!-- Use iconId to look up icon -->
           <span>{{ app.title }}</span> <!-- Use title -->
         </li>
       </ul>
    </div>

    <!-- Content Area -->
    <div class="content-area flex-grow p-4 bg-gray-500 relative"> <!-- Changed background for contrast, added relative positioning -->
      <!-- Render open windows from WindowManager -->
      <Window 
        v-for="windowData in windows" 
        :key="windowData.id" 
        :window-data="windowData"
      >
        <!-- Pass app-specific content or props here later -->
        <p>Window for {{ windowData.title }} - ID: {{windowData.id}}</p> <!-- Use title -->
      </Window>
    </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>