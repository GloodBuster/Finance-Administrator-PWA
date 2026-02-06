<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { untrack } from 'svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';

	// Props
	let {
		isOpen = $bindable(false),
		currentRate = 0,
		balanceVes = 0 // 👈 NUEVO: Recibimos el saldo en Bolívares
	} = $props();

	// Estado de Pestañas
	let activeTab = $state('converter');

	// --- LÓGICA CONVERSOR (Bs -> USD) ---
	let convVes = $state(''); // Input en Bolívares
	let convRate = $state(untrack(() => currentRate.toString()));

	// Al abrir, sugerimos el saldo en Bs si está vacío
	$effect(() => {
		if (isOpen && !convVes && activeTab === 'converter') {
			convVes = balanceVes.toFixed(2);
			convRate = currentRate.toString();
		}
	});

	$effect(() => {
		if (isOpen) {
			// Bloquear scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Restaurar scroll
			document.body.style.overflow = '';
		}

		// Cleanup por si el componente se desmonta con el modal abierto
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Cálculo: Bolívares / Tasa = Dólares
	let convResult = $derived.by(() => {
		const ves = parseFloat(convVes) || 0;
		const rate = parseFloat(convRate) || 1; // Evitar división por cero
		if (rate === 0) return '0.00';
		return (ves / rate).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	});

	function setMaxBalance() {
		convVes = balanceVes.toFixed(2);
	}

	// --- LÓGICA SPLITTER (Igual que antes) ---
	let splitItems = $state<{ id: number; name: string; amount: number }[]>([]);
	let splitTotalBill = $state('');
	let splitRate = $state(untrack(() => currentRate.toString()));
	let newItemName = $state('');
	let newItemAmount = $state('');

	let totalAdded = $derived(splitItems.reduce((sum, item) => sum + item.amount, 0));
	let remaining = $derived((parseFloat(splitTotalBill) || 0) - totalAdded);

	let splitStatus = $derived.by(() => {
		const total = parseFloat(splitTotalBill) || 0;
		if (total === 0) return 'empty';
		if (Math.abs(remaining) < 0.01) return 'completed';
		if (remaining > 0) return 'missing';
		return 'exceeded';
	});

	function addItem() {
		const amount = parseFloat(newItemAmount);
		if (!amount || amount <= 0) return;
		splitItems.push({
			id: Date.now(),
			name: newItemName.trim() || `Persona ${splitItems.length + 1}`,
			amount
		});
		newItemName = '';
		newItemAmount = '';
	}

	function removeItem(index: number) {
		splitItems.splice(index, 1);
	}

	function fillRemaining() {
		if (remaining > 0) newItemAmount = remaining.toFixed(2);
	}
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
		class="fixed right-0 bottom-0 left-0 z-70 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-zinc-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-bold dark:text-white">Herramientas</h2>
			<button
				onclick={() => (isOpen = false)}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
				>✕</button
			>
		</div>

		<div class="mb-6">
			<SegmentedControl
				bind:selected={activeTab}
				options={[
					{ value: 'converter', label: 'Conversor a $' },
					{ value: 'splitter', label: 'Dividir Cuenta' }
				]}
			/>
		</div>

		{#if activeTab === 'converter'}
			<div in:fade={{ duration: 150 }}>
				<div class="space-y-4">
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<label
								for="conv-ves"
								class="text-xs font-bold tracking-widest text-zinc-400 uppercase"
								>Bolívares (Bs)</label
							>
							<button
								onclick={setMaxBalance}
								class="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
							>
								Usar Saldo (Bs. {balanceVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })})
							</button>
						</div>
						<input
							id="conv-ves"
							type="number"
							bind:value={convVes}
							class="w-full bg-transparent text-4xl font-bold text-zinc-900 outline-none placeholder:text-zinc-200 dark:text-white"
							placeholder="0.00"
						/>
					</div>

					<div class="space-y-1 border-t border-dashed border-zinc-200 pt-2 dark:border-zinc-700">
						<label for="conv-rate" class="text-xs font-bold tracking-widest text-zinc-400 uppercase"
							>Tasa (Bs/$)</label
						>
						<input
							id="conv-rate"
							type="number"
							bind:value={convRate}
							class="w-full bg-transparent text-2xl font-medium text-zinc-500 outline-none dark:text-zinc-400"
						/>
					</div>

					<div class="mt-6 rounded-2xl bg-zinc-100 p-6 text-center dark:bg-zinc-800">
						<span class="mb-1 block text-xs text-zinc-400">Equivale a</span>
						<span class="text-3xl font-black text-emerald-600 dark:text-emerald-400">
							$ {convResult}
						</span>
					</div>
				</div>
			</div>
		{:else}
			<div in:fade={{ duration: 150 }} class="space-y-6">
				<div class="grid grid-cols-2 gap-3">
					<div
						class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
					>
						<label
							for="split-total"
							class="mb-1 block text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
							>Total Factura</label
						>
						<div class="flex items-center gap-1">
							<span class="font-medium text-zinc-400">$</span>
							<input
								id="split-total"
								type="number"
								bind:value={splitTotalBill}
								placeholder="0"
								class="w-full bg-transparent text-xl font-bold text-zinc-900 outline-none placeholder:text-zinc-200 dark:text-white"
							/>
						</div>
					</div>
					<div
						class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
					>
						<label
							for="split-rate"
							class="mb-1 block text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
							>Tasa Pago</label
						>
						<div class="flex items-center gap-1">
							<span class="text-xs font-medium text-zinc-400">Bs</span>
							<input
								id="split-rate"
								type="number"
								bind:value={splitRate}
								class="w-full bg-transparent text-xl font-bold text-zinc-900 outline-none placeholder:text-zinc-200 dark:text-white"
							/>
						</div>
					</div>
				</div>

				{#if parseFloat(splitTotalBill) > 0}
					<div class="space-y-1">
						<div class="flex justify-between text-xs font-bold">
							<span class="text-zinc-500">Cubierto: ${totalAdded.toFixed(2)}</span>
							{#if splitStatus === 'missing'}
								<span class="text-red-500">Falta: ${remaining.toFixed(2)}</span>
							{:else if splitStatus === 'exceeded'}
								<span class="text-orange-500">Sobran: ${Math.abs(remaining).toFixed(2)}</span>
							{:else}
								<span class="text-emerald-500">¡Completo!</span>
							{/if}
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class="h-full transition-all duration-300 {splitStatus === 'exceeded'
									? 'bg-orange-500'
									: splitStatus === 'completed'
										? 'bg-emerald-500'
										: 'bg-blue-500'}"
								style="width: {Math.min(
									(totalAdded / (parseFloat(splitTotalBill) || 1)) * 100,
									100
								)}%"
							></div>
						</div>
					</div>
				{/if}

				<div class="max-h-[30vh] space-y-2 overflow-y-auto">
					{#each splitItems as item, i (item.id)}
						<div
							class="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
							transition:fly={{ y: 10 }}
						>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-bold text-zinc-900 dark:text-white">{item.name}</p>
								<p class="text-xs text-zinc-400">
									Bs. {(item.amount * (parseFloat(splitRate) || 0)).toLocaleString('es-VE', {
										maximumFractionDigits: 2
									})}
								</p>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-lg font-bold text-zinc-900 dark:text-white"
									>${item.amount.toFixed(2)}</span
								>
								<button
									onclick={() => removeItem(i)}
									class="p-1 text-zinc-300 transition-colors hover:text-red-500">✕</button
								>
							</div>
						</div>
					{/each}
					{#if splitItems.length === 0}
						<div
							class="dashed rounded-xl border border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800"
						>
							Agrega personas para dividir la cuenta
						</div>
					{/if}
				</div>

				<div class="border-t border-zinc-100 pt-2 dark:border-zinc-800">
					<div class="mb-2 flex gap-2">
						<input
							type="text"
							bind:value={newItemName}
							placeholder="Nombre (ej. Juan)"
							class="flex-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium outline-none dark:bg-zinc-800 dark:text-white"
						/>
						<div class="relative flex-1">
							<span class="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-zinc-400">$</span
							>
							<input
								type="number"
								bind:value={newItemAmount}
								placeholder="0"
								class="w-full rounded-xl bg-zinc-50 py-3 pr-3 pl-6 text-sm font-bold outline-none dark:bg-zinc-800 dark:text-white"
							/>
						</div>
					</div>
					<div class="flex gap-2">
						{#if remaining > 0 && parseFloat(splitTotalBill) > 0}
							<button
								onclick={fillRemaining}
								class="rounded-xl bg-blue-50 px-3 py-3 text-xs font-bold whitespace-nowrap text-blue-600 transition-transform active:scale-95 dark:bg-blue-900/20 dark:text-blue-400"
								>Poner Restante (${remaining.toFixed(2)})</button
							>
						{/if}
						<button
							onclick={addItem}
							disabled={!newItemAmount}
							class="flex-1 rounded-xl bg-black py-3 font-bold text-white transition-transform active:scale-95 disabled:opacity-50 dark:bg-white dark:text-black"
							>Agregar</button
						>
					</div>
				</div>
			</div>
		{/if}

		<div class="h-6"></div>
	</div>
{/if}
