import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api, { getImageUrl } from '../services/api.js';
import { SkeletonBox, SkeletonTableRows } from '../components/Skeleton.jsx';

const initialForm = {
  name: '',
  category: 'Burger',
  price: '',
};

const normalizeCategory = (category = '') => (category === 'Desserts' ? 'Fries' : category);

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      const { data } = await api.get('/menu');
      setMenuItems(data);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 md:flex md:h-full md:min-h-0 md:flex-col">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50/60 p-4 shadow-sm sm:p-6">
          <SkeletonBox className="mb-3 h-7 w-48" />
          <SkeletonBox className="h-4 w-72" />
        </section>
        <div className="grid gap-3 md:hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <SkeletonBox className="h-20 w-24 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 pt-1">
                  <SkeletonBox className="h-4 w-32" />
                  <SkeletonBox className="h-3 w-20" />
                  <SkeletonBox className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:block">
          <table className="min-w-full">
            <thead><tr className="h-11 bg-slate-900"><th colSpan="5" /></tr></thead>
            <tbody><SkeletonTableRows rows={8} cols={5} /></tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 md:flex md:h-full md:min-h-0 md:flex-col">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-cyan-50/60 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Menu Management</h2>
            <p className="mt-1 text-sm text-slate-600">Create, update, and organize food items with a popup editor.</p>
          </div>
          <button
            type="button"
            onClick={() => handleUpsert()}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          >
            Add Item
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:hidden">
        {menuItems.map((item) => (
          <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <img src={getImageUrl(item.image)} alt={item.name} className="h-20 w-24 rounded-lg object-cover" />
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

        {!menuItems.length && <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 shadow-sm">No menu items found.</p>}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
              <th className="px-5 py-3.5">Image</th>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menuItems.map((item, idx) => (
              <tr key={item._id} className={`transition-colors hover:bg-amber-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                <td className="px-5 py-3">
                  <img src={getImageUrl(item.image)} alt={item.name} className="h-14 w-18 rounded-xl object-cover shadow-sm" />
                </td>
                <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                <td className="px-5 py-3">
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {normalizeCategory(item.category)}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800">PHP {Number(item.price).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleUpsert(item)} className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-400 active:scale-95">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item._id)} className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-400 active:scale-95">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!menuItems.length && (
              <tr>
                <td colSpan="5" className="px-5 py-10 text-center text-slate-400">
                  No menu items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagement;
