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
	let mode = $state('ves'); // 'ves' | 'usd'
	let loading = $state(false);
	let amount = $state('');
	let description = $state('');
	let exchangeRate = $state(untrack(() => data.tasa?.toString() || ''));

	// Estado del Saldo Real
	let availableUsd = $state(0);
	let checkingBalance = $state(true);

	// Al montar el componente, calculamos cuánto dinero real tienes
	$effect(() => {
		calculateAvailableUsd();
	});

	async function calculateAvailableUsd() {
		checkingBalance = true;
		try {
			// 1. Sumar todos los ingresos en USD
			const incomes = await db.incomes.toArray();
			const totalIncome = incomes.reduce((sum, inc) => sum + inc.amountUsd, 0);

			// 2. Restar los gastos hechos DIRECTAMENTE en USD
			const expenses = await db.expenses.where('originalCurrency').equals('USD').toArray();
			const totalSpentDirectly = expenses.reduce((sum, exp) => sum + exp.amountVes, 0); // Ojo: en gastos USD amountVes guarda el valor si no hay conversión, pero mejor usar realUsdCost para asegurar
			// CORRECCIÓN PEQUEÑA: En el paso anterior definimos que si es USD, realUsdCost tiene el valor.
			const totalSpentDirectlyCorrected = expenses.reduce((sum, exp) => sum + exp.realUsdCost, 0);

			// 3. Restar los dólares que ya "vendiste" para comprar Lotes de Bolívares
			const batches = await db.batches.toArray();
			const totalSpentOnBatches = batches.reduce((sum, batch) => sum + batch.initialUsd, 0);

			availableUsd = totalIncome - totalSpentDirectlyCorrected - totalSpentOnBatches;
		} catch (e) {
			console.error('Error calculando saldo:', e);
		} finally {
			checkingBalance = false;
		}
	}

	// Cálculo reactivo
	let calculatedUsdCost = $derived.by(() => {
		const m = parseFloat(amount);
		const r = parseFloat(exchangeRate);
		if (!m || !r) return '0.00';
		return (m / r).toFixed(2);
	});

	async function handleSave() {
		if (!amount || parseFloat(amount) <= 0) {
			toast.show('Por favor ingresa un monto válido', 'error');
			return;
		}

		loading = true;

		try {
			const valAmount = parseFloat(amount);

			if (mode === 'ves') {
				const valRate = parseFloat(exchangeRate);
				if (!valRate || valRate <= 0) {
					toast.show('La tasa de cambio es obligatoria', 'error');
					loading = false;
					return;
				}

				// --- 🛡️ VALIDACIÓN DE FONDOS (NUEVO) ---
				const costInUsd = parseFloat(calculatedUsdCost);

				// Refrescamos el saldo al momento de guardar por seguridad
				await calculateAvailableUsd();

				// Margen de error pequeño por redondeo (0.01)
				if (costInUsd > availableUsd + 0.01) {
					toast.show(
						`Fondos insuficientes. Tienes $${availableUsd.toFixed(2)} y necesitas $${costInUsd}`,
						'error'
					);
					loading = false;
					return;
				}
				// ----------------------------------------

				await db.batches.add({
					id: uuidv4(),
					createdAt: new Date(),
					exchangeRate: valRate,
					initialVes: valAmount,
					currentVes: valAmount,
					initialUsd: costInUsd,
					isGift: false
				});
			} else {
				// Si es ingreso, no validamos fondos, ¡estamos metiendo dinero!
				await db.incomes.add({
					id: uuidv4(),
					date: new Date(),
					amountUsd: valAmount,
					description: description || 'Ingreso Extra'
				});
			}

			toast.show('¡Dinero registrado correctamente!', 'success');
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
						<div class="mt-2 flex items-center justify-center gap-2">
							<span
								class="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500 dark:bg-zinc-800"
							>
								Disponible para cambiar:
								<strong class={availableUsd < 0 ? 'text-red-500' : 'text-emerald-600'}>
									${availableUsd.toFixed(2)}
								</strong>
							</span>
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
