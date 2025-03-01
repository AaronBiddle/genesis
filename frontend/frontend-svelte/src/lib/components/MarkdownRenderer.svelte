<script lang="ts">
  import { marked } from 'marked';
  export let content: string = "";
</script>

<div class="markdown-content">{@html marked(content)}</div> 