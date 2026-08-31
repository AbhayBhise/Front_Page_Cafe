import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequest, Conflict, NotFound } from '../../lib/errors';
import { recordActivity } from '../../lib/activity';

export async function getPublicMenu(idOrSlug: string) {
  const cafe = await prisma.cafe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], status: 'approved' },
    select: { id: true, name: true, slug: true, isOpen: true, taxRate: true, currency: true, logoUrl: true, bannerUrl: true, description: true, welcomeMessage: true, announcement: true },
  });
  if (!cafe) throw NotFound('Cafe not found or not approved');
  const cafeId = cafe.id;

  const categories = await prisma.menuCategory.findMany({
    where: { cafeId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      },
    },
  });

  return { cafe, categories: categories.filter((c) => c.items.length > 0) };
}

export async function getManageMenu(cafeId: string) {
  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ where: { cafeId }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.menuItem.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } } } }),
  ]);
  return { categories, items };
}

export async function createCategory(cafeId: string, input: { name: string; sortOrder?: number }, req: Request) {
  const exists = await prisma.menuCategory.findUnique({ where: { cafeId_name: { cafeId, name: input.name } } });
  if (exists) throw Conflict('That category already exists');
  const category = await prisma.menuCategory.create({ data: { cafeId, name: input.name, sortOrder: input.sortOrder ?? 0 } });
  await recordActivity({ action: 'menu.category_created', cafeId, entityType: 'category', entityId: category.id, req });
  return category;
}

export async function updateCategory(cafeId: string, id: string, data: Record<string, unknown>, req: Request) {
  const cat = await prisma.menuCategory.findFirst({ where: { id, cafeId } });
  if (!cat) throw NotFound('Category not found');
  const updated = await prisma.menuCategory.update({ where: { id }, data });
  await recordActivity({ action: 'menu.category_updated', cafeId, entityType: 'category', entityId: id, req });
  return updated;
}

export async function deleteCategory(cafeId: string, id: string, req: Request) {
  const cat = await prisma.menuCategory.findFirst({ where: { id, cafeId }, include: { _count: { select: { items: true } } } });
  if (!cat) throw NotFound('Category not found');
  if (cat._count.items > 0) throw BadRequest('Move or delete items in this category first');
  await prisma.menuCategory.delete({ where: { id } });
  await recordActivity({ action: 'menu.category_deleted', cafeId, entityType: 'category', entityId: id, req });
}

async function assertCategoryInCafe(cafeId: string, categoryId: string) {
  const cat = await prisma.menuCategory.findFirst({ where: { id: categoryId, cafeId } });
  if (!cat) throw BadRequest('Category does not belong to this cafe');
}

export async function createItem(cafeId: string, input: Record<string, unknown>, req: Request) {
  await assertCategoryInCafe(cafeId, input.categoryId as string);
  const item = await prisma.menuItem.create({ data: { ...(input as object), cafeId } as never });
  await recordActivity({ action: 'menu.item_created', cafeId, entityType: 'item', entityId: item.id, req });
  return item;
}

export async function updateItem(cafeId: string, id: string, data: Record<string, unknown>, req: Request) {
  const item = await prisma.menuItem.findFirst({ where: { id, cafeId } });
  if (!item) throw NotFound('Menu item not found');
  if (data.categoryId) await assertCategoryInCafe(cafeId, data.categoryId as string);
  const updated = await prisma.menuItem.update({ where: { id }, data });
  await recordActivity({ action: 'menu.item_updated', cafeId, entityType: 'item', entityId: id, req });
  return updated;
}

export async function deleteItem(cafeId: string, id: string, req: Request) {
  const item = await prisma.menuItem.findFirst({ where: { id, cafeId }, include: { _count: { select: { orderItems: true } } } });
  if (!item) throw NotFound('Menu item not found');
  if (item._count.orderItems > 0) {
    await prisma.menuItem.update({ where: { id }, data: { isAvailable: false } });
  } else {
    await prisma.menuItem.delete({ where: { id } });
  }
  await recordActivity({ action: 'menu.item_deleted', cafeId, entityType: 'item', entityId: id, req });
}
