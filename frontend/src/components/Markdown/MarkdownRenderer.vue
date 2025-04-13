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
:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
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

:deep(pre) :deep(code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

:deep(ul),
:deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
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
</style> 