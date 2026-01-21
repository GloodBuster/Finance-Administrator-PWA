<script lang="ts">
    import type { PageData } from './$types';
    let { data } = $props<{ data: PageData }>(); 
</script>

<div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        <div class="bg-blue-600 p-6 text-center">
            <h1 class="text-white text-xl font-bold tracking-tight">Mi Gestor Vzla</h1>
            <p class="text-blue-100 text-xs mt-1">Control de Gastos PWA</p>
        </div>

        <div class="p-8">
            <div class="text-center mb-6">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tasa Oficial BCV</p>
                
                {#if data.error}
                    <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
                        ⚠️ {data.error}
                    </div>
                {:else}
                    <div class="flex items-baseline justify-center gap-1">
                        <span class="text-5xl font-black text-slate-800 tracking-tighter">
                            {data.tasa}
                        </span>
                        <span class="text-xl font-bold text-slate-400">Bs</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-3 bg-slate-100 inline-block px-3 py-1 rounded-full">
                        Actualizado: {data.fecha}
                    </p>
                {/if}
            </div>
            
            <button class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-200">
                + Nuevo Gasto
            </button>
        </div>
    </div>
</div>