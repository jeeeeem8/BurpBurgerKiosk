import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api, { getImageUrl } from '../services/api.js';

const initialForm = {
  name: '',
  category: 'Burger',
  price: '',
};

const normalizeCategory = (category = '') => (category === 'Desserts' ? 'Fries' : category);

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);

  const loadItems = async () => {
    const { data } = await api.get('/menu');
    setMenuItems(data);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openItemPopup = async (initialValues = initialForm) => {
    const categoryOptions = ['Burger', 'Rice Meal', 'Fries', 'Drinks']
      .map((category) => {
        const selected = normalizeCategory(initialValues.category) === category ? 'selected' : '';
        return `<option value="${category}" ${selected}>${category}</option>`;
      })
      .join('');

    const result = await Swal.fire({
      title: initialValues._id ? 'Edit Menu Item' : 'Add Menu Item',
      width: 560,
      html: `
        <div style="display:grid;gap:10px;text-align:left;">
          <label style="font-size:13px;font-weight:600;">Name</label>
          <input id="menu-name" class="swal2-input" style="margin:0;" value="${initialValues.name || ''}" />
          <label style="font-size:13px;font-weight:600;">Category</label>
          <select id="menu-category" class="swal2-input" style="margin:0;">${categoryOptions}</select>
          <label style="font-size:13px;font-weight:600;">Price</label>
          <input id="menu-price" type="number" step="0.01" class="swal2-input" style="margin:0;" value="${initialValues.price || ''}" />
          <label style="font-size:13px;font-weight:600;">Image ${initialValues._id ? '(optional)' : ''}</label>
          <input id="menu-image" type="file" accept="image/*" style="font-size:13px;" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: initialValues._id ? 'Update Item' : 'Add Item',
      preConfirm: () => {
        const name = document.getElementById('menu-name')?.value?.trim();
        const category = document.getElementById('menu-category')?.value;
        const price = document.getElementById('menu-price')?.value;
        const image = document.getElementById('menu-image')?.files?.[0] || null;

        if (!name || !price) {
          Swal.showValidationMessage('Name and price are required.');
          return null;
        }

        return { name, category, price, image };
      },
    });

    return result.isConfirmed ? result.value : null;
  };

  const handleUpsert = async (item = null) => {
    const values = await openItemPopup(
      item
        ? {
            _id: item._id,
            name: item.name,
            category: normalizeCategory(item.category),
            price: item.price,
          }
        : initialForm,
    );

    if (!values) {
      return;
    }

    try {
      const payload = new FormData();
      payload.append('name', values.name);
      payload.append('category', values.category);
      payload.append('price', values.price);
      if (values.image) {
        payload.append('image', values.image);
      }

      console.log('Sending menu item data:', {
        name: values.name,
        category: values.category,
        price: values.price,
        hasImage: !!values.image,
      });

      if (item?._id) {
        await api.put(`/menu/${item._id}`, payload);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Menu item updated successfully.',
          timer: 2000,
        });
      } else {
        await api.post('/menu', payload);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Menu item added successfully and saved to database.',
          timer: 2000,
        });
      }

      await loadItems();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save menu item';
      const errorDetails = error.response?.data?.error || '';
      
      console.error('Menu item save failed:', {
        status: error.response?.status,
        message: errorMessage,
        details: errorDetails,
        data: error.response?.data,
      });

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete item?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) {
      return;
    }

    await api.delete(`/menu/${id}`);
    await loadItems();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50/60 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Menu Management</h2>
            <p className="mt-1 text-sm text-slate-600">Create, update, and organize food items with a popup editor.</p>
          </div>
          <button
            type="button"
            onClick={() => handleUpsert()}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add Item
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:hidden">
        {menuItems.map((item) => (
          <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <img src={getImageUrl(item.image)} alt={item.name} className="h-16 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-600">{normalizeCategory(item.category)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">PHP {Number(item.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleUpsert(item)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(item._id)} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => (
              <tr key={item._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <img src={getImageUrl(item.image)} alt={item.name} className="h-12 w-16 rounded object-cover" />
                </td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{normalizeCategory(item.category)}</td>
                <td className="px-4 py-3">PHP {Number(item.price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleUpsert(item)} className="rounded bg-amber-500 px-3 py-1 text-xs text-white sm:text-sm">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item._id)} className="rounded bg-rose-500 px-3 py-1 text-xs text-white sm:text-sm">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagement;
