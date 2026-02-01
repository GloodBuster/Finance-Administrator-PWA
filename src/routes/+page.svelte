<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Page } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { getCategoryIcon } from '$lib/utils';
	import BottomNav from '$lib/components/layout/TabBar.svelte';
	import MonthlyPlanner from '$lib/components/budget/MonthlyPlanner.svelte';

	let { data } = $props();
	let isPlannerOpen = $state(false);

	// 1. Saldo Total Global (Dinero físico/digital total)
	let totalVes = liveQuery(async () => {
		const batches = await db.batches.where('currentVes').above(0).toArray();
		return batches.reduce((total, batch) => total + batch.currentVes, 0);
	});
	let totalUsdt = $derived((($totalVes ?? 0) / data.tasa).toFixed(2));

	// 2. Consulta Maestra: Categorías + Saldos + Presupuestos
	let categoriesWithData = liveQuery(async () => {
		const cats = await db.categories.filter((c) => !c.isArchived).toArray();

		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();

		// Rangos de fecha (Mes actual)
		const startOfMonth = new Date(currentYear, currentMonth, 1);
		const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

		// Traemos TODO lo necesario (Dexie es rápido, no te preocupes)
		const allExpenses = await db.expenses.toArray();
		const allTransfers = await db.transfers.toArray();

		// Presupuestos/Metas de ESTE mes
		const budgets = await db.monthlyBudgets
			.where('[year+month]')
			.equals([currentYear, currentMonth])
			.toArray();

		return cats.map((cat) => {
			// A. LÓGICA DE PRESUPUESTO (Mes Actual)
			const budgetObj = budgets.find((b) => b.categoryId === cat.id);
			const budgetAmount = budgetObj ? budgetObj.amountUsd : 0;

			// B. CÁLCULOS SEGÚN TIPO
			let displayAmount = 0; // Lo que se muestra grande
			let progress = 0; // Para la barra
			let label = ''; // Texto descriptivo ("Gastado" o "Disponible")

			if (cat.isSavings) {
				// --- MODO AHORRO (STOCK) ---
				// 1. Calcular Saldo Histórico (Disponible Real)
				// Entradas (Transferencias hacia aquí)
				const totalIn = allTransfers
					.filter((t) => t.toCategoryId === cat.id)
					.reduce((sum, t) => sum + t.amountUsd, 0);

				// Salidas (Transferencias desde aquí hacia otro lado)
				const totalOut = allTransfers
					.filter((t) => t.fromCategoryId === cat.id)
					.reduce((sum, t) => sum + t.amountUsd, 0);

				// Gastos (Dinero que salió de esta categoría)
				const totalSpent = allExpenses
					.filter((e) => e.categoryId === cat.id)
					.reduce((sum, e) => sum + e.realUsdCost, 0);

				const availableBalance = totalIn - totalOut - totalSpent;
				displayAmount = availableBalance;
				label = 'Disponible';

				// 2. Calcular Progreso de la Meta del Mes (Aporte mensual)
				// ¿Cuánto he transferido a esta cuenta ESTE mes?
				const contributionsThisMonth = allTransfers
					.filter(
						(t) => t.toCategoryId === cat.id && t.date >= startOfMonth && t.date <= endOfMonth
					)
					.reduce((sum, t) => sum + t.amountUsd, 0);

				// La barra muestra cuánto he aportado vs la meta
				progress = budgetAmount > 0 ? (contributionsThisMonth / budgetAmount) * 100 : 0;
			} else {
				// --- MODO GASTO (FLUJO) ---
				// Gastos de este mes
				const spentThisMonth = allExpenses
					.filter((e) => e.categoryId === cat.id && e.date >= startOfMonth && e.date <= endOfMonth)
					.reduce((sum, e) => sum + e.realUsdCost, 0);

				displayAmount = spentThisMonth;
				label = 'Gastado';

				// La barra muestra gasto vs tope
				progress = budgetAmount > 0 ? (spentThisMonth / budgetAmount) * 100 : 0;
			}

			return {
				...cat,
				displayAmount, // Puede ser "Gastado este mes" o "Saldo total" según el tipo
				budget: budgetAmount,
				progress,
				label
			};
		});
	});
</script>

