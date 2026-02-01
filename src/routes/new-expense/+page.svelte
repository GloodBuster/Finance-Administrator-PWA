<script lang="ts">
	import { goto } from '$app/navigation';
	import { v4 as uuidv4 } from 'uuid';
	import { liveQuery } from 'dexie';
	import { Page, Block } from 'konsta/svelte';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
	import { getCategoryIcon } from '$lib/utils';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import CategoryCreator from '$lib/components/categories/CategoryCreator.svelte'; // 👈 Importamos

	// Estado Formulario
	let amount = $state('');
	let currency = $state('VES');
	let selectedCategoryId = $state<string | null>(null);
	let date = $state(new Date().toISOString().split('T')[0]);
	let note = $state('');
	let loading = $state(false);

	// Estado Categorías (Solo lo necesario para la UI principal)
	let isEditingCategories = $state(false);
	let isCreatingCategory = $state(false); // 👈 Controlamos el modal aquí

	// Consultas
	let categories = liveQuery(() => db.categories.filter((cat) => !cat.isArchived).toArray());

	async function handleSave() {
		// ... (Tu lógica de guardar Gasto se mantiene IGUAL) ...
		if (!amount || parseFloat(amount) <= 0) {
			toast.show('Ingresa un monto válido', 'error');
			return;
		}
		if (!selectedCategoryId) {
			toast.show('Selecciona una categoría', 'error');
			return;
		}
		loading = true;
		try {
			const valAmount = parseFloat(amount);
			const expenseDate = new Date(date);
			let calculatedUsdCost = 0;

			if (currency === 'USD') {
				calculatedUsdCost = valAmount;
			} else {
				let remainingAmountToCover = valAmount;
				calculatedUsdCost = 0;
				const batches = await db.batches.where('currentVes').above(0).sortBy('createdAt');
				for (const batch of batches) {
					if (remainingAmountToCover <= 0) break;
					const takeFromBatch = Math.min(batch.currentVes, remainingAmountToCover);
					const costOfPortion = takeFromBatch / batch.exchangeRate;
					calculatedUsdCost += costOfPortion;
					batch.currentVes -= takeFromBatch;
					remainingAmountToCover -= takeFromBatch;
					await db.batches.update(batch.id, { currentVes: batch.currentVes });
				}
				if (remainingAmountToCover > 0) {
					const fallbackRate = batches.length > 0 ? batches[batches.length - 1].exchangeRate : 60;
					calculatedUsdCost += remainingAmountToCover / fallbackRate;
				}
			}

			await db.expenses.add({
				id: uuidv4(),
				date: expenseDate,
				description: note || '',
				categoryId: selectedCategoryId,
				amountVes: currency === 'VES' ? valAmount : 0,
				realUsdCost: calculatedUsdCost,
				originalCurrency: currency as 'VES' | 'USD'
			});

			toast.show('Gasto registrado', 'success');
			setTimeout(() => goto('/'), 700);
		} catch (error) {
			console.error('Error al guardar:', error);
			toast.show('Error al procesar el gasto', 'error');
		} finally {
			loading = false;
		}
	}

	async function handleArchive(id: string) {
		if (!confirm('¿Ocultar este sobre?')) return;
		try {
			await db.categories.update(id, { isArchived: true });
			if (selectedCategoryId === id) selectedCategoryId = null;
		} catch (e) {
			toast.show('Error al archivar', 'error');
		}
	}
</script>

