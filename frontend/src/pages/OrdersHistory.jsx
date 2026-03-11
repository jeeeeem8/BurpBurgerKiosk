import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api.js';

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
  const [periodFilter, setPeriodFilter] = useState('day');
  const [statusFilter, setStatusFilter] = useState('');

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const loadOrders = async () => {
    const { data } = await api.get('/orders', {
      params: {
        ...(periodFilter ? { period: periodFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    });
    setOrders(data);
  };

  useEffect(() => {
    loadOrders().catch(() => {
      setOrders([]);
    });
  }, [periodFilter, statusFilter]);

  const openOrderDetails = async (order) => {
    const rows = order.items
      .map(
        (item) => `<tr>
          <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
          <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
          <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${item.addons.map((addon) => addon.name).join(', ') || 'None'}</td>
          <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${item.requestNote || '-'}</td>
        </tr>`,
      )
      .join('');

    await Swal.fire({
      title: `Order #${order.orderNumber}`,
      width: 860,
      html: `<div style="text-align:left;display:grid;gap:8px;">
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Status:</strong> ${statusLabel(order.status)}</p>
        <p><strong>Date/Time:</strong> ${order.date} ${order.time}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:6px;background:#f8fafc;">Item</th>
              <th style="text-align:left;padding:6px;background:#f8fafc;">Qty</th>
              <th style="text-align:left;padding:6px;background:#f8fafc;">Add-ons</th>
              <th style="text-align:left;padding:6px;background:#f8fafc;">Request</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p><strong>Total:</strong> PHP ${Number(order.totalPrice).toFixed(2)}</p>
      </div>`,
      confirmButtonText: 'Close',
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

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-amber-50/60 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Orders History</h2>
            <p className="text-sm text-slate-600">Track completed and received tickets with quick filtering.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Price</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">{order.items.length} item(s)</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                    {statusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">PHP {Number(order.totalPrice).toFixed(2)}</td>
                <td className="px-4 py-3">{order.date}</td>
                <td className="px-4 py-3">{order.time}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openOrderDetails(order)}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
                  >
                    View
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order)}
                    className="rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-slate-500">
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
