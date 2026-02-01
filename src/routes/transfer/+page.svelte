<script lang="ts">
	import { goto } from '$app/navigation';
	import { v4 as uuidv4 } from 'uuid';
	import { liveQuery } from 'dexie';
	import { Page, Block } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
	import { getCategoryIcon } from '$lib/utils';
	import { fade, fly } from 'svelte/transition';

	let amount = $state('');
	let date = $state(new Date().toISOString().split('T')[0]);
	let note = $state('');
	let loading = $state(false);

	let fromCatId = $state<string | null>(null);
	let toCatId = $state<string | null>(null);

	let isSelectorOpen = $state(false);
	let selectingMode = $state<'from' | 'to'>('from');

	let categories = liveQuery(() => db.categories.filter((c) => !c.isArchived).toArray());

	let fromCat = $derived($categories?.find((c) => c.id === fromCatId));
	let toCat = $derived($categories?.find((c) => c.id === toCatId));

	function openSelector(mode: 'from' | 'to') {
		selectingMode = mode;
		isSelectorOpen = true;
	}

	function selectCategory(id: string) {
		if (selectingMode === 'from') {
			if (id === toCatId) toCatId = null;
			fromCatId = id;
		} else {
			if (id === fromCatId) fromCatId = null;
			toCatId = id;
		}
		isSelectorOpen = false;
	}

	async function handleTransfer() {
		if (!amount || parseFloat(amount) <= 0) {
			toast.show('Monto inválido', 'error');
			return;
		}
		if (!fromCatId || !toCatId) {
			toast.show('Selecciona origen y destino', 'error');
			return;
		}

		loading = true;
		try {
			await db.transfers.add({
				id: uuidv4(),
				date: new Date(date),
				fromCategoryId: fromCatId,
				toCategoryId: toCatId,
				amountUsd: parseFloat(amount),
				note: note || 'Transferencia entre sobres'
			});

			toast.show('Transferencia exitosa', 'success');
			setTimeout(() => goto('/'), 700);
		} catch (error) {
			console.error(error);
			toast.show('Error al transferir', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<Page class="pb-safe h-full w-full overflow-y-auto bg-zinc-50 dark:bg-black">
	<header
		class="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-4 dark:border-zinc-800 dark:bg-black"
	>
		<button
			class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800"
			onclick={() => goto('/')}
			aria-label="Volver al inicio"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path></svg
			>
		</button>
		<h1 class="text-base font-semibold text-zinc-900 dark:text-white">Transferir</h1>
		<div class="w-8"></div>
	</header>

	<div class="space-y-6 px-4 pt-20 pb-24">
		<div
			class="rounded-3xl border border-zinc-100 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
		>
			<label
				for="amount-input"
				class="mb-2 block text-xs font-bold tracking-widest text-zinc-400 uppercase"
				>Monto a Mover</label
			>
			<div class="flex items-center justify-center gap-2">
				<span class="text-3xl font-medium text-zinc-300">$</span>
				<input
					id="amount-input"
					type="number"
					inputmode="decimal"
					placeholder="0.00"
					bind:value={amount}
					class="w-40 bg-transparent text-left text-5xl font-bold text-zinc-900 placeholder-zinc-200 outline-none dark:text-white dark:placeholder-zinc-700"
				/>
			</div>
		</div>

		<div class="relative grid gap-4">
			<div
				class="absolute top-10 bottom-10 left-8 z-0 w-0.5 border-l-2 border-dashed border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800"
			></div>

			<button
				class="group relative z-10 flex w-full items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900"
				onclick={() => openSelector('from')}
				aria-label="Seleccionar categoría de origen. Actual: {fromCat ? fromCat.name : 'Ninguna'}"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-400 transition-colors group-hover:bg-red-50 group-hover:text-red-500 dark:bg-zinc-800"
				>
					DE
				</div>

				{#if fromCat}
					<div
						class="flex flex-1 items-center gap-3 rounded-xl bg-zinc-50 p-2 pr-4 dark:bg-zinc-800/50"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
							style="background-color: {fromCat.color}20; color: {fromCat.color}"
						>
							{getCategoryIcon(fromCat.icon)}
						</div>
						<span class="font-bold text-zinc-900 dark:text-white">{fromCat.name}</span>
					</div>
				{:else}
					<div class="flex-1 p-2">
						<span class="font-medium text-zinc-400">Seleccionar origen...</span>
					</div>
				{/if}

				<svg class="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
					></path></svg
				>
			</button>

			<div
				class="absolute top-1/2 left-6 z-20 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-black"
			>
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					></path></svg
				>
			</div>

			<button
				class="group relative z-10 flex w-full items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900"
				onclick={() => openSelector('to')}
				aria-label="Seleccionar categoría de destino. Actual: {toCat ? toCat.name : 'Ninguna'}"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-500 dark:bg-zinc-800"
				>
					A
				</div>

				{#if toCat}
					<div
						class="flex flex-1 items-center gap-3 rounded-xl bg-zinc-50 p-2 pr-4 dark:bg-zinc-800/50"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
							style="background-color: {toCat.color}20; color: {toCat.color}"
						>
							{getCategoryIcon(toCat.icon)}
						</div>
						<span class="font-bold text-zinc-900 dark:text-white">{toCat.name}</span>
					</div>
				{:else}
					<div class="flex-1 p-2">
						<span class="font-medium text-zinc-400">Seleccionar destino...</span>
					</div>
				{/if}

				<svg class="h-5 w-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
					></path></svg
				>
			</button>
		</div>

		<div class="grid gap-6">
			<div class="flex flex-col gap-2">
				<label
					for="date-input"
					class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Fecha</label
				>
				<input
					id="date-input"
					type="date"
					bind:value={date}
					class="w-full rounded-2xl border border-zinc-100 bg-white px-4 py-4 font-medium text-zinc-900 shadow-sm transition-all outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:scheme-dark"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label
					for="note-input"
					class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase"
					>Nota (Opcional)</label
				>
				<input
					id="note-input"
					type="text"
					placeholder="Ej. Ajuste de presupuesto"
					bind:value={note}
					class="w-full rounded-2xl border border-zinc-100 bg-white px-4 py-4 font-medium text-zinc-900 placeholder-zinc-300 shadow-sm transition-all outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-600"
				/>
			</div>
		</div>

		<button
			class="w-full transform rounded-2xl bg-purple-600 py-4 text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			onclick={handleTransfer}
			disabled={loading}
			aria-label="Confirmar transferencia"
		>
			{#if loading}
				<span class="flex items-center justify-center gap-2">Procesando...</span>
			{:else}
				Realizar Transferencia
			{/if}
		</button>
	</div>

	{#if isSelectorOpen}
		<div
			class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
			transition:fade={{ duration: 200 }}
			role="button"
			tabindex="0"
			onclick={() => (isSelectorOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isSelectorOpen = false)}
			aria-label="Cerrar selector"
		></div>

		<div
			class="fixed right-0 bottom-0 left-0 z-70 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-zinc-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
			transition:fly={{ y: 300, duration: 300 }}
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-lg font-bold dark:text-white">
					Seleccionar {selectingMode === 'from' ? 'Origen' : 'Destino'}
				</h2>
				<button
					onclick={() => (isSelectorOpen = false)}
					class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
					aria-label="Cerrar">✕</button
				>
			</div>

			{#if $categories}
				<div class="grid grid-cols-3 gap-3">
					{#each $categories as cat (cat.id)}
						{#if (selectingMode === 'from' && cat.id !== toCatId) || (selectingMode === 'to' && cat.id !== fromCatId)}
							<button
								class="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-all duration-200 hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
								onclick={() => selectCategory(cat.id)}
								aria-label="Elegir categoría {cat.name}"
							>
								<div
									class="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
									style="background-color: {cat.color}20; color: {cat.color}"
								>
									{getCategoryIcon(cat.icon)}
								</div>
								<span
									class="line-clamp-2 text-center text-xs leading-tight font-medium text-zinc-700 dark:text-zinc-300"
								>
									{cat.name}
								</span>
							</button>
						{/if}
					{/each}
				</div>
			{/if}
			<div class="h-8"></div>
		</div>
	{/if}
</Page>