<Page class="h-full w-full overflow-y-auto px-4 py-1 pb-20">
	<header
		class="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-4 dark:border-zinc-800 dark:bg-black"
	>
		<button
			class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800"
			onclick={() => goto('/')}
			aria-label="Volver a la página principal"
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
		<h1 class="text-base font-semibold text-zinc-900 dark:text-white">Nuevo Gasto</h1>
		<div class="w-8"></div>
	</header>

	<div class="pb-safe pt-16">
		<Block class="space-y-4">
			<div
				class="rounded-3xl border border-zinc-100 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
			>
				<span class="text-xs font-bold tracking-widest text-zinc-400 uppercase">Monto</span>
				<div class="mt-3 mb-5">
					<input
						type="number"
						inputmode="decimal"
						placeholder="0.00"
						bind:value={amount}
						class="w-full rounded-2xl bg-zinc-100 py-6 text-center text-5xl font-bold text-zinc-900 placeholder-zinc-300 transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-600"
					/>
				</div>
				<SegmentedControl
					bind:selected={currency}
					options={[
						{ value: 'VES', label: 'Bolívares (Bs)' },
						{ value: 'USD', label: 'Dólares ($)' }
					]}
				/>
			</div>

			<div>
				<div class="mb-4 flex items-center justify-between px-1">
					<h3 class="text-xs font-bold tracking-widest text-zinc-400 uppercase">Categoría</h3>
					{#if $categories && $categories.length > 0}
						<button
							class="text-xs font-medium text-blue-600 transition-colors active:opacity-50 dark:text-blue-400"
							onclick={() => (isEditingCategories = !isEditingCategories)}
						>
							{isEditingCategories ? 'Listo' : 'Editar'}
						</button>
					{/if}
				</div>

				<div class="grid grid-cols-3 gap-3">
					{#if $categories}
						{#each $categories as cat (cat.id)}
							<div class="group relative">
								{#if isEditingCategories}
									<button
										class="animate-bounce-in absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
										onclick={(e) => {
											e.stopPropagation();
											handleArchive(cat.id);
										}}
										aria-label="Ocultar categoría"
									>
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M20 12H4"
											></path></svg
										>
									</button>
								{/if}
								<button
									class="flex w-full flex-col items-center justify-center rounded-2xl border p-3 transition-all duration-200 {selectedCategoryId ===
									cat.id
										? 'scale-[1.02] border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/20'
										: 'border-zinc-100 bg-white shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'} {isEditingCategories
										? 'animate-pulse'
										: ''}"
									onclick={() => {
										if (!isEditingCategories) selectedCategoryId = cat.id;
									}}
								>
									<div
										class="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-transform"
										style="background-color: {cat.color}20; color: {cat.color}"
									>
										{getCategoryIcon(cat.icon)}
									</div>
									<span
										class="line-clamp-2 text-center text-xs leading-tight font-medium text-zinc-700 dark:text-zinc-300"
										>{cat.name}</span
									>
								</button>
							</div>
						{/each}
					{/if}

					<button
						class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-transparent p-3 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
						onclick={() => (isCreatingCategory = true)}
					>
						<div
							class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400 dark:bg-zinc-800"
						>
							+
						</div>
						<span class="text-xs font-medium text-zinc-400">Crear</span>
					</button>
				</div>
			</div>

			<div class="grid gap-6">
				<div class="flex flex-col gap-2">
					<label
						for="date-input"
						class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase"
						>Fecha del Gasto</label
					>
					<input
						id="date-input"
						type="date"
						bind:value={date}
						class="w-full rounded-2xl border border-zinc-100 bg-white px-4 py-4 font-medium text-zinc-900 shadow-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:scheme-dark"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label
						for="note-input"
						class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase"
						>Nota o Descripción</label
					>
					<textarea
						id="note-input"
						rows="3"
						placeholder="Ej. Cena con amigos..."
						bind:value={note}
						class="w-full resize-none rounded-2xl border border-zinc-100 bg-white px-4 py-4 font-medium text-zinc-900 placeholder-zinc-300 shadow-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-600"
					></textarea>
				</div>
			</div>

			<button
				class="w-full transform rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				onclick={handleSave}
				disabled={loading}
			>
				{loading ? 'Guardando...' : 'Registrar Gasto'}
			</button>
		</Block>
	</div>

	<CategoryCreator bind:isOpen={isCreatingCategory} />
</Page>
