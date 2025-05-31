import { atom } from 'nanostores';

export const isSidebarOpen = atom(false);

export function toggleSidebar() {
  isSidebarOpen.set(!isSidebarOpen.get());
}

export function setSidebarOpen(isOpen: boolean) {
  isSidebarOpen.set(isOpen);
}
