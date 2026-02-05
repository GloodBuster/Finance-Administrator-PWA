<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Page } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
	import { getCategoryIcon } from '$lib/utils';
	import { fade } from 'svelte/transition';

	// --- 1. DEFINICIÓN DE TIPO UNIFICADO ---

	type OriginalCurrency = 'VES' | 'USD';
	interface Movement {
		id: string;
		type: 'expense' | 'income' | 'batch' | 'transfer';
		date: Date;
		desc: string;
		amount: number; // SIEMPRE EN USD para visualización principal
		originalAmount?: number; // Monto en moneda original (si fue VES)
		originalCurrency: OriginalCurrency;
		category?: string | null;
		rate?: number;
		transferFrom?: string;
		transferTo?: string;
		rawObj: any;
	}

	// --- ESTADO ---
	let viewDate = $state(new Date());
	let movements = $state<Movement[]>([]);
	let loading = $state(true);

	// --- AYUDAS DE FECHA ---
	function getMonthRange(date: Date) {
		const year = date.getFullYear();
		const month = date.getMonth();
		// Rango UTC estricto
		const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
		const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
		return { start, end };
	}

	function changeMonth(delta: number) {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
	}

	// --- CATEGORÍAS ---
	let categoriesMap = liveQuery(async () => {
		const cats = await db.categories.toArray();
		const map = new Map();
		cats.forEach((c) => map.set(c.id, c));
		return map;
	});

	// --- CONSULTA ---
	$effect(() => {
		const { start, end } = getMonthRange(viewDate);
		loading = true;

		const subscription = liveQuery(async () => {
			const allExpenses = await db.expenses.toArray();
			const allIncomes = await db.incomes.toArray();
			const allBatches = await db.batches.toArray();
			const allTransfers = await db.transfers.toArray();

			// Filtros
			const expenses = allExpenses.filter((e) => e.date >= start && e.date <= end);
			const incomes = allIncomes.filter((i) => i.date >= start && i.date <= end);
			const batches = allBatches.filter((b) => b.createdAt >= start && b.createdAt <= end);
			const transfers = allTransfers.filter((t) => t.date >= start && t.date <= end);

			// Unificación
			const mixed: Movement[] = [
				...expenses.map((e) => ({
					id: e.id,
					type: 'expense' as const,
					date: e.date,
					desc: e.description || 'Sin descripción',
					amount: e.realUsdCost,
					originalAmount: e.amountVes,
					originalCurrency: e.originalCurrency as OriginalCurrency,
					category: e.categoryId,
					rawObj: e
				})),
				...incomes.map((i) => ({
					id: i.id,
					type: 'income' as const,
					date: i.date,
					desc: i.description || 'Ingreso',
					amount: i.amountUsd,
					originalCurrency: 'USD' as OriginalCurrency,
					category: null,
					rawObj: i
				})),
				...batches.map((b) => ({
					id: b.id,
					type: 'batch' as const,
					date: b.createdAt,
					desc: 'Recarga de Bs',
					amount: b.initialUsd,
					originalAmount: b.initialVes,
					originalCurrency: 'VES' as OriginalCurrency,
					rate: b.exchangeRate,
					category: null,
					rawObj: b
				})),
				...transfers.map((t) => {
					const visualDate = new Date(t.date);
					return {
						id: t.id,
						type: 'transfer' as const,
						date: visualDate,
						desc: t.note || 'Transferencia',
						amount: t.amountUsd,
						originalCurrency: 'USD' as OriginalCurrency,
						transferFrom: t.fromCategoryId,
						transferTo: t.toCategoryId,
						rawObj: t
					};
				})
			];

			return mixed.sort((a, b) => b.date.getTime() - a.date.getTime());
		}).subscribe((data) => {
			movements = data;
			loading = false;
		});

		return () => subscription.unsubscribe();
	});

	// --- AGRUPAR POR DÍA ---
	let groupedMovements = $derived.by(() => {
		const groups: { title: string; dateObj: Date; items: Movement[] }[] = [];
		let currentGroup: (typeof groups)[0] | null = null;

		movements.forEach((move) => {
			const dateStr = move.date.toLocaleDateString('es-VE', {
				weekday: 'long',
				day: 'numeric',
				month: 'long'
			});

			if (!currentGroup || currentGroup.title !== dateStr) {
				currentGroup = { title: dateStr, dateObj: move.date, items: [] };
				groups.push(currentGroup);
			}
			currentGroup.items.push(move);
		});
		return groups;
	});

	// --- BORRAR ---
	async function handleDelete(move: Movement) {
		if (!confirm('¿Eliminar este registro? Esta acción afectará tus saldos.')) return;
		try {
			if (move.type === 'expense') await db.expenses.delete(move.id);
			if (move.type === 'income') await db.incomes.delete(move.id);
			if (move.type === 'batch') await db.batches.delete(move.id);
			if (move.type === 'transfer') await db.transfers.delete(move.id);
			toast.show('Registro eliminado', 'success');
		} catch (e) {
			console.error(e);
			toast.show('Error al eliminar', 'error');
		}
	}
</script>

