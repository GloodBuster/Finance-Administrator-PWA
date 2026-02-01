<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Page } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { getCategoryIcon } from '$lib/utils';
	import { fade } from 'svelte/transition';

	// --- IMPORTAMOS CHART.JS ---
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';

	// --- ESTADO ---
	let viewDate = $state(new Date());
	let canvasRef: HTMLCanvasElement; // Referencia al <canvas>
	let chartInstance: Chart | null = null; // Instancia del gráfico

	function changeMonth(delta: number) {
		viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
	}

	// --- PROCESAMIENTO DE DATOS ---
	let stats = liveQuery(async () => {
		const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
		const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);

		const expenses = await db.expenses.where('date').between(start, end).toArray();
		const categories = await db.categories.toArray();
		const catMap = new Map(categories.map((c) => [c.id, c]));

		const grouped: Record<string, number> = {};
		let totalSpent = 0;

		expenses.forEach((exp) => {
			const catId = exp.categoryId || 'uncategorized';
			if (!grouped[catId]) grouped[catId] = 0;
			grouped[catId] += exp.realUsdCost;
			totalSpent += exp.realUsdCost;
		});

		const ranking = Object.entries(grouped)
			.map(([catId, amount]) => {
				const cat = catMap.get(catId);
				return {
					id: catId,
					name: cat ? cat.name : 'Sin Categoría',
					icon: cat ? cat.icon : '❓',
					color: cat ? cat.color : '#9ca3af',
					amount: amount,
					percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
				};
			})
			.sort((a, b) => b.amount - a.amount);

		return { totalSpent, ranking };
	});

	// --- MAGIA DEL GRÁFICO (Svelte 5 Effect) ---
	// Este bloque se ejecuta cada vez que cambian los datos ($stats)
	$effect(() => {
		if (!$stats || !canvasRef) return;

		// 1. Destruir gráfico anterior si existe para evitar duplicados
		if (chartInstance) {
			chartInstance.destroy();
		}

		// 2. Preparar datos para Chart.js
		const labels = $stats.ranking.map((item) => item.name);
		const dataValues = $stats.ranking.map((item) => item.amount);
		const backgroundColors = $stats.ranking.map((item) => item.color);

		// Si no hay datos, mostramos un gráfico gris vacío
		const isEmpty = dataValues.length === 0;

		// 3. Crear nueva instancia
		chartInstance = new Chart(canvasRef, {
			type: 'doughnut',
			data: {
				labels: isEmpty ? ['Sin gastos'] : labels,
				datasets: [
					{
						data: isEmpty ? [1] : dataValues,
						backgroundColor: isEmpty ? ['#f4f4f5'] : backgroundColors,
						borderWidth: 0, // Sin bordes para look moderno
						hoverOffset: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '75%', // Hace la dona más fina (elegante)
				plugins: {
					legend: {
						display: false // Ocultamos la leyenda nativa (usaremos nuestra lista)
					},
					tooltip: {
						enabled: !isEmpty, // Solo mostrar tooltip si hay datos
						callbacks: {
							label: function (context) {
								let label = context.label || '';
								if (label) label += ': ';
								if (context.parsed !== null) {
									label += new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD'
									}).format(context.parsed);
								}
								return label;
							}
						}
					}
				}
			}
		});

		// Cleanup al desmontar
		return () => {
			if (chartInstance) chartInstance.destroy();
		};
	});
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

	<div class="space-y-8 px-4 pt-20">
		<div class="relative flex h-64 w-full items-center justify-center">
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="mb-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Total</span>
				<span class="text-3xl font-black text-zinc-900 dark:text-white">
					{#if $stats}
						${Math.floor($stats.totalSpent).toLocaleString('en-US')}
						<span class="text-lg font-medium text-zinc-400"
							>.{(($stats.totalSpent % 1) * 100).toFixed(0).padStart(2, '0')}</span
						>
					{:else}
						$0.00
					{/if}
				</span>
			</div>

			<canvas bind:this={canvasRef}></canvas>
		</div>

		{#if $stats && $stats.ranking.length > 0}
			<section class="space-y-3" transition:fade>
				<h3 class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
					Detalle por Sobre
				</h3>

				{#each $stats.ranking as item (item.id)}
					<div
						class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
					>
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-sm"
								style="background-color: {item.color}20; color: {item.color}"
							>
								{getCategoryIcon(item.icon)}
							</div>

							<div>
								<p class="text-sm leading-tight font-bold text-zinc-900 dark:text-white">
									{item.name}
								</p>
								<div class="mt-1 flex items-center gap-2">
									<div class="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
										<div
											class="h-full rounded-full"
											style="width: {item.percentage}%; background-color: {item.color}"
										></div>
									</div>
									<span class="text-[10px] font-bold text-zinc-400"
										>{item.percentage.toFixed(0)}%</span
									>
								</div>
							</div>
						</div>

						<div class="text-right">
							<p class="text-sm font-bold text-zinc-900 dark:text-white">
								$ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
							</p>
						</div>
					</div>
				{/each}
			</section>
		{:else}
			<div class="py-4 text-center text-zinc-400 opacity-60">
				<p class="text-sm">No hay gastos registrados este mes.</p>
			</div>
		{/if}
	</div>
</Page>
