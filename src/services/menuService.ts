import { api, getData } from '../lib/api';
import { isStaticPreview, isOfflineError, getPublicMenuForCafe } from './mockStorage';
import type { Cafe, MenuCategory, MenuItem } from '../types';

export interface PublicMenu {
  cafe: Pick<Cafe, 'id' | 'name' | 'slug' | 'isOpen' | 'taxRate' | 'currency' | 'logoUrl' | 'bannerUrl' | 'description'> & {
    welcomeMessage?: string | null;
    announcement?: string | null;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
}

export const menuService = {
  getPublicMenu: async (cafeId: string) => {
    if (isStaticPreview()) {
      return getPublicMenuForCafe(cafeId);
    }
    try {
      const data = await getData<PublicMenu>(`/menu/${cafeId}`);
      if (data && data.categories && data.categories.length > 0) return data;
      return getPublicMenuForCafe(cafeId);
    } catch {
      return getPublicMenuForCafe(cafeId);
    }
  },

  getManageMenu: async (cafeId: string) => {
    if (isStaticPreview()) {
      const pub = getPublicMenuForCafe(cafeId);
      const items = pub.categories.flatMap((c) => c.items);
      return { categories: pub.categories, items };
    }
    try {
      return await getData<{ categories: MenuCategory[]; items: MenuItem[] }>(`/menu/${cafeId}/manage`);
    } catch (error) {
      if (isOfflineError(error)) {
        const pub = getPublicMenuForCafe(cafeId);
        const items = pub.categories.flatMap((c) => c.items);
        return { categories: pub.categories, items };
      }
      throw error;
    }
  },

  createCategory: (cafeId: string, body: { name: string; sortOrder?: number }) =>
    api.post(`/menu/${cafeId}/manage/categories`, body) as unknown as Promise<{ data: MenuCategory }>,
  updateCategory: (cafeId: string, id: string, body: Partial<MenuCategory>) =>
    api.patch(`/menu/${cafeId}/manage/categories/${id}`, body),
  deleteCategory: (cafeId: string, id: string) => api.delete(`/menu/${cafeId}/manage/categories/${id}`),

  createItem: (cafeId: string, body: Partial<MenuItem>) =>
    api.post(`/menu/${cafeId}/manage/items`, body) as unknown as Promise<{ data: MenuItem }>,
  updateItem: (cafeId: string, id: string, body: Partial<MenuItem>) =>
    api.patch(`/menu/${cafeId}/manage/items/${id}`, body) as unknown as Promise<{ data: MenuItem }>,
  deleteItem: (cafeId: string, id: string) => api.delete(`/menu/${cafeId}/manage/items/${id}`),
};
