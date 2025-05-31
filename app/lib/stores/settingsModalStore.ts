// app/lib/stores/settingsModalStore.ts
import { atom } from 'nanostores';

export const isSettingsModalOpen = atom<boolean>(false);

export const openSettingsModal = () => isSettingsModalOpen.set(true);
export const closeSettingsModal = () => isSettingsModalOpen.set(false);
export const toggleSettingsModal = () => isSettingsModalOpen.set(!isSettingsModalOpen.get());
