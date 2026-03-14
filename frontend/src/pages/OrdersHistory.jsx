import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api.js';
import { SkeletonBox, SkeletonTableRows } from '../components/Skeleton.jsx';

const OrdersHistory = () => {
  const statusLabel = (status) => {
    if (status === 'preparing') {
      return 'received';
    }
    if (status === 'completed') {
      return 'done';
    }
    return status || 'done';
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders', {
        params: {
          ...(periodFilter ? { period: periodFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders().catch(() => {
      setOrders([]);
    });
  }, [periodFilter, statusFilter]);

  const openOrderDetails = async (order) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const itemsHTML = order.items
      .map((item) => {
        const itemSubtotal = (item.price * item.quantity).toFixed(2);
        const addonsHTML = item.addons.length
          ? item.addons
              .map(
                (addon) =>
                  `<div style="display:flex;justify-content:space-between;padding-left:14px;color:#666;font-size:11px;margin-top:2px;">
                    <span>+ ${addon.name}</span>
                    <span>PHP ${Number(addon.price).toFixed(2)}</span>
                  </div>`,
              )
              .join('')
          : '';
        const noteHTML = item.requestNote
          ? `<div style="padding-left:14px;color:#999;font-size:11px;font-style:italic;margin-top:2px;">* ${item.requestNote}</div>`
          : '';
        return `<div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;">
            <span>${item.quantity}x ${item.name}</span>
            <span>PHP ${itemSubtotal}</span>
          </div>
          ${addonsHTML}
          ${noteHTML}
        </div>`;
      })
      .join('');

    const statusColor = order.status === 'completed' ? '#15803d' : '#0369a1';
    const statusBg = order.status === 'completed' ? '#dcfce7' : '#e0f2fe';

    await Swal.fire({
      title: '',
      width: isMobile ? '95%' : 460,
      padding: 0,
      background: '#eef2f7',
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#1e293b',
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#ffffff;margin:0;padding:20px 18px 16px;border:1px solid #dbe3ee;border-radius:10px;box-shadow:0 12px 30px rgba(15,23,42,0.12);">
          <div style="text-align:center;margin-bottom:12px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:#0f172a;">BURP BURGER</div>
            <div style="font-size:11px;letter-spacing:1.2px;color:#64748b;margin-top:2px;">KIOSK SALES RECEIPT</div>
          </div>

          <div style="border-top:1px dashed #cbd5e1;margin:10px 0;"></div>

          <div style="font-size:12px;color:#334155;line-height:1.8;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">ORDER #</span>
              <span style="font-weight:700;">${order.orderNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">DATE</span>
              <span>${order.date}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">TIME</span>
              <span>${order.time}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;">CUSTOMER</span>
              <span style="font-weight:700;">${order.customerName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
              <span style="color:#64748b;">STATUS</span>
              <span style="background:${statusBg};color:${statusColor};font-size:10px;font-weight:700;letter-spacing:0.6px;padding:3px 8px;border-radius:999px;text-transform:uppercase;">${statusLabel(order.status)}</span>
            </div>
          </div>

          <div style="border-top:1px dashed #cbd5e1;margin:10px 0;"></div>

          <div style="font-size:12px;color:#0f172a;">
            ${itemsHTML}
          </div>

          <div style="border-top:1px dashed #cbd5e1;margin:10px 0;"></div>

          <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;color:#0f172a;letter-spacing:0.3px;">
            <span>TOTAL</span>
            <span>PHP ${Number(order.totalPrice).toFixed(2)}</span>
          </div>

          <div style="border-top:1px dashed #cbd5e1;margin:12px 0 8px;"></div>

          <div style="text-align:center;font-size:10px;color:#94a3b8;line-height:1.8;letter-spacing:0.7px;">
            <div>THANK YOU FOR YOUR ORDER!</div>
            <div>PLEASE COME AGAIN</div>
          </div>
        </div>
      `,
    });
  };

  const handleDeleteOrder = async (order) => {
    const passwordPrompt = await Swal.fire({
      title: `Delete Order #${order.orderNumber}?`,
      text: 'Enter admin password to permanently delete this order.',
      input: 'password',
      inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Delete Permanently',
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('Password is required.');
        }
        return value;
      },
    });

    if (!passwordPrompt.isConfirmed) {
      return;
    }

    try {
      await api.delete(`/orders/${order._id}`, { data: { password: passwordPrompt.value } });
      await loadOrders();
      await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Order deleted permanently.' });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.message || 'Could not delete order.',
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-amber-50/60 p-4 shadow-sm sm:p-6">
          <SkeletonBox className="mb-3 h-7 w-44" />
          <SkeletonBox className="mb-4 h-4 w-80" />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <SkeletonBox className="mb-2 h-3 w-24" />
                <SkeletonBox className="h-7 w-20" />
              </div>
            ))}
          </div>
        </section>
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 shadow-sm md:block">
          <table className="min-w-full">
            <thead><tr className="h-11 bg-slate-900"><th colSpan="9" /></tr></thead>
            <tbody><SkeletonTableRows rows={7} cols={9} /></tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SkeletonBox className="mb-3 h-5 w-28" />
              <SkeletonBox className="mb-2 h-4 w-40" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-amber-50/60 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Orders History</h2>
            <p className="text-sm text-slate-600">Track completed and received tickets with quick filtering.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-3">
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="preparing">Received</option>
              <option value="completed">Done</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
            <p className="text-xl font-black text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
            <p className="text-xl font-black text-slate-900">PHP {totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Selected Period</p>
            <p className="text-lg font-bold text-slate-800">{periodFilter === 'all' ? 'All Time' : periodFilter}</p>
          </div>
        </div>
      </section>

      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Order #{order.orderNumber}</p>
                <h3 className="text-base font-bold text-slate-900">{order.customerName}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                {statusLabel(order.status)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
              <p>Items: {order.items.length}</p>
              <p className="text-right font-semibold text-slate-800">PHP {Number(order.totalPrice).toFixed(2)}</p>
              <p>{order.date}</p>
              <p className="text-right">{order.time}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openOrderDetails(order)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(order)}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {!orders.length && <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-500 shadow-sm">No orders found.</p>}
      </div>

      <div className="hidden max-h-[62vh] overflow-auto rounded-2xl border border-slate-200 shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
              <th className="px-5 py-3.5">Order #</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Items</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Time</th>
              <th className="px-5 py-3.5">Details</th>
              <th className="px-5 py-3.5">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order, idx) => (
              <tr key={order._id} className={`transition-colors hover:bg-amber-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                <td className="px-5 py-3 font-bold text-slate-900">#{order.orderNumber}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{order.customerName}</td>
                <td className="px-5 py-3">
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                    order.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                    {statusLabel(order.status)}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-800">PHP {Number(order.totalPrice).toFixed(2)}</td>
                <td className="px-5 py-3 text-slate-600">{order.date}</td>
                <td className="px-5 py-3 text-slate-600">{order.time}</td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openOrderDetails(order)}
                    className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
                  >
                    View
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order)}
                    className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-400 active:scale-95"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan="9" className="px-5 py-10 text-center text-slate-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersHistory;
