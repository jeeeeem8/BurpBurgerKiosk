import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api, { getImageUrl } from '../services/api.js';

const InventoryManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/menu');
      setMenuItems(data);

      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(data.map((item) => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load menu items.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const filteredItems =
    selectedCategory === 'All' ? menuItems : menuItems.filter((item) => item.category === selectedCategory);

  const openInventoryPopup = async (initialValues = { quantity: 0, available: true }) => {
    const result = await Swal.fire({
      title: 'Edit Inventory',
      width: 520,
      html: `
        <div style="display:grid;gap:10px;text-align:left;">
          <label style="font-size:13px;font-weight:600;">Stock Quantity</label>
          <input id="stock-qty" type="number" min="0" class="swal2-input" style="margin:0;" value="${initialValues.quantity || 0}" />
          <label style="font-size:13px;font-weight:600;">Status</label>
          <select id="stock-status" class="swal2-input" style="margin:0;">
            <option value="available" ${initialValues.available !== false ? 'selected' : ''}>Available</option>
            <option value="out-of-stock" ${initialValues.available === false ? 'selected' : ''}>Out of Stock</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Inventory',
      preConfirm: () => {
        const quantity = document.getElementById('stock-qty')?.value;
        const status = document.getElementById('stock-status')?.value;

        if (quantity === null || quantity === '') {
          Swal.showValidationMessage('Stock quantity is required.');
          return null;
        }

        return { quantity: parseInt(quantity), available: status === 'available' };
      },
    });

    return result.isConfirmed ? result.value : null;
  };

  const handleUpdateInventory = async (item) => {
    const values = await openInventoryPopup({
      quantity: item.quantity || 0,
      available: item.available !== false,
    });

    if (!values) {
      return;
    }

    try {
      await api.put(`/menu/${item._id}`, {
        ...item,
        quantity: values.quantity,
        available: values.available,
      });
      await loadMenuItems();
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
    if (!item.available) return { label: 'Out of Stock', color: 'text-rose-600 bg-rose-50' };
    if (item.quantity < 5) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50' };
    return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-blue-50/60 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Inventory Management</h2>
            <p className="mt-1 text-sm text-slate-600">Track and manage stock levels for all menu items.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 md:hidden">
        {filteredItems.map((item) => {
          const status = getStockStatus(item);

          return (
            <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500">{item.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600">Stock: {item.quantity || 0}</p>
                      <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">PHP {Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
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

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const status = getStockStatus(item);

              return (
                <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">PHP {Number(item.price).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">{item.quantity || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateInventory(item)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
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

      {filteredItems.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No items found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
