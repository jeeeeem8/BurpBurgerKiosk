import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api.js';
import { SkeletonBox, SkeletonTableRows } from '../components/Skeleton.jsx';

const InventoryManagement = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [summary, setSummary] = useState({
    totalStockUnits: 0,
    totalInventoryItems: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const loadInventory = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const { data } = await api.get('/inventory');
      setInventoryItems(data?.items || []);
      setSummary(
        data?.summary || {
          totalStockUnits: 0,
          totalInventoryItems: 0,
          lowStockCount: 0,
        },
      );
    } catch (error) {
      if (!silent) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to load inventory.',
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadInventory().catch(() => {});

    const intervalId = setInterval(() => {
      loadInventory({ silent: true }).catch(() => {});
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return inventoryItems;
    }

    return inventoryItems.filter((item) => {
      return (
        String(item.name || '').toLowerCase().includes(normalizedQuery) ||
        String(item.unit || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [inventoryItems, query]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (key === 'quantity' || key === 'lowStockThreshold') {
        return (Number(a[key] || 0) - Number(b[key] || 0)) * dir;
      }

      if (key === 'status') {
        const score = (item) => {
          if (Number(item.quantity || 0) <= 0 || item.available === false) return 0;
          if (Number(item.quantity || 0) <= Number(item.lowStockThreshold || 10)) return 1;
          return 2;
        };
        return (score(a) - score(b)) * dir;
      }

      return String(a[key] || '').localeCompare(String(b[key] || '')) * dir;
    });

    return list;
  }, [filteredItems, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortLabel = (key, label) => {
    if (sortConfig.key !== key) {
      return `${label} ↕`;
    }
    return `${label} ${sortConfig.direction === 'asc' ? '↑' : '↓'}`;
  };

  const openInventoryHistory = async () => {
    try {
      const { data } = await api.get('/inventory/history', {
        params: { sortBy: 'createdAt', sortOrder: 'desc', limit: 300 },
      });

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      const historyItems = data?.history || [];

      const mobileCards = historyItems
        .map((entry) => {
          const localDate = new Date(entry.createdAt).toLocaleString();
          const color = entry.changeType === 'added' ? '#065f46' : entry.changeType === 'deducted' ? '#9f1239' : '#1e3a8a';
          const bg = entry.changeType === 'added' ? '#d1fae5' : entry.changeType === 'deducted' ? '#ffe4e6' : '#dbeafe';

          return `<article style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#fff;display:grid;gap:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong style="font-size:13px;color:#0f172a;">${entry.itemName}</strong>
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;color:${color};background:${bg};text-transform:uppercase;">${entry.changeType}</span>
            </div>
            <p style="margin:0;font-size:11px;color:#64748b;">${localDate}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;">
              <div><span style="color:#64748b;">Before</span><br/><strong>${Number(entry.quantityBefore || 0)}</strong></div>
              <div><span style="color:#64748b;">After</span><br/><strong>${Number(entry.quantityAfter || 0)}</strong></div>
              <div><span style="color:#64748b;">Delta</span><br/><strong>${Number(entry.quantityChange || 0)}</strong></div>
            </div>
            <p style="margin:0;font-size:11px;color:#334155;"><span style="color:#64748b;">Reason:</span> ${entry.reason || '-'}</p>
          </article>`;
        })
        .join('');

      const rows = historyItems
        .map((entry) => {
          const localDate = new Date(entry.createdAt).toLocaleString();
          const color = entry.changeType === 'added' ? '#065f46' : entry.changeType === 'deducted' ? '#9f1239' : '#1e3a8a';
          const bg = entry.changeType === 'added' ? '#d1fae5' : entry.changeType === 'deducted' ? '#ffe4e6' : '#dbeafe';

          return `<tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">${localDate}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${entry.itemName}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:${color};background:${bg};text-transform:uppercase;">
                ${entry.changeType}
              </span>
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(entry.quantityBefore || 0)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(entry.quantityAfter || 0)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(entry.quantityChange || 0)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${entry.reason || '-'}</td>
          </tr>`;
        })
        .join('');

      await Swal.fire({
        title: 'Inventory History',
        width: isMobile ? '95%' : 1100,
        html: isMobile
          ? `
            <div style="text-align:left;max-height:65vh;overflow:auto;display:grid;gap:8px;">
              ${mobileCards || '<div style="padding:12px;text-align:center;color:#64748b;">No inventory history yet.</div>'}
            </div>
          `
          : `
            <div style="text-align:left;max-height:65vh;overflow:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                  <tr style="background:#f8fafc;position:sticky;top:0;z-index:1;">
                    <th style="text-align:left;padding:8px;">Date & Time</th>
                    <th style="text-align:left;padding:8px;">Item</th>
                    <th style="text-align:left;padding:8px;">Change</th>
                    <th style="text-align:right;padding:8px;">Before</th>
                    <th style="text-align:right;padding:8px;">After</th>
                    <th style="text-align:right;padding:8px;">Delta</th>
                    <th style="text-align:left;padding:8px;">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || '<tr><td colspan="7" style="padding:12px;text-align:center;color:#64748b;">No inventory history yet.</td></tr>'}
                </tbody>
              </table>
            </div>
          `,
        confirmButtonText: 'Close',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not load inventory history.',
      });
    }
  };

  const openInventoryPopup = async (initialValues) => {
    const result = await Swal.fire({
      title: `Edit ${initialValues.name}`,
      width: 520,
      html: `
        <div style="display:grid;gap:10px;text-align:left;">
          <label style="font-size:13px;font-weight:600;">Stock Quantity (${initialValues.unit || 'pc'})</label>
          <input id="stock-qty" type="number" min="0" class="swal2-input" style="margin:0;" value="${initialValues.quantity || 0}" />
          <label style="font-size:13px;font-weight:600;">Low-Stock Threshold</label>
          <input id="stock-threshold" type="number" min="0" class="swal2-input" style="margin:0;" value="${initialValues.lowStockThreshold || 10}" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Inventory',
      preConfirm: () => {
        const quantityValue = document.getElementById('stock-qty')?.value;
        const thresholdValue = document.getElementById('stock-threshold')?.value;

        if (quantityValue === null || quantityValue === '') {
          Swal.showValidationMessage('Stock quantity is required.');
          return null;
        }

        if (thresholdValue === null || thresholdValue === '') {
          Swal.showValidationMessage('Low-stock threshold is required.');
          return null;
        }

        return {
          quantity: Math.max(0, Number(quantityValue)),
          lowStockThreshold: Math.max(0, Number(thresholdValue)),
        };
      },
    });

    return result.isConfirmed ? result.value : null;
  };

  const handleUpdateInventory = async (item) => {
    const values = await openInventoryPopup({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity || 0,
      lowStockThreshold: item.lowStockThreshold || 10,
    });

    if (!values) {
      return;
    }

    try {
      await api.patch(`/inventory/${item._id}`, values);
      await loadInventory({ silent: true });
      await Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Inventory updated successfully.',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Could not update inventory.',
      });
    }
  };

  const getStockStatus = (item) => {
    if (Number(item.quantity || 0) <= 0 || item.available === false) {
      return { label: 'Out of Stock', color: 'text-rose-700 bg-rose-100' };
    }

    if (Number(item.quantity || 0) <= Number(item.lowStockThreshold || 10)) {
      return { label: 'Low Stock', color: 'text-amber-700 bg-amber-100' };
    }

    return { label: 'In Stock', color: 'text-emerald-700 bg-emerald-100' };
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-blue-50/60 p-4 shadow-sm sm:p-6">
          <SkeletonBox className="mb-3 h-7 w-52" />
          <SkeletonBox className="h-4 w-64" />
        </section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SkeletonBox className="mb-3 h-3 w-28" />
              <SkeletonBox className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SkeletonBox className="h-9 w-full" />
        </div>
        <div className="grid gap-3 md:hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SkeletonBox className="mb-3 h-5 w-32" />
              <SkeletonBox className="h-4 w-40" />
            </div>
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:block">
          <table className="min-w-full">
            <thead><tr className="h-11 bg-slate-900"><th colSpan="6" /></tr></thead>
            <tbody><SkeletonTableRows rows={7} cols={6} /></tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-blue-50/60 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Inventory Management</h2>
            <p className="mt-1 text-sm text-slate-600">Stock is stored in MongoDB and auto-deducts when orders are marked done.</p>
          </div>
          <button
            type="button"
            onClick={openInventoryHistory}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          >
            History
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Number of Items</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalStockUnits}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Inventory Entries</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalInventoryItems}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Low Stock (10 or below)</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{summary.lowStockCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ingredient..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
        />
      </section>

      <div className="grid gap-3 md:hidden">
        {sortedItems.map((item) => {
          const status = getStockStatus(item);

          return (
            <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500">Unit: {item.unit || 'pc'}</p>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-600">Stock: <span className="font-semibold text-slate-900">{Number(item.quantity || 0)}</span></p>
                <p className="text-right text-slate-600">Threshold: <span className="font-semibold text-slate-900">{Number(item.lowStockThreshold || 10)}</span></p>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateInventory(item)}
                className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Edit Stock
              </button>
            </article>
          );
        })}
      </div>

      {!sortedItems.length && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center md:hidden">
          <p className="text-slate-600">No inventory items found.</p>
        </div>
      )}

      <div className="hidden max-h-[62vh] overflow-auto rounded-2xl border border-slate-200 shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
              <th className="px-5 py-3.5">
                <button type="button" onClick={() => handleSort('name')} className="transition hover:text-white">{sortLabel('name', 'Ingredient')}</button>
              </th>
              <th className="px-5 py-3.5">
                <button type="button" onClick={() => handleSort('unit')} className="transition hover:text-white">{sortLabel('unit', 'Unit')}</button>
              </th>
              <th className="px-5 py-3.5">
                <button type="button" onClick={() => handleSort('quantity')} className="transition hover:text-white">{sortLabel('quantity', 'Stock')}</button>
              </th>
              <th className="px-5 py-3.5">
                <button type="button" onClick={() => handleSort('lowStockThreshold')} className="transition hover:text-white">{sortLabel('lowStockThreshold', 'Threshold')}</button>
              </th>
              <th className="px-5 py-3.5">
                <button type="button" onClick={() => handleSort('status')} className="transition hover:text-white">{sortLabel('status', 'Status')}</button>
              </th>
              <th className="px-5 py-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.map((item, idx) => {
              const status = getStockStatus(item);

              return (
                <tr key={item._id} className={`transition-colors hover:bg-blue-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                  <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{item.unit || 'pc'}</span>
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-800">{Number(item.quantity || 0)}</td>
                  <td className="px-5 py-3 text-slate-600">{Number(item.lowStockThreshold || 10)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold shadow-sm ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateInventory(item)}
                      className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedItems.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No inventory items found.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
