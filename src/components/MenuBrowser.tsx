import { useMemo, useState } from 'react';
import MenuItemCard from './MenuItemCard';
import type { PublicMenu } from '../services/menuService';

const MenuBrowser = ({ menu, disabled }: { menu: PublicMenu; disabled?: boolean }) => {
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.name ?? '');
  const [search, setSearch] = useState('');

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) {
      return menu.categories
        .flatMap((c) => c.items)
        .filter(
          (i) => i.name.toLowerCase().includes(term) || (i.description ?? '').toLowerCase().includes(term),
        );
    }
    return menu.categories.find((c) => c.name === activeCat)?.items ?? [];
  }, [menu, activeCat, search]);

  return (
    <div className="row">
      <div className="col-lg-3 mb-3">
        <input
          className="form-control mb-3"
          placeholder="Search the menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!search && (
          <>
            {/* Mobile Category Horizontal Scroll Bar */}
            <div className="d-lg-none horizontal-scroll-touch d-flex gap-2 pb-2 mb-3">
              {menu.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-2 text-nowrap fw-semibold ${
                    c.name === activeCat ? 'btn-primary text-white shadow-xs' : 'btn-outline-secondary bg-white'
                  }`}
                  onClick={() => setActiveCat(c.name)}
                >
                  {c.name} <span className="opacity-75">({c.items.length})</span>
                </button>
              ))}
            </div>

            {/* Desktop Category Vertical Sidebar */}
            <div className="d-none d-lg-block list-group shadow-sm">
              {menu.categories.map((c) => (
                <button
                  key={c.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    c.name === activeCat ? 'active' : ''
                  }`}
                  onClick={() => setActiveCat(c.name)}
                >
                  {c.name}
                  <span className="badge bg-light text-dark">{c.items.length}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="col-lg-9">
        {!search && <h4 className="fw-bold mb-3">{activeCat}</h4>}
        {items.length === 0 ? (
          <p className="text-muted py-4">No items found.</p>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
            {items.map((item) => (
              <div className="col" key={item.id}>
                <MenuItemCard item={item} cafeName={menu.cafe.name} disabled={disabled} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBrowser;