<Page class="h-full w-full overflow-y-auto bg-zinc-50 pb-24 dark:bg-black">
	<header
		class="pt-safe fixed top-0 right-0 left-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-black/90"
	>
		<div class="flex h-14 items-center justify-between px-4">
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100 dark:active:bg-zinc-800"
				onclick={() => changeMonth(-1)}
				aria-label="Mes anterior"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path></svg
				>
			</button>
			<h1 class="text-base font-bold text-zinc-900 capitalize dark:text-white">
				{viewDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
			</h1>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100 dark:active:bg-zinc-800"
				onclick={() => changeMonth(1)}
				aria-label="Mes siguiente"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
					></path></svg
				>
			</button>
		</div>
	</header>

	<div class="space-y-6 px-4 pt-20">
		{#if groupedMovements.length > 0}
			{#each groupedMovements as group}
				<div class="space-y-2" transition:fade>
					<h3
						class="sticky top-16 z-30 bg-zinc-50/95 px-2 py-1 text-xs font-bold tracking-widest text-zinc-400 uppercase backdrop-blur-sm dark:bg-black/95"
					>
						{group.title}
					</h3>
					<div
						class="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
					>
						{#each group.items as move, i}
							{#if i > 0}
								<div class="mx-4 h-px bg-zinc-100 dark:bg-zinc-800"></div>
							{/if}

							<div
								class="group relative flex items-center justify-between p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
							>
								<div class="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg
                                        {move.type === 'expense'
											? 'bg-zinc-100 dark:bg-zinc-800'
											: ''}
                                        {move.type === 'income'
											? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
											: ''}
                                        {move.type === 'batch'
											? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
											: ''}
                                        {move.type === 'transfer'
											? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
											: ''}"
									>
										{#if move.type === 'expense'}
											{#if $categoriesMap && move.category && $categoriesMap.get(move.category)}
												<span style="color: {$categoriesMap.get(move.category).color}">
													{getCategoryIcon($categoriesMap.get(move.category).icon)}
												</span>
											{:else}💸{/if}
										{/if}
										{#if move.type === 'income'}💰{/if}
										{#if move.type === 'batch'}🔄{/if}
										{#if move.type === 'transfer'}⇄{/if}
									</div>

									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-bold text-zinc-900 dark:text-white">
											{move.desc}
										</p>

										<div class="mt-0.5 flex flex-col items-start gap-0.5 text-xs text-zinc-500">
											{#if move.type === 'expense' && $categoriesMap && move.category}
												<span class="w-full truncate font-medium text-zinc-600 dark:text-zinc-400">
													{$categoriesMap.get(move.category)?.name}
												</span>
												{#if move.originalCurrency === 'VES'}
													<span class="text-[11px] opacity-80">
														Bs. {move.originalAmount?.toLocaleString('es-VE')}
													</span>
												{/if}
											{/if}

											{#if move.type === 'batch'}
												<span>Tasa: {move.rate}</span>
												<span class="text-[11px] opacity-80">
													Bs. {move.originalAmount?.toLocaleString('es-VE')}
												</span>
											{/if}

											{#if move.type === 'transfer' && $categoriesMap && move.transferFrom && move.transferTo}
												<span
													class="flex w-full items-center gap-1 truncate text-purple-600/80 dark:text-purple-400/80"
												>
													{$categoriesMap.get(move.transferFrom)?.name}
													<svg
														class="h-3 w-3 shrink-0"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M17 8l4 4m0 0l-4 4m4-4H3"
														></path></svg
													>
													{$categoriesMap.get(move.transferTo)?.name}
												</span>
											{/if}

											{#if move.type === 'income'}
												<span>Ingreso directo</span>
											{/if}
										</div>
									</div>
								</div>

								<div class="flex items-center gap-3 pl-2">
									<span
										class="text-sm font-bold whitespace-nowrap
                                        {move.type === 'expense'
											? 'text-zinc-900 dark:text-white'
											: ''}
                                        {move.type === 'income'
											? 'text-emerald-600 dark:text-emerald-400'
											: ''}
                                        {move.type === 'batch'
											? 'text-blue-600 dark:text-blue-400'
											: ''}
                                        {move.type === 'transfer'
											? 'text-purple-600 dark:text-purple-400'
											: ''}"
									>
										{move.type === 'expense' ? '-' : move.type === 'income' ? '+' : '•'}
										$ {move.amount.toLocaleString('en-US', {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2
										})}
									</span>

									<button
										class="rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
										onclick={() => handleDelete(move)}
										aria-label="Eliminar movimiento"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											></path></svg
										>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
			<div class="py-2 text-center text-xs text-zinc-400"><p>— Fin de la actividad —</p></div>
		{:else}
			<div class="flex flex-col items-center justify-center py-20 text-zinc-400">
				<span class="mb-4 text-6xl opacity-30 grayscale">📅</span>
				<p class="font-medium text-zinc-500">{loading ? 'Cargando...' : 'Sin actividad'}</p>
				<p class="text-sm">{loading ? 'Obteniendo registros' : 'No hay registros en este mes.'}</p>
			</div>
		{/if}
	</div>
</Page>
