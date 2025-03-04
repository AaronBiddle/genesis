<script lang="ts">
  import { marked } from 'marked';
  export let content: string = "";
</script>

<style>
  :global(.markdown-content) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
  }
  :global(.markdown-content h2) {
    font-size: 1.4rem; /* Smaller than browser default */
    font-weight: 500; /* Less bold than default */
    margin-top: 1.2rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content h3) {
    font-size: 1.25rem; /* Adjust font size as needed */
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content strong) {
    font-weight: 700; /* Less bold than default (700) */
  }
  :global(.markdown-content code) {
    font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }
  :global(.markdown-content pre) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto; /* Adds horizontal scrolling for very long lines */
    margin: 1rem 0;
  }
  :global(.markdown-content pre code) {
    background-color: transparent;
    padding: 0;
    white-space: pre-wrap; /* Allows code to wrap */
    word-break: break-word; /* Breaks words to prevent overflow */
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
  :global(.markdown-content p) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>

<div class="markdown-content">{@html marked(content)}</div> 