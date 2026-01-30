<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
</script>

{#if $toast.visible}
	<div
		class="fixed top-6 left-1/2 z-100 w-[90%] max-w-sm -translate-x-1/2 transform"
		transition:fly={{ y: -20, duration: 300, easing: quintOut }}
	>
		<div
			class="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md
            {$toast.type === 'success' ? 'border-emerald-400 bg-emerald-500/90 text-white' : ''}
            {$toast.type === 'error' ? 'border-red-400 bg-red-500/90 text-white' : ''}
            {$toast.type === 'info' ? 'border-zinc-700 bg-zinc-800/90 text-white' : ''}"
		>
			<div class="text-xl">
				{#if $toast.type === 'success'}✅{/if}
				{#if $toast.type === 'error'}⚠️{/if}
				{#if $toast.type === 'info'}ℹ️{/if}
			</div>

			<p class="text-sm font-medium">{$toast.message}</p>
		</div>
	</div>
{/if}
