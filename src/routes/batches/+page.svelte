<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Page } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { fade } from 'svelte/transition';

	let batches = liveQuery(() => db.batches.orderBy('createdAt').reverse().toArray());

	let stats = $derived.by(() => {
		if (!$batches) return { active: [], finished: [], avgRate: 0, totalBs: 0 };

		const active = $batches.filter((b) => b.currentVes > 0.01);
		const finished = $batches.filter((b) => b.currentVes <= 0.01);

		const totalBs = active.reduce((acc, b) => acc + b.currentVes, 0);

		let weightedSum = 0;
		active.forEach((b) => {
			weightedSum += b.currentVes * b.exchangeRate;
		});

		let totalCostUsd = active.reduce((acc, b) => acc + b.currentVes / b.exchangeRate, 0);

		const avgRate = totalCostUsd > 0 ? totalBs / totalCostUsd : 0;

		return { active, finished, avgRate, totalBs };
	});

	function getProgressColor(current: number, initial: number) {
		const percentage = (current / initial) * 100;
		if (percentage > 50) return 'bg-emerald-500';
		if (percentage > 20) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

<Page class="h-full w-full overflow-y-auto bg-zinc-50 pb-24 dark:bg-black">
	<header
		class="pt-safe fixed top-0 right-0 left-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-black/90"
	>
		<div class="flex h-16 items-center justify-between px-6">
			<h1 class="text-xl font-bold text-zinc-900 dark:text-white">Inventario de Bs</h1>

			<div class="flex flex-col items-end">
				<span class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
					>Tasa Promedio</span
				>
				<span class="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
					{stats.avgRate.toFixed(2)}
				</span>
			</div>
		</div>
	</header>

	<div class="space-y-8 px-4 pt-20">
		<section>
			<div class="mb-4 flex items-center justify-between px-1">
				<h2 class="text-xs font-bold tracking-widest text-zinc-400 uppercase">
					Activos ({stats.active.length})
				</h2>
				<span class="text-xs font-bold text-zinc-900 dark:text-white"
					>Total: Bs. {stats.totalBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span
				>
			</div>

			{#if stats.active.length > 0}
				<div class="grid gap-4">
					{#each stats.active as batch (batch.id)}
						<div
							class="relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
							transition:fade
						>
							<div
								class="absolute bottom-0 left-0 h-1 {getProgressColor(
									batch.currentVes,
									batch.initialVes
								)}"
								style="width: {(batch.currentVes / batch.initialVes) * 100}%"
							></div>

							<div class="mb-2 flex items-start justify-between">
								<div>
									<span
										class="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
									>
										Tasa: {batch.exchangeRate}
									</span>
									<p class="mt-2 text-[10px] text-zinc-400">
										Creado el {batch.createdAt.toLocaleDateString('es-VE')}
									</p>
								</div>
								<div class="text-right">
									<p class="text-2xl leading-none font-bold text-zinc-900 dark:text-white">
										{batch.currentVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
									</p>
									<p class="mt-1 text-xs text-zinc-400">
										de {batch.initialVes.toLocaleString('es-VE', { maximumFractionDigits: 0 })} Bs iniciales
									</p>
								</div>
							</div>

							<div
								class="mt-4 flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-800"
							>
								<span class="text-xs text-zinc-400">Valor real restante:</span>
								<span class="text-sm font-medium text-emerald-600 dark:text-emerald-400">
									$ {(batch.currentVes / batch.exchangeRate).toFixed(2)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="rounded-3xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800"
				>
					<p class="text-sm text-zinc-400">No tienes Bolívares. ¡Recarga saldo!</p>
				</div>
			{/if}
		</section>

		{#if stats.finished.length > 0}
			<section class="opacity-60 transition-opacity duration-300 hover:opacity-100">
				<h2 class="mb-4 px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
					Agotados Recientemente
				</h2>

				<div class="space-y-3">
					{#each stats.finished.slice(0, 5) as batch (batch.id)}
						<div
							class="flex items-center justify-between rounded-xl bg-zinc-100 p-4 grayscale dark:bg-zinc-800/50"
						>
							<div>
								<p class="text-sm font-bold text-zinc-600 dark:text-zinc-400">
									Tasa {batch.exchangeRate}
								</p>
								<p class="text-[10px] text-zinc-400">
									{batch.createdAt.toLocaleDateString('es-VE')}
								</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-bold text-zinc-600 line-through dark:text-zinc-400">
									Bs. {batch.initialVes}
								</p>
								<span
									class="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:bg-zinc-700"
									>Agotado</span
								>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</Page>
