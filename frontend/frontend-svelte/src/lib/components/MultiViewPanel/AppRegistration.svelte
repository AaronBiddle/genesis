<script lang="ts">
	export let onChange: (detail: { selectedApp: string }) => void;
	
	export let apps = [{ id: 'empty', label: 'Empty' }];
	export let selectedApp = 'empty';
	
	// Accept optional preferred dimensions
	export let suggestedWidth: number | undefined;
	export let suggestedHeight: number | undefined;
	
	// Removed dispatch initialization; using onChange callback instead
	
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedApp = target.value;
		if(onChange) onChange({ selectedApp });
	}
</script>

<select bind:value={selectedApp} on:change={handleChange}>
	{#each apps as app}
		<option value={app.id}>{app.label}</option>
	{/each}
</select> 