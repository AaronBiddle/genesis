<script lang="ts">
  import { marked } from 'marked';
  export let content: string = "";
</script>

<style>
  :global(.markdown-content h3) {
    font-size: 1.25rem; /* Adjust font size as needed */
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content ol) {
    list-style-type: decimal;
    margin-left: 1.5rem;
    padding-left: 0.5rem;
  }
  :global(.markdown-content ul) {
    list-style-type: disc;
    margin-left: 1.5rem;
    padding-left: 0.5rem;
  }
</style>

<div class="markdown-content">{@html marked(content)}</div> 