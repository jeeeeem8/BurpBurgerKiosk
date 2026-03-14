import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api.js';
import { SkeletonBox, SkeletonTableRows } from '../components/Skeleton.jsx';

const periodOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const TotalSales = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    selected: { sales: 0, orders: 0 },
    periods: { day: { sales: 0, orders: 0 }, week: { sales: 0, orders: 0 }, month: { sales: 0, orders: 0 }, year: { sales: 0, orders: 0 } },
    totalOrders: 0,
    completedOrders: 0,
    preparingOrders: 0,
    averageOrderValue: 0,
    topItems: [],
  });

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/orders/sales/summary', { params: { period: selectedPeriod } });
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary().catch(() => {
      setSummary((prev) => ({ ...prev, selected: { sales: 0, orders: 0 }, topItems: [] }));
    });
  }, [selectedPeriod]);

  const selectedLabel = useMemo(() => {
    return periodOptions.find((item) => item.value === selectedPeriod)?.label || 'Day';
  }, [selectedPeriod]);

  const handleDeleteByPeriod = async () => {
    const prompt = await Swal.fire({
      title: `Delete ${selectedLabel} Data?`,
      text: 'This permanently deletes orders in this period. Enter admin password to continue.',
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

    if (!prompt.isConfirmed) {
      return;
    }

    try {
      const { data } = await api.delete('/orders/purge/by-period', {
        data: {
          period: selectedPeriod,
          password: prompt.value,
        },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: `${data.deletedCount || 0} order(s) deleted permanently.`,
      });

      await loadSummary();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.message || 'Could not delete data.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBox className="h-8 w-36" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => <SkeletonBox key={i} className="h-9 w-16" />)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
              <SkeletonBox className="mb-3 h-4 w-28" />
              <SkeletonBox className="h-9 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
              <SkeletonBox className="mb-3 h-4 w-16" />
              <SkeletonBox className="mb-2 h-6 w-24" />
              <SkeletonBox className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <SkeletonBox className="h-6 w-40" />
          </div>
          <table className="min-w-full">
            <thead><tr className="h-10 bg-slate-100"><th colSpan="3" /></tr></thead>
            <tbody><SkeletonTableRows rows={5} cols={3} /></tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-black sm:text-2xl">Total Sales</h2>
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          {periodOptions.map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => setSelectedPeriod(period.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
                selectedPeriod === period.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'
              }`}
            >
              {period.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDeleteByPeriod}
            className="col-span-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 sm:col-span-1 sm:text-sm"
          >
            Delete {selectedLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sales ({selectedLabel})</p>
          <p className="mt-2 text-2xl font-black text-slate-800 sm:text-3xl">PHP {Number(summary.selected?.sales || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Orders ({selectedLabel})</p>
          <p className="mt-2 text-2xl font-black text-slate-800 sm:text-3xl">{Number(summary.selected?.orders || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed Orders</p>
          <p className="mt-2 text-2xl font-black text-emerald-700 sm:text-3xl">{summary.completedOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Preparing Orders</p>
          <p className="mt-2 text-2xl font-black text-sky-700 sm:text-3xl">{summary.preparingOrders}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Day</p>
          <p className="mt-2 text-lg font-black text-slate-800">PHP {Number(summary.periods?.day?.sales || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500">Orders: {Number(summary.periods?.day?.orders || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Week</p>
          <p className="mt-2 text-lg font-black text-slate-800">PHP {Number(summary.periods?.week?.sales || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500">Orders: {Number(summary.periods?.week?.orders || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Month</p>
          <p className="mt-2 text-lg font-black text-slate-800">PHP {Number(summary.periods?.month?.sales || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500">Orders: {Number(summary.periods?.month?.orders || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Year</p>
          <p className="mt-2 text-lg font-black text-slate-800">PHP {Number(summary.periods?.year?.sales || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500">Orders: {Number(summary.periods?.year?.orders || 0)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="text-lg font-bold text-slate-800">Top Selling Items</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty Sold</th>
              <th className="px-4 py-3">Sales</th>
            </tr>
          </thead>
          <tbody>
            {summary.topItems.map((item) => (
              <tr key={item.name} className="border-t">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.qty}</td>
                <td className="px-4 py-3">PHP {Number(item.sales).toFixed(2)}</td>
              </tr>
            ))}
            {!summary.topItems.length && (
              <tr>
                <td colSpan="3" className="px-4 py-4 text-center text-slate-500">
                  No completed orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotalSales;
