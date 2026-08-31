import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { menuService } from '../../services/menuService';
import { PageState, VegDot } from '../../components/ui';
import { money } from '../../lib/format';
import CafeStatusBanner from '../../components/CafeStatusBanner';
import type { MenuCategory, MenuItem } from '../../types';

const emptyItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  compareAtPrice: 0,
  imageUrl: '',
  categoryId: '',
  isVeg: true,
  isAvailable: true,
  isFeatured: false,
  prepMinutes: 15,
};

const MenuManagement = () => {
  const { cafe, cafeId } = useOwnerCafe();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCat, setNewCat] = useState('');
  const [editing, setEditing] = useState<typeof emptyItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    menuService
      .getManageMenu(cafeId)
      .then((d) => {
        setCategories(d.categories);
        setItems(d.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load menu'))
      .finally(() => setLoading(false));
  }, [cafeId]);

  useEffect(load, [load]);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !newCat.trim()) return;
    try {
      await menuService.createCategory(cafeId, { name: newCat.trim(), sortOrder: categories.length });
      setNewCat('');
      toast.success('Category added');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add category');
    }
  };

  const removeCategory = async (id: string) => {
    if (!cafeId || !window.confirm('Delete this category?')) return;
    try {
      await menuService.deleteCategory(cafeId, id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !editing) return;
    setSaving(true);
    const body = {
      name: editing.name.trim(),
      description: editing.description.trim() || null,
      price: Number(editing.price),
      compareAtPrice: Number(editing.compareAtPrice) > Number(editing.price) ? Number(editing.compareAtPrice) : null,
      imageUrl: editing.imageUrl.trim() || null,
      categoryId: editing.categoryId,
      isVeg: editing.isVeg,
      isAvailable: editing.isAvailable,
      isFeatured: editing.isFeatured,
      prepMinutes: Number(editing.prepMinutes),
    };
    try {
      if (editing.id) await menuService.updateItem(cafeId, editing.id, body);
      else await menuService.createItem(cafeId, body);
      toast.success('Menu saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    if (!cafeId) return;
    try {
      const res = await menuService.updateItem(cafeId, item.id, { isAvailable: !item.isAvailable });
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, isAvailable: res.data.isAvailable } : i)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  const removeItem = async (item: MenuItem) => {
    if (!cafeId || !window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuService.deleteItem(cafeId, item.id);
      toast.success('Item removed');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    }
  };

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold m-0">Menu management</h2>
        <button
          className="btn btn-primary"
          disabled={categories.length === 0}
          onClick={() => setEditing({ ...emptyItem, categoryId: categories[0]?.id ?? '' })}
        >
          <i className="bi bi-plus-lg me-1" /> Add item
        </button>
      </div>
      <CafeStatusBanner cafe={cafe} />

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Categories</h6>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <span key={c.id} className="badge bg-light text-dark border p-2">
                {c.name}
                <button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => removeCategory(c.id)}>
                  <i className="bi bi-x" />
                </button>
              </span>
            ))}
            {categories.length === 0 && <span className="text-muted small">Add a category to start building your menu.</span>}
          </div>
          <form className="d-flex gap-2" style={{ maxWidth: 360 }} onSubmit={addCategory}>
            <input className="form-control form-control-sm" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn btn-sm btn-outline-primary" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>

      {editing && (
        <div className="card border-primary shadow-sm rounded-4 mb-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">{editing.id ? 'Edit item' : 'New item'}</h6>
            <form className="row g-3" onSubmit={saveItem}>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Name</label>
                <input className="form-control" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Price (₹)</label>
                <input type="number" min={1} step="0.01" className="form-control" required value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Was (₹)</label>
                <input type="number" min={0} step="0.01" className="form-control" value={editing.compareAtPrice || ''} placeholder="offer" onChange={(e) => setEditing({ ...editing, compareAtPrice: Number(e.target.value) })} />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Prep (min)</label>
                <input type="number" min={1} max={180} className="form-control" value={editing.prepMinutes} onChange={(e) => setEditing({ ...editing, prepMinutes: Number(e.target.value) })} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Category</label>
                <select className="form-select" value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Image URL</label>
                <input className="form-control" value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} placeholder="https://…" />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Description</label>
                <textarea className="form-control" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="col-12 d-flex flex-wrap gap-4">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="veg" checked={editing.isVeg} onChange={(e) => setEditing({ ...editing, isVeg: e.target.checked })} />
                  <label className="form-check-label small" htmlFor="veg">Vegetarian</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="avail" checked={editing.isAvailable} onChange={(e) => setEditing({ ...editing, isAvailable: e.target.checked })} />
                  <label className="form-check-label small" htmlFor="avail">Available</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="feat" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} />
                  <label className="form-check-label small" htmlFor="feat">Featured</label>
                </div>
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save item'}
                </button>
                <button className="btn btn-light" type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PageState loading={loading} error={error} empty={items.length === 0} emptyIcon="card-list" emptyTitle="No menu items yet" onRetry={load}>
        <div className="table-responsive card border-0 shadow-sm rounded-4">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <VegDot isVeg={it.isVeg} />
                      <div>
                        <div className="fw-semibold">
                          {it.name} {it.isFeatured && <i className="bi bi-star-fill text-warning small" />}
                        </div>
                        <div className="text-muted small">{it.description?.slice(0, 50)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{it.category?.name ?? catName(it.categoryId)}</td>
                  <td>{money(it.price)}</td>
                  <td>
                    <div className="form-check form-switch m-0">
                      <input className="form-check-input" type="checkbox" checked={it.isAvailable} onChange={() => toggleAvailable(it)} />
                    </div>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() =>
                        setEditing({
                          id: it.id,
                          name: it.name,
                          description: it.description ?? '',
                          price: it.price,
                          compareAtPrice: it.compareAtPrice ?? 0,
                          imageUrl: it.imageUrl ?? '',
                          categoryId: it.categoryId,
                          isVeg: it.isVeg,
                          isAvailable: it.isAvailable,
                          isFeatured: it.isFeatured,
                          prepMinutes: it.prepMinutes,
                        })
                      }
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(it)}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>
    </div>
  );
};

export default MenuManagement;
