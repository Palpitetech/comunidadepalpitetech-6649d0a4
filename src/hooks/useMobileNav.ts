import { create } from 'zustand';

export type DrawerView =
  | 'root'
  | 'comunicacao'
  | 'financeiro'
  | 'boloes'
  | 'gravacao-resultado'
  | 'gravacao-estudos'
  | 'gravacao-mega-especial'
  | 'sistema';

interface MobileNavState {
  isDrawerOpen: boolean;
  drawerView: DrawerView;
  openDrawer: (view?: DrawerView) => void;
  closeDrawer: () => void;
  goBack: () => void;
  setDrawerView: (view: DrawerView) => void;
}

export const useMobileNav = create<MobileNavState>((set) => ({
  isDrawerOpen: false,
  drawerView: 'root',
  openDrawer: (view = 'root') => set({ isDrawerOpen: true, drawerView: view }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerView: 'root' }),
  goBack: () => set({ drawerView: 'root' }),
  setDrawerView: (view) => set({ drawerView: view }),
}));

