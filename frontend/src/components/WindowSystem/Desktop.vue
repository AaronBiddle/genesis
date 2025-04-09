<script setup lang="ts">
import { ref, computed } from 'vue';
import { apps, type App } from './apps'; // Updated import path
import Window from './Window.vue'; // Import the Window component
import { addWindow, windows } from './WindowManager'; // Import from WindowManager
import { svgIcons } from "@/components/Icons/SvgIcons"; // Import the icons map
import { categoryConfigs, defaultCategoryIcon } from './categories'; // Import category config

// Define types for the items in the dropdown list
interface CategoryItem {
  type: 'category';
  name: string;
  iconId: string;
  isExpanded: boolean;
}

interface AppItem {
  type: 'app';
  appData: App;
  isInCategory: boolean; // For styling indentation
}

type DropdownItem = CategoryItem | AppItem;

const showAppDropdown = ref(false);
const expandedCategories = ref<Set<string>>(new Set()); // Track expanded categories

function toggleAppDropdown() {
  showAppDropdown.value = !showAppDropdown.value;
  if (!showAppDropdown.value) {
    // Optional: Collapse categories when closing the dropdown
    // expandedCategories.value.clear();
  }
}

function launchApp(app: App) {
  console.log(`Launching ${app.title}`); // Use title
  addWindow(app); // Use WindowManager to add the window
  showAppDropdown.value = false; // Close dropdown after selection
}

function toggleCategory(categoryName: string) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName);
  } else {
    expandedCategories.value.add(categoryName);
  }
}

// Computed property to structure apps by category
const groupedItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = [];
  const processedCategories = new Set<string>();

  apps.forEach(app => {
    const categoryName = app.category;

    if (categoryName) {
      // Add category header if not already processed
      if (!processedCategories.has(categoryName)) {
        const config = categoryConfigs[categoryName];
        const isExpanded = expandedCategories.value.has(categoryName);
        items.push({
          type: 'category',
          name: categoryName,
          iconId: config?.iconId || defaultCategoryIcon,
          isExpanded: isExpanded,
        });
        processedCategories.add(categoryName);
      }

      // Add app item *if* its category is expanded
      if (expandedCategories.value.has(categoryName)) {
        items.push({
          type: 'app',
          appData: app,
          isInCategory: true, // Mark as belonging to a category
        });
      }
    } else {
      // App without category - always show
      items.push({
        type: 'app',
        appData: app,
        isInCategory: false,
      });
    }
  });

  return items;
});
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
    <div v-if="showAppDropdown" class="absolute top-8 left-0 w-56 bg-gray-200 z-10 shadow-lg rounded-b max-h-96 overflow-y-auto"> <!-- Increased width, added shadow/rounding, max-height -->
       <ul class="py-1">
         <template v-for="(item, index) in groupedItems" :key="item.type === 'category' ? item.name : item.appData.id + '-' + index">
           <!-- Category Header -->
           <li v-if="item.type === 'category'"
               @click="toggleCategory(item.name)"
               class="flex items-center px-3 py-1.5 hover:bg-gray-300 cursor-pointer font-semibold text-sm select-none">
             <span
               class="mr-2 w-4 h-4 flex items-center justify-center"
               v-html="svgIcons.get(item.iconId) || ''"
             ></span>
             <span class="flex-grow">{{ item.name }}</span>
             <!-- Expander Icon -->
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"
                  class="w-3 h-3 transition-transform duration-150"
                  :class="{ 'rotate-90': item.isExpanded }">
               <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
             </svg>
           </li>

           <!-- App Item -->
           <li v-else-if="item.type === 'app'"
               @click="launchApp(item.appData)"
               class="flex items-center py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
               :class="{ 'pl-7 pr-3': item.isInCategory, 'px-3': !item.isInCategory }"> <!-- Indent if in category -->
              <span
                class="mr-2 w-4 h-4 flex items-center justify-center"
                :class="item.appData.iconColor || ''"
                v-html="svgIcons.get(item.appData.iconId) || ''"
              ></span>
              <span>{{ item.appData.title }}</span>
           </li>
         </template>
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
/* Style for scrollbar if needed */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #808080;
}
</style>