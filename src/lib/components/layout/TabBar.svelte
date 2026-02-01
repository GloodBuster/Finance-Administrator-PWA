<script lang="ts">
	// Usamos el estado reactivo moderno de SvelteKit
	import { page } from '$app/state';
	import { Tabbar, TabbarLink } from 'konsta/svelte';
	import ActionMenu from './ActionMenu.svelte';

	let isMenuOpen = $state(false);

	let activeUrl = $derived(page.url.pathname);
	const tabbarLinkStyles = 'flex-1 flex flex-col items-center justify-center h-full';
</script>

<ActionMenu bind:opened={isMenuOpen} />

<div class="fixed bottom-0 z-40 h-14 w-screen bg-gray-950">
	<Tabbar labels={true} class="pb-safe flex h-full items-center">
		<TabbarLink
			active={activeUrl === '/'}
			label="Inicio"
			linkProps={{ href: '/', 'data-sveltekit-preload-data': 'hover' }}
			class={tabbarLinkStyles}
		>
			{#snippet icon()}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					></path></svg
				>
			{/snippet}
		</TabbarLink>

		<TabbarLink
			active={activeUrl.startsWith('/batches')}
			label="Lotes"
			linkProps={{ href: '/batches' }}
			class={tabbarLinkStyles}
		>
			{#snippet icon()}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
					></path></svg
				>
			{/snippet}
		</TabbarLink>

		<div class={tabbarLinkStyles + ' ' + 'relative'}>
			<button
				type="button"
				aria-label="Abrir menú de acciones"
				class="absolute -top-4 flex h-12 w-12 transform items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 transition hover:scale-105 active:scale-95 active:bg-blue-700"
				onclick={() => (isMenuOpen = true)}
			>
				<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
					></path></svg
				>
			</button>
		</div>

		<TabbarLink
			active={activeUrl.startsWith('/record')}
			label="Historial"
			linkProps={{ href: '/record' }}
			class={tabbarLinkStyles}
		>
			{#snippet icon()}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
			{/snippet}
		</TabbarLink>

		<TabbarLink
			active={activeUrl.startsWith('/statistics')}
			label="Stats"
			linkProps={{ href: '/statistics' }}
			class={tabbarLinkStyles}
		>
			{#snippet icon()}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
					></path><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
					></path></svg
				>
			{/snippet}
		</TabbarLink>
	</Tabbar>
</div>
