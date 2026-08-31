import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../types';

export interface CartLine {
  menuItemId: string;
  cafeId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  isVeg: boolean;
  quantity: number;
}

interface CartState {
  cafeId: string | null;
  cafeName: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  add: (item: MenuItem, cafeName: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
}

const recalc = (lines: CartLine[]) => ({
  itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  subtotal: Number(lines.reduce((s, l) => s + l.price * l.quantity, 0).toFixed(2)),
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cafeId: null,
      cafeName: null,
      lines: [],
      itemCount: 0,
      subtotal: 0,

      add: (item, cafeName) =>
        set((state) => {
          // one cafe per cart
          let lines = state.lines;
          let cafeId = state.cafeId;
          if (cafeId && cafeId !== item.cafeId) {
            lines = [];
          }
          cafeId = item.cafeId;
          const existing = lines.find((l) => l.menuItemId === item.id);
          const next = existing
            ? lines.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l))
            : [
                ...lines,
                {
                  menuItemId: item.id,
                  cafeId: item.cafeId,
                  name: item.name,
                  price: item.price,
                  imageUrl: item.imageUrl,
                  isVeg: item.isVeg,
                  quantity: 1,
                },
              ];
          return { lines: next, cafeId, cafeName, ...recalc(next) };
        }),

      setQuantity: (menuItemId, quantity) =>
        set((state) => {
          const next =
            quantity <= 0
              ? state.lines.filter((l) => l.menuItemId !== menuItemId)
              : state.lines.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity } : l));
          return {
            lines: next,
            cafeId: next.length ? state.cafeId : null,
            cafeName: next.length ? state.cafeName : null,
            ...recalc(next),
          };
        }),

      remove: (menuItemId) =>
        set((state) => {
          const next = state.lines.filter((l) => l.menuItemId !== menuItemId);
          return {
            lines: next,
            cafeId: next.length ? state.cafeId : null,
            cafeName: next.length ? state.cafeName : null,
            ...recalc(next),
          };
        }),

      clear: () => set({ lines: [], cafeId: null, cafeName: null, itemCount: 0, subtotal: 0 }),
    }),
    { name: 'fpc.cart' },
  ),
);
