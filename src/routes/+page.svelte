<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Page, Navbar, Block, BlockTitle } from 'konsta/svelte'; // Quitamos imports no usados
	import { db } from '$lib/database/index';
	import { getCategoryIcon } from '$lib/utils'; // Importamos tu nueva utilidad

	let { data } = $props();

	// Consultas a la BD
	let categories = liveQuery(() => db.categories.toArray());

	let totalVes = liveQuery(async () => {
		const batches = await db.batches.where('currentVes').above(0).toArray();
		return batches.reduce((total, batch) => total + batch.currentVes, 0);
	});
</script>

<Page class="h-full w-full px-4 py-1">
	<Navbar title="Mi Balance" centerTitle large class="text-2xl" titleFontSizeIos="text-[20px]" />

	<div class="grid grid-cols-2 gap-3 py-4">
		<div class="col-span-2 rounded-2xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-900/20">
			<p class="text-sm font-medium text-blue-100">Saldo Disponible (Bs)</p>
			<h2 class="mt-1 text-4xl font-bold tracking-tight">
				Bs. {$totalVes?.toLocaleString('es-VE') ?? '0'}
			</h2>
			<div
				class="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/30 px-3 py-1.5 backdrop-blur-sm"
			>
				<span class="text-xs font-semibold"
					>≈ $ {(($totalVes ?? 0) / data.tasa).toFixed(2)} USDT</span
				>
			</div>
		</div>

		<div
			class="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900"
		>
			<div>
				<p class="mb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Tasa BCV</p>
				<div class="flex items-baseline gap-1">
					<span class="text-xl font-bold text-zinc-900 dark:text-white">{data.tasa}</span>
					<span class="text-xs text-zinc-500">Bs/USD</span>
				</div>
			</div>
			<p class="mt-2 text-right text-[10px] text-zinc-400">
				{data.fecha}
			</p>
		</div>

		<button
			class="group flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 p-4 transition-all active:scale-95 active:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:active:bg-zinc-800"
			onclick={() => alert('¡Próximamente el Splitter de cuentas!')}
		>
			<span class="text-2xl grayscale filter transition-all group-hover:grayscale-0">🧮</span>
			<span
				class="text-xs font-semibold text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white"
			>
				Herramientas
			</span>
		</button>
	</div>

	<BlockTitle>Mis Sobres</BlockTitle>

	{#if $categories}
		<div class="grid grid-cols-2 gap-3 pb-32">
			{#each $categories as cat (cat.id)}
				<div
					class="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-4 transition-opacity active:opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
				>
					<div
						class="absolute top-0 bottom-0 left-0 w-1"
						style="background-color: {cat.color}"
					></div>

					<div class="flex h-full min-h-[80px] flex-col justify-between pl-2">
						<div
							class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-zinc-800"
						>
							{getCategoryIcon(cat.icon)}
						</div>

						<div>
							<h3 class="text-sm leading-tight font-medium text-zinc-900 dark:text-white">
								{cat.name}
							</h3>
							<p class="mt-0.5 text-[11px] text-zinc-500">
								{cat.isSavings ? 'Ahorro' : 'Gasto Mensual'}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="p-8 text-center text-sm text-zinc-500">Cargando sobres...</div>
	{/if}
</Page>
