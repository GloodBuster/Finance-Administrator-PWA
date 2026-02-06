<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { seedDatabase } from '$lib/database/seed';
	import { App } from 'konsta/svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import TabBar from '$lib/components/layout/TabBar.svelte';

	let { children } = $props();

	onMount(async () => {
		await seedDatabase();
	});
</script>

<App theme="ios" safeAreas class="h-full w-full bg-gray-950">
	{@render children()}

	<div class="fixed bottom-0 left-0 z-50 w-full">
		<TabBar />
	</div>
	<Toast />
</App>
