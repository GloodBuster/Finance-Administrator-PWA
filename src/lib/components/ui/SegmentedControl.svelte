<script lang="ts">
	// Recibimos la opción seleccionada (bindable) y las opciones disponibles
	let { selected = $bindable(), options = [] } = $props<{
		selected: string;
		options: { value: string; label: string }[];
	}>();
</script>

<div class="relative flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
	{#each options as option}
		<button
			class="z-10 flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200
            {selected === option.value
				? 'bg-white text-black shadow-sm dark:bg-zinc-600 dark:text-white'
				: 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}"
			onclick={() => (selected = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
