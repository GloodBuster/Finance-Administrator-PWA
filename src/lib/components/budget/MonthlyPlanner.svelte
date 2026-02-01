<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { liveQuery } from 'dexie';
	import { fade, fly } from 'svelte/transition';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
	import { getCategoryIcon } from '$lib/utils';

	let { isOpen = $bindable(false) } = $props();

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();

	let loading = $state(false);

	let budgetInputs = $state<Record<string, string>>({});

	$effect(() => {
		if (isOpen) {
			loadBudgets();
		}
	});

	async function loadBudgets() {
		const cats = await db.categories.filter((c) => !c.isArchived).toArray();

		const existingBudgets = await db.monthlyBudgets
			.where('[year+month]')
			.equals([currentYear, currentMonth])
			.toArray();

		const newInputs: Record<string, string> = {};
		cats.forEach((cat) => {
			const found = existingBudgets.find((b) => b.categoryId === cat.id);
			newInputs[cat.id] = found ? found.amountUsd.toString() : '';
		});
		budgetInputs = newInputs;
	}

	async function handleSave() {
		loading = true;
		try {
			const cats = await db.categories.filter((c) => !c.isArchived).toArray();

			const promises = cats.map(async (cat) => {
				const amountVal = parseFloat(budgetInputs[cat.id]);

				const existing = await db.monthlyBudgets
					.where({ categoryId: cat.id, year: currentYear, month: currentMonth })
					.first();

				if (!isNaN(amountVal) && amountVal > 0) {
					if (existing) {
						await db.monthlyBudgets.update(existing.id, { amountUsd: amountVal });
					} else {
						await db.monthlyBudgets.add({
							id: uuidv4(),
							categoryId: cat.id,
							year: currentYear,
							month: currentMonth,
							amountUsd: amountVal
						});
					}
				} else if (existing) {
					await db.monthlyBudgets.delete(existing.id);
				}
			});

			await Promise.all(promises);
			toast.show('Presupuesto actualizado', 'success');
			isOpen = false;
		} catch (error) {
			console.error(error);
			toast.show('Error al guardar', 'error');
		} finally {
			loading = false;
		}
	}

	let categories = liveQuery(() => db.categories.filter((c) => !c.isArchived).toArray());
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		role="button"
		tabindex="0"
		onclick={() => (isOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
	></div>

	<div
		class="fixed right-0 bottom-0 left-0 z-70 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-zinc-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold dark:text-white">Planificar Mes</h2>
				<p class="text-xs tracking-widest text-zinc-400 uppercase">
					{now.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
				</p>
			</div>
			<button
				onclick={() => (isOpen = false)}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
				>✕</button
			>
		</div>

		{#if $categories}
			<div class="space-y-4">
				{#each $categories as cat (cat.id)}
					<div class="flex items-center gap-4">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
							style="background-color: {cat.color}20; color: {cat.color}"
						>
							{getCategoryIcon(cat.icon)}
						</div>

						<div class="flex-1">
							<label
								for="budget-{cat.id}"
								class="mb-1 block text-xs font-bold text-zinc-900 dark:text-white"
							>
								{cat.name}
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-zinc-400"
									>$</span
								>
								<input
									id="budget-{cat.id}"
									type="number"
									placeholder="Sin límite"
									bind:value={budgetInputs[cat.id]}
									class="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-7 font-medium text-zinc-900 transition-all outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
								/>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-8 border-t border-zinc-100 pt-4 dark:border-zinc-800">
			<button
				class="w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
				onclick={handleSave}
				disabled={loading}
			>
				{loading ? 'Guardando...' : 'Guardar Planificación'}
			</button>
		</div>

		<div class="h-6"></div>
	</div>
{/if}
