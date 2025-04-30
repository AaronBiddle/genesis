<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { apps, type App } from './apps'
import Window from './Window.vue'
import { desktopStore, windows, addWindow } from './desktopWindowStore'
import { svgIcons } from '@/components/Icons/SvgIcons'
import { categoryConfigs, defaultCategoryIcon } from './categories'
import { log } from '@/components/Logger/loggerStore'

/* ------------------------------------------------------------------
   1 · Get window state from the dedicated store
   ------------------------------------------------------------------ */

/* Make the *entire* store available to descendants (Window.vue, 
   WindowInspector.vue, etc.).  They can now inject whatever fields
   they need – including the reactive `windows` list. */
provide('windowStore', desktopStore)

/* ------------------------------------------------------------------
   2 · Launcher state / helpers
   ------------------------------------------------------------------ */
interface CategoryItem {
  type: 'category'
  name: string
  iconId: string
  isExpanded: boolean
}
interface AppItem {
  type: 'app'
  appData: App
  isInCategory: boolean
}
type DropdownItem = CategoryItem | AppItem

const showAppDropdown = ref(false)
const expandedCategories = ref<Set<string>>(new Set())
const NS = 'Desktop.vue'

function toggleAppDropdown() {
  showAppDropdown.value = !showAppDropdown.value
}
function launchApp(app: App) {
  log(NS, `Launching app: ${app.title} (ID: ${app.id})`)
  addWindow(app)
  showAppDropdown.value = false
}
function toggleCategory(categoryName: string) {
  expandedCategories.value.has(categoryName)
    ? expandedCategories.value.delete(categoryName)
    : expandedCategories.value.add(categoryName)
}

/* Group apps by category for the dropdown */
const groupedItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = []
  const seen = new Set<string>()
  const appsToShow = apps.filter(a => a.showInLauncher !== false)

  appsToShow.forEach(app => {
    const cat = app.category
    if (cat) {
      if (!seen.has(cat)) {
        items.push({
          type: 'category',
          name: cat,
          iconId: categoryConfigs[cat]?.iconId || defaultCategoryIcon,
          isExpanded: expandedCategories.value.has(cat),
        })
        seen.add(cat)
      }
      if (expandedCategories.value.has(cat)) {
        items.push({ type: 'app', appData: app, isInCategory: true })
      }
    } else {
      items.push({ type: 'app', appData: app, isInCategory: false })
    }
  })
  return items
})
</script>

<template>
  <div class="w-full h-full flex flex-col relative">
    <!-- Toolbar -->
    <div class="bg-gray-50 flex items-center h-8 shrink-0 px-1">
      <button
        @click="toggleAppDropdown"
        class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-200 mr-1 bg-transparent transition-colors duration-150"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>

    <!-- App Dropdown -->
    <div
      v-if="showAppDropdown"
      class="absolute top-8 left-0 w-56 bg-gray-200 z-[10000] shadow-lg rounded-b max-h-[75vh] overflow-y-auto"
    >
      <ul class="py-1">
        <template v-for="(item, idx) in groupedItems" :key="item.type === 'category' ? item.name : item.appData.id + '-' + idx">
          <!-- Category header -->
          <li
            v-if="item.type === 'category'"
            @click="toggleCategory(item.name)"
            class="flex items-center px-3 py-1.5 hover:bg-gray-300 cursor-pointer font-semibold text-sm select-none"
          >
            <span class="mr-2 w-4 h-4 flex items-center justify-center" v-html="svgIcons.get(item.iconId) || ''"></span>
            <span class="flex-grow">{{ item.name }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3 h-3 transition-transform duration-150" :class="{ 'rotate-90': item.isExpanded }">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </li>

          <!-- App item -->
          <li
            v-else-if="item.type === 'app'"
            @click="launchApp(item.appData)"
            class="flex items-center py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
            :class="{ 'pl-7 pr-3': item.isInCategory, 'px-3': !item.isInCategory }"
          >
            <span class="mr-2 w-4 h-4 flex items-center justify-center" :class="item.appData.iconColor || ''" v-html="svgIcons.get(item.appData.iconId) || ''"></span>
            <span>{{ item.appData.title }}</span>
          </li>
        </template>
      </ul>
    </div>

    <!-- Workspace content -->
    <div class="content-area flex-grow p-4 bg-gray-500 relative">
      <Window
        v-for="win in windows"
        :key="win.id"
        :window-data="win"
      />
    </div>
  </div>
</template>

<style scoped>
/* custom scrollbar for the dropdown */
.overflow-y-auto::-webkit-scrollbar { width: 6px }
.overflow-y-auto::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px }
.overflow-y-auto::-webkit-scrollbar-thumb { background: #a0a0a0; border-radius: 10px }
.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #808080 }
</style>
