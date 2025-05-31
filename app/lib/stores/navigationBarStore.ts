// app/lib/stores/navigationBarStore.ts
import { atom } from 'nanostores';

export const isBottomNavBarVisible = atom<boolean>(true);

export const showBottomNavBar = () => {
  if (!isBottomNavBarVisible.get()) {
    isBottomNavBarVisible.set(true);
  }
};

export const hideBottomNavBar = () => {
  if (isBottomNavBarVisible.get()) {
    isBottomNavBarVisible.set(false);
  }
};