<Page class="h-full w-full overflow-y-auto bg-zinc-50 pb-24 dark:bg-black">
	<header
		class="pt-safe fixed top-0 right-0 left-0 z-40 border-b border-zinc-100 bg-white/80 px-6 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-black/80"
	>
		<div class="flex h-16 items-center justify-between">
			<div>
				<h1 class="mb-0.5 text-xs font-bold tracking-widest text-zinc-400 uppercase">
					Mi Billetera
				</h1>
				<span class="text-xl font-bold text-zinc-900 dark:text-white">Resumen Global</span>
			</div>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-xl shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
			>
				👤
			</div>
		</div>
	</header>

	<div class="space-y-6 px-4 pt-24">
		<div
			class="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 to-blue-700 p-6 text-white shadow-xl shadow-blue-600/30"
		>
			<div class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
			<div
				class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"
			></div>
			<div class="relative z-10">
				<p class="text-sm font-medium text-blue-100/80">Saldo Disponible (Bs)</p>
				<h2 class="mt-2 text-4xl font-black tracking-tight">
					Bs. {$totalVes?.toLocaleString('es-VE', { maximumFractionDigits: 2 }) ?? '0,00'}
				</h2>
				<div class="mt-4 flex items-center gap-3">
					<div
						class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md"
					>
						<span class="text-xs font-medium text-blue-50">≈ $ {totalUsdt} USDT</span>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div
				class="flex flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div>
					<div class="mb-2 flex items-center gap-2">
						<span class="text-lg">🏦</span>
						<p class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Tasa BCV</p>
					</div>
					<span class="text-2xl font-bold text-zinc-900 dark:text-white">{data.tasa}</span>
				</div>
				<p class="mt-2 text-right text-[10px] font-medium text-zinc-400">{data.fecha}</p>
			</div>
			<button
				class="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
				onclick={() => (isPlannerOpen = true)}
			>
				<div
					class="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl transition-transform group-hover:scale-110 dark:bg-zinc-800"
				>
					📊
				</div>
				<span class="text-xs font-bold text-zinc-600 dark:text-zinc-300">Planificar Mes</span>
			</button>
		</div>

		<div>
			<h3 class="mb-3 px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
				Mis Sobres
			</h3>

			{#if $categoriesWithData}
				<div class="pb-safe grid grid-cols-2 gap-3">
					{#each $categoriesWithData as cat (cat.id)}
						<div
							class="relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
						>
							<div
								class="absolute top-0 bottom-0 left-0 w-1"
								style="background-color: {cat.isSavings ? '#10b981' : cat.color}"
							></div>

							<div class="flex items-start justify-between pl-2">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-zinc-800"
								>
									{getCategoryIcon(cat.icon)}
								</div>

								<div class="text-right">
									<span
										class="block text-xs font-bold {cat.isSavings
											? 'text-emerald-600 dark:text-emerald-400'
											: 'text-zinc-900 dark:text-white'}"
									>
										$ {cat.displayAmount.toLocaleString('en-US', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0
										})}
									</span>
									<span class="text-[9px] tracking-wider text-zinc-400 uppercase">{cat.label}</span>
								</div>
							</div>

							<div class="mt-3 pl-2">
								<div class="mb-1 flex items-end justify-between">
									<h3 class="text-sm leading-tight font-medium text-zinc-900 dark:text-white">
										{cat.name}
									</h3>
									{#if cat.isSavings && cat.budget > 0}
										<span class="text-[9px] text-zinc-400">Meta: ${cat.budget}</span>
									{/if}
								</div>

								{#if cat.budget > 0}
									<div
										class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
									>
										<div
											class="h-full rounded-full transition-all duration-500"
											style="width: {Math.min(cat.progress, 100)}%; background-color: {cat.isSavings
												? '#10b981'
												: cat.progress > 100
													? '#ef4444'
													: cat.color}"
										></div>
									</div>

									{#if !cat.isSavings && cat.progress > 100}
										<p class="mt-1 text-[9px] font-bold text-red-500">¡Excedido!</p>
									{/if}
									{#if cat.isSavings && cat.progress >= 100}
										<p class="mt-1 text-[9px] font-bold text-emerald-600">
											¡Meta del mes cumplida! 🎉
										</p>
									{/if}
								{:else}
									<p class="text-[10px] text-zinc-500">
										{cat.isSavings ? 'Ahorro libre' : 'Sin límite'}
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-8 text-center text-sm text-zinc-500">Cargando sobres...</div>
			{/if}
		</div>
	</div>

	<BottomNav />
	<MonthlyPlanner bind:isOpen={isPlannerOpen} />
</Page>
