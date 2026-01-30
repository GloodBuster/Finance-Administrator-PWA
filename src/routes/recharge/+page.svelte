<script lang="ts">
	import { goto } from '$app/navigation';
	import { v4 as uuidv4 } from 'uuid';
	import { untrack } from 'svelte';
	import { Page, Block, List, ListItem } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast'; // 👇 1. Importamos el store
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';

	let { data } = $props();

	// Estado
	let mode = $state('ves');
	let loading = $state(false);
	let amount = $state('');
	let description = $state('');
	let exchangeRate = $state(untrack(() => data.tasa?.toString() || ''));

	let calculatedUsdCost = $derived.by(() => {
		const m = parseFloat(amount);
		const r = parseFloat(exchangeRate);
		if (!m || !r) return '0.00';
		return (m / r).toFixed(2);
	});

	async function handleSave() {
		// 👇 2. VALIDACIÓN VISUAL
		if (!amount || parseFloat(amount) <= 0) {
			toast.show('Por favor ingresa un monto válido', 'error');
			return;
		}

		if (mode === 'ves' && (!exchangeRate || parseFloat(exchangeRate) <= 0)) {
			toast.show('La tasa de cambio es obligatoria', 'error');
			return;
		}

		loading = true;

		try {
			const valAmount = parseFloat(amount);

			if (mode === 'ves') {
				const valRate = parseFloat(exchangeRate);
				await db.batches.add({
					id: uuidv4(),
					createdAt: new Date(),
					exchangeRate: valRate,
					initialVes: valAmount,
					currentVes: valAmount,
					initialUsd: parseFloat(calculatedUsdCost),
					isGift: false
				});
			} else {
				await db.incomes.add({
					id: uuidv4(),
					date: new Date(),
					amountUsd: valAmount,
					description: description || 'Ingreso Extra'
				});
			}

			// 👇 3. FEEDBACK DE ÉXITO Y DELAY
			toast.show('¡Dinero registrado correctamente!', 'success');

			// Esperamos un poquito (700ms) para que el usuario lea el mensaje
			// antes de cambiar de página bruscamente.
			setTimeout(async () => {
				await goto('/');
			}, 700);
		} catch (error) {
			console.error('Error guardando:', error);
			toast.show('Ocurrió un error al guardar los datos', 'error');
		} finally {
			loading = false;
		}
	}
</script>

<Page class="h-full w-full px-4 py-1">
	<div
		class="bg-opacity-90 dark:bg-opacity-90 fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black"
	>
		<button
			class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-900 active:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:active:bg-zinc-800"
			onclick={() => goto('/')}
			aria-label="Cancelar y volver"
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

		<h1
			class="absolute left-1/2 -translate-x-1/2 transform text-base font-bold text-zinc-900 dark:text-white"
		>
			Recargar Saldo
		</h1>

		<div class="w-8"></div>
	</div>

	<div class="pt-16 pb-10">
		<Block class="space-y-6">
			<SegmentedControl
				bind:selected={mode}
				options={[
					{ value: 'ves', label: 'Bolívares' },
					{ value: 'usd', label: 'Dólares' }
				]}
			/>

			<div
				class="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
			>
				{#if mode === 'ves'}
					<div class="flex flex-col">
						<div class="border-b border-zinc-100 py-6 text-center dark:border-zinc-800">
							<span class="text-4xl">🇻🇪</span>
							<p class="mt-2 text-xs text-zinc-400">Crear nuevo lote de inventario</p>
						</div>

						<List inset class="m-0 p-4">
							<ListItem title="Cantidad (Bs)">
								{#snippet after()}
									<input
										type="number"
										placeholder="0.00"
										bind:value={amount}
										class="w-full bg-transparent text-right text-3xl font-bold text-blue-600 outline-none placeholder:text-zinc-200 dark:text-blue-400 dark:placeholder:text-zinc-700"
									/>
								{/snippet}
							</ListItem>

							<ListItem title="Tasa de Cambio">
								{#snippet after()}
									<input
										type="number"
										placeholder="0.00"
										bind:value={exchangeRate}
										class="w-32 bg-transparent text-right text-lg font-medium text-zinc-800 outline-none dark:text-white"
									/>
								{/snippet}
							</ListItem>
						</List>

						<div
							class="flex items-center justify-between bg-zinc-50 p-4 text-sm dark:bg-zinc-800/50"
						>
							<span class="text-zinc-500">Costo real estimado:</span>
							<span class="font-bold text-zinc-800 dark:text-white">$ {calculatedUsdCost}</span>
						</div>
					</div>
				{:else}
					<div class="flex flex-col">
						<div class="border-b border-zinc-100 py-6 text-center dark:border-zinc-800">
							<span class="text-4xl">💵</span>
							<p class="mt-2 text-xs text-zinc-400">Registrar ingreso en divisa</p>
						</div>

						<List inset class="m-0 p-4">
							<ListItem title="Monto ($)">
								{#snippet after()}
									<input
										type="number"
										placeholder="0.00"
										bind:value={amount}
										class="w-full bg-transparent text-right text-3xl font-bold text-emerald-600 outline-none placeholder:text-zinc-200 dark:text-emerald-400 dark:placeholder:text-zinc-700"
									/>
								{/snippet}
							</ListItem>

							<ListItem title="Descripción">
								{#snippet after()}
									<input
										type="text"
										placeholder="Ej. Nómina"
										bind:value={description}
										class="w-full bg-transparent text-right text-base text-zinc-600 outline-none dark:text-zinc-300"
									/>
								{/snippet}
							</ListItem>
						</List>
					</div>
				{/if}
			</div>

			<button
				class="w-full transform rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
            {mode === 'ves'
					? 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'
					: 'bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-700'}"
				onclick={handleSave}
				disabled={loading}
			>
				{#if loading}
					<span class="flex items-center justify-center gap-2">Guardando...</span>
				{:else}
					{mode === 'ves' ? 'Crear Lote de Bs' : 'Registrar Ingreso ($)'}
				{/if}
			</button>
		</Block>
	</div>
</Page>
