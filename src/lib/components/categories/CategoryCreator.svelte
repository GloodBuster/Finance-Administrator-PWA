<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { liveQuery } from 'dexie';
	import { fade, fly } from 'svelte/transition';
	import { db } from '$lib/database/index';
	import { toast } from '$lib/stores/toast';
	import { getCategoryIcon } from '$lib/utils';

	// Propiedad para abrir/cerrar (Two-way binding)
	let { isOpen = $bindable(false) } = $props();

	// Estado local
	let newCatName = $state('');
	let newCatIcon = $state('🍔');
	let newCatColor = $state('#3b82f6');
	let isSavings = $state(false); // 👈 NUEVO ESTADO
	let creatingLoading = $state(false);

	// Consultamos archivadas aquí mismo
	let archivedCategories = liveQuery(() => db.categories.filter((cat) => cat.isArchived).toArray());

	const presetColors = [
		'#3b82f6',
		'#ef4444',
		'#10b981',
		'#f59e0b',
		'#8b5cf6',
		'#ec4899',
		'#6366f1',
		'#14b8a6'
	];
	const presetIcons = [
		'🍔',
		'🛒',
		'💊',
		'🚌',
		'🎉',
		'🏠',
		'💡',
		'🎮',
		'📚',
		'✈️',
		'🐶',
		'🔧',
		'👕',
		'💇',
		'🎁',
		'💸'
	];

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

	async function handleCreateCategory() {
		if (!newCatName.trim()) {
			toast.show('Ponle nombre al sobre', 'error');
			return;
		}
		creatingLoading = true;
		try {
			await db.categories.add({
				id: uuidv4(),
				name: newCatName.trim(),
				icon: newCatIcon,
				color: newCatColor,
				isArchived: false,
				isSavings: isSavings // 👈 USAMOS EL VALOR SELECCIONADO
			});
			toast.show('Categoría creada', 'success');
			isOpen = false;

			// Reset del formulario
			newCatName = '';
			newCatIcon = '🍔';
			newCatColor = '#3b82f6';
			isSavings = false; // Reset a gasto
		} catch (e) {
			console.error(e);
			toast.show('Error creando categoría', 'error');
		} finally {
			creatingLoading = false;
		}
	}

	async function handleRestore(id: string) {
		try {
			await db.categories.update(id, { isArchived: false });
			toast.show('Categoría restaurada', 'success');
		} catch (e) {
			toast.show('Error al restaurar', 'error');
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		role="button"
		tabindex="0"
		onclick={() => (isOpen = false)}
		onkeydown={(e) => {
			if (e.key === 'Escape') isOpen = false;
		}}
	></div>

	<div
		class="fixed right-0 bottom-0 left-0 z-70 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-zinc-100 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-bold dark:text-white">Nuevo Sobre</h2>
			<button
				onclick={() => (isOpen = false)}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
				>✕</button
			>
		</div>

		<div class="space-y-6">
			<div class="mb-4 flex justify-center">
				<div class="flex flex-col items-center gap-2">
					<div
						class="relative flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-sm transition-colors"
						style="background-color: {newCatColor}20; color: {newCatColor}"
					>
						{newCatIcon}
						{#if isSavings}
							<div
								class="absolute -right-1 -bottom-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
							>
								Ahorro
							</div>
						{/if}
					</div>
					<span class="text-sm font-medium text-zinc-400">Así se verá</span>
				</div>
			</div>

			<div class="space-y-2">
				<label
					for="new-cat-name"
					class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Nombre</label
				>
				<input
					id="new-cat-name"
					type="text"
					placeholder="Ej. Comida..."
					bind:value={newCatName}
					class="w-full rounded-2xl bg-zinc-100 px-4 py-4 font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-800 dark:text-white"
				/>
			</div>

			<div class="space-y-2">
				<span class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase"
					>Tipo de Sobre</span
				>
				<div class="flex rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
					<button
						class="flex-1 rounded-xl py-3 text-sm font-bold transition-all {!isSavings
							? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
							: 'text-zinc-400 hover:text-zinc-600'}"
						onclick={() => (isSavings = false)}
					>
						Gasto Mensual
					</button>
					<button
						class="flex-1 rounded-xl py-3 text-sm font-bold transition-all {isSavings
							? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400'
							: 'text-zinc-400 hover:text-zinc-600'}"
						onclick={() => (isSavings = true)}
					>
						Fondo de Ahorro
					</button>
				</div>
				<p class="px-2 text-[10px] text-zinc-400">
					{#if isSavings}
						El dinero en este sobre se acumula mes a mes.
					{:else}
						El presupuesto se reinicia cada mes.
					{/if}
				</p>
			</div>

			<div class="space-y-2">
				<span class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Color</span>
				<div class="flex flex-wrap gap-3">
					{#each presetColors as color}
						<button
							class="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
							style="background-color: {color}; border-color: {newCatColor === color
								? 'white'
								: 'transparent'}; box-shadow: {newCatColor === color
								? `0 0 0 2px ${color}`
								: 'none'}"
							onclick={() => (newCatColor = color)}
							aria-label="Color"
						></button>
					{/each}
				</div>
			</div>

			<div class="space-y-2">
				<span class="px-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Icono</span>
				<div class="grid grid-cols-8 gap-2">
					{#each presetIcons as icon}
						<button
							class="flex aspect-square items-center justify-center rounded-xl text-xl transition-colors {newCatIcon ===
							icon
								? 'bg-zinc-200 dark:bg-zinc-700'
								: 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
							onclick={() => (newCatIcon = icon)}
						>
							{icon}
						</button>
					{/each}
				</div>
			</div>

			<button
				class="mt-4 w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
				onclick={handleCreateCategory}
				disabled={creatingLoading}
			>
				{creatingLoading ? 'Creando...' : 'Crear Sobre'}
			</button>

			{#if $archivedCategories && $archivedCategories.length > 0}
				<div class="mt-2 border-t border-zinc-100 pt-6 dark:border-zinc-800">
					<h4 class="mb-4 text-xs font-bold tracking-widest text-zinc-400 uppercase">
						Recuperar Ocultos
					</h4>
					<div class="space-y-2">
						{#each $archivedCategories as arch}
							<button
								class="flex w-full items-center justify-between rounded-xl bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
								onclick={() => handleRestore(arch.id)}
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
										style="background-color: {arch.color}20; color: {arch.color}"
									>
										{getCategoryIcon(arch.icon)}
									</div>
									<span class="font-medium text-zinc-700 dark:text-zinc-300">{arch.name}</span>
								</div>
								<span class="text-xs font-bold text-blue-600 dark:text-blue-400">Activar</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
