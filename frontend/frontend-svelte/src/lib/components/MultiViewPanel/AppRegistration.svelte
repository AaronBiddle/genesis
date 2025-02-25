<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let apps = [{ id: 'empty', label: 'Empty' }];
	export let selectedApp = 'empty';
	
	const dispatch = createEventDispatcher();
	
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedApp = target.value;
		dispatch('change', { selectedApp });
	}
</script>

<select bind:value={selectedApp} on:change={handleChange}>
	{#each apps as app}
		<option value={app.id}>{app.label}</option>
	{/each}
</select> 