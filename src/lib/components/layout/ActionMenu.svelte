<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition'; // Importamos las animaciones nativas
	import { quintOut } from 'svelte/easing';

	// Recibimos el estado del padre
	let { opened = $bindable(false) } = $props();

	function navigateTo(path: string) {
		opened = false;
		goto(path);
	}
</script>

{#if opened}
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all"
		onclick={() => (opened = false)}
		transition:fade={{ duration: 200 }}
		role="button"
		tabindex="0"
		aria-label="Cerrar menú"
		onkeydown={(e) => e.key === 'Escape' && (opened = false)}
	></div>

	<div
		class="pb-safe fixed right-0 bottom-0 left-0 z-50 p-4 outline-none"
		transition:fly={{ y: '100%', duration: 300, easing: quintOut, opacity: 1 }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90"
		>
			<div class="border-b border-black/5 py-4 dark:border-white/5">
				<p class="text-center text-xs font-semibold tracking-widest text-zinc-500 uppercase">
					¿Qué movimiento harás?
				</p>
			</div>

			<div class="flex flex-col">
				<button
					class="group flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10"
					onclick={() => navigateTo('/new-expense')}
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl text-orange-600 transition-transform group-active:scale-95 dark:bg-orange-500/20 dark:text-orange-400"
					>
						💸
					</div>
					<div>
						<h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">Nuevo Gasto</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400">Registrar una salida de dinero</p>
					</div>
				</button>

				<div class="mx-6 h-px bg-black/5 dark:bg-white/5"></div>

				<button
					class="group flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10"
					onclick={() => navigateTo('/recharge')}
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 transition-transform group-active:scale-95 dark:bg-emerald-500/20 dark:text-emerald-400"
					>
						💰
					</div>
					<div>
						<h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">Recargar Saldo</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400">Ingresar Bolívares o Dólares</p>
					</div>
				</button>

				<div class="mx-6 h-px bg-black/5 dark:bg-white/5"></div>

				<button
					class="group flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10"
					onclick={() => navigateTo('/transfer')}
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600 transition-transform group-active:scale-95 dark:bg-blue-500/20 dark:text-blue-400"
					>
						🔄
					</div>
					<div>
						<h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">Transferir</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400">Mover a ahorros o fondos</p>
					</div>
				</button>
			</div>
		</div>

		<button
			class="mt-3 w-full rounded-2xl bg-white py-4 font-bold text-red-500 shadow-lg transition-all active:scale-95 dark:bg-zinc-800"
			onclick={() => (opened = false)}
		>
			Cancelar
		</button>
	</div>
{/if}
