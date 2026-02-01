<script lang="ts">
	import { goto } from '$app/navigation';
	import { v4 as uuidv4 } from 'uuid';
	import { untrack } from 'svelte';
	import { Page, Block } from 'konsta/svelte'; // Quitamos List y ListItem
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
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

	// Al montar, calculamos
	$effect(() => {
		calculateAvailableUsd();
	});

	async function calculateAvailableUsd() {
		checkingBalance = true;
		try {
			const incomes = await db.incomes.toArray();
			const totalIncome = incomes.reduce((sum, inc) => sum + inc.amountUsd, 0);

			const expenses = await db.expenses.where('originalCurrency').equals('USD').toArray();
			const totalSpentDirectlyCorrected = expenses.reduce((sum, exp) => sum + exp.realUsdCost, 0);

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

				// Validación de fondos
				const costInUsd = parseFloat(calculatedUsdCost);
				await calculateAvailableUsd();

				if (costInUsd > availableUsd + 0.01) {
					toast.show(
						`Fondos insuficientes. Tienes $${availableUsd.toFixed(2)} y necesitas $${costInUsd}`,
						'error'
					);
					loading = false;
					return;
				}

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

<Page class="h-full w-full overflow-y-auto bg-zinc-50 dark:bg-black">
	<header
		class="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-100 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/90"
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

		<h1 class="text-base font-bold text-zinc-900 dark:text-white">Recargar Saldo</h1>

		<div class="w-8"></div>
	</header>

	<div class="space-y-6 px-4 pt-20 pb-10">
		<SegmentedControl
			bind:selected={mode}
			options={[
				{ value: 'ves', label: 'Bolívares' },
				{ value: 'usd', label: 'Dólares' }
			]}
		/>

		{#if mode === 'ves'}
			<div class="space-y-4">
				<div class="pb-2 text-center">
					<span class="text-4xl">🇻🇪</span>
					<p class="mt-2 text-xs text-zinc-400">Crear lote con saldo USD existente</p>
					<div
						class="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800"
					>
						Disponible:
						<span class="ml-1 {availableUsd < 0 ? 'text-red-500' : 'text-emerald-600'}">
							${availableUsd.toFixed(2)}
						</span>
					</div>
				</div>

				<div
					class="rounded-3xl border border-zinc-100 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
				>
					<label
						for="ves-amount"
						class="mb-2 block text-xs font-bold tracking-widest text-zinc-400 uppercase"
						>Cantidad a Comprar</label
					>
					<div class="flex items-center justify-center gap-2">
						<span class="text-3xl font-medium text-blue-300">Bs</span>
						<input
							id="ves-amount"
							type="number"
							placeholder="0"
							bind:value={amount}
							class="w-40 bg-transparent text-center text-5xl font-bold text-blue-600 outline-none placeholder:text-zinc-200 dark:text-blue-400 dark:placeholder:text-zinc-700"
						/>
					</div>
				</div>

				<div
					class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
				>
					<label for="ves-rate" class="text-sm font-bold text-zinc-700 dark:text-zinc-300"
						>Tasa de Cambio</label
					>
					<div class="flex items-center gap-2">
						<span class="text-sm text-zinc-400">Bs/$</span>
						<input
							id="ves-rate"
							type="number"
							placeholder="0.00"
							bind:value={exchangeRate}
							class="w-24 bg-transparent text-right text-xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-white"
						/>
					</div>
				</div>

				<div class="flex justify-between px-4 text-xs font-medium text-zinc-400">
					<span>Costo real a descontar:</span>
					<span class="font-bold text-zinc-900 dark:text-white">$ {calculatedUsdCost}</span>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="pb-2 text-center">
					<span class="text-4xl">💵</span>
					<p class="mt-2 text-xs text-zinc-400">Ingresar dinero nuevo al sistema</p>
				</div>

				<div
					class="rounded-3xl border border-zinc-100 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
				>
					<label
						for="usd-amount"
						class="mb-2 block text-xs font-bold tracking-widest text-zinc-400 uppercase"
						>Monto a Ingresar</label
					>
					<div class="flex items-center justify-center gap-2">
						<span class="text-3xl font-medium text-emerald-300">$</span>
						<input
							id="usd-amount"
							type="number"
							placeholder="0"
							bind:value={amount}
							class="w-40 bg-transparent text-center text-5xl font-bold text-emerald-600 outline-none placeholder:text-zinc-200 dark:text-emerald-400 dark:placeholder:text-zinc-700"
						/>
					</div>
				</div>

				<div
					class="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
				>
					<label
						for="usd-desc"
						class="mb-1 block text-xs font-bold tracking-widest text-zinc-400 uppercase"
						>Descripción (Opcional)</label
					>
					<input
						id="usd-desc"
						type="text"
						placeholder="Ej. Nómina, Regalo, Ahorros..."
						bind:value={description}
						class="w-full bg-transparent text-lg font-medium text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-white"
					/>
				</div>
			</div>
		{/if}

		<div class="pt-4">
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
		</div>
	</div>
</Page>
