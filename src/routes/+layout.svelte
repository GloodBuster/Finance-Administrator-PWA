<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { seedDatabase } from '$lib/database/seed';
	import { App, Page } from 'konsta/svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	// Importamos nuestra nueva barra
	import TabBar from '$lib/components/layout/TabBar.svelte';

	let { children } = $props();

	onMount(async () => {
		await seedDatabase();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<App theme="ios" safeAreas>
	<Page class="relative h-screen w-screen bg-gray-950 px-4">
		<div class="h-full overflow-y-auto pb-14">
			{@render children()}
		</div>
	</Page>
	<TabBar />
	<Toast />
</App>
