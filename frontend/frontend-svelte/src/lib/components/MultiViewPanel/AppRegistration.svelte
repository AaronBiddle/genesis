<script lang="ts">
	export let changeHandler: (detail: { selectedApp: string }) => void;
	
	export let apps = [{ id: 'empty', label: 'Empty' }];
	export let selectedApp = 'empty';
	
	// Removed dispatch initialization; using changeHandler callback instead
	
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedApp = target.value;
		if(changeHandler) changeHandler({ selectedApp });
	}
</script>

<select bind:value={selectedApp} on:change={handleChange}>
	{#each apps as app}
		<option value={app.id}>{app.label}</option>
	{/each}
</select> 