<template>
  <div v-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps<{ source: string }>();

const md = new MarkdownIt();

const renderedMarkdown = computed(() => md.render(props.source || ''));

</script>

<style scoped>
/* Add any specific styles for the rendered Markdown container here */
:deep(h1) {
  font-size: 2em;
  margin-top: 0.67em;
  margin-bottom: 0.33em;
}
:deep(h2) {
  font-size: 1.5em;
  margin-top: 0.83em;
  margin-bottom: 0.41em;
}
:deep(h3) {
  font-size: 1.17em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}
:deep(h4) {
  font-size: 1em;
  margin-top: 1.33em;
  margin-bottom: 0.67em;
}
:deep(h5) {
  font-size: 0.83em;
  margin-top: 1.67em;
  margin-bottom: 0.83em;
}
:deep(h6) {
  font-size: 0.67em;
  margin-top: 2.33em;
  margin-bottom: 1.17em;
}

/* Shared margin adjustments for all headers (can be kept if desired) */
:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  font-weight: bold; /* Also adding bold font weight */
}

:deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

:deep(code) {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

:deep(pre) {
  background-color: #f0f0f0;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

:deep(pre code) {
  display: block;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}

:deep(ul),
:deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

/* Add specific list-style-types for nested unordered lists */
:deep(ul) {
  list-style-type: disc;
}
:deep(ul ul) {
  list-style-type: circle;
  margin-bottom: 0; /* Prevent extra space between nested list items */
}
:deep(ul ul ul) {
  list-style-type: square;
}

/* Add specific list-style-types for nested ordered lists */
:deep(ol) {
  list-style-type: decimal;
}
:deep(ol ol) {
  list-style-type: lower-alpha;
  margin-bottom: 0;
}
:deep(ol ol ol) {
  list-style-type: lower-roman;
}

/* Reset margins for all nested lists */
:deep(ul ul),
:deep(ul ol),
:deep(ol ul),
:deep(ol ol) {
  margin-bottom: 0;
}

:deep(li) {
  margin-bottom: 0.5em;
}

:deep(blockquote) {
  border-left: 4px solid #ccc;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
}

:deep(a) {
  color: #007bff;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

/* Remove top margin from the very first element rendered */
:deep(> :first-child) {
  margin-top: 0;
}

/* Table Styles */
:deep(table) {
  width: auto; /* Or 100% if you want full width */
  border-collapse: collapse;
  margin-top: 1em;
  margin-bottom: 1em;
  border: 1px solid #ccc;
}

:deep(th),
:deep(td) {
  border: 1px solid #ccc;
  padding: 0.5em 1em; /* Increased horizontal padding */
  text-align: left;
}

:deep(th) {
  background-color: #607D8B; /* Blue-grey background */
  color: white; /* White text for contrast */
  font-weight: 600; /* Semibold font weight */
}

/* Style for table body rows */
:deep(tbody tr) {
  background-color: #ECEFF1; /* Lighter blue-grey */
}

:deep(tbody tr:hover) {
  background-color: #CFD8DC; /* Slightly darker on hover */
}
</style> 