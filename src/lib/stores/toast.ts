import { writable } from 'svelte/store';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

function createToastStore() {
    const { subscribe, set, update } = writable<ToastState>({
        message: '',
        type: 'info',
        visible: false
    });

    return {
        subscribe,
        show: (message: string, type: ToastType = 'success', duration = 3000) => {
            set({ message, type, visible: true });

            setTimeout(() => {
                update(state => ({ ...state, visible: false }));
            }, duration);
        },
        hide: () => update(state => ({ ...state, visible: false }))
    };
}

export const toast = createToastStore();