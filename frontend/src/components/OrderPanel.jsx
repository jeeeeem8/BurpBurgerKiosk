const statusBadge = {
  active: 'bg-amber-100 text-amber-700',
  preparing: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const OrderPanel = ({
  activeTicket,
  onCustomerNameChange,
  onEditItem,
  onRemoveItem,
  onPlaceOrder,
  onCompleteOrder,
  isPlacing,
  isCompleting,
}) => {
  if (!activeTicket) {
    return (
      <aside className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Create a new order to start.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Ticket</p>
          <h3 className="text-lg font-bold text-slate-800 sm:text-xl">Order #{activeTicket.orderNumber}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadge[activeTicket.status]}`}>
          {activeTicket.status}
        </span>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">Customer Name</label>
        <input
          value={activeTicket.customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Guest"
        />
      </div>

      <div className="mb-4 max-h-64 space-y-2 overflow-auto pr-1 sm:max-h-72">
        {activeTicket.items.map((item, index) => {
          const isMixMatch = item.type === 'mix-match';
          
          return (
            <div key={`${isMixMatch ? 'mix-match' : item.menuItemId}-${index}`} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {isMixMatch ? (
                    <>
                      <p className="text-sm font-semibold text-green-700 sm:text-base">Mix & Match (Rice Meals)</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Meals: {item.meals.map((meal) => meal.name).join(', ')}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-800 sm:text-base">{item.name}</p>
                      <p className="text-xs text-slate-500 sm:text-sm">Qty: {item.quantity}</p>
                    </>
                  )}
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Add-ons: {item.addons.map((addon) => addon.name).join(', ') || 'None'}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-700 sm:text-sm">
                  PHP {isMixMatch 
                    ? (item.price + item.addons.reduce((sum, addon) => sum + Number(addon.price), 0)).toFixed(2)
                    : (((Number(item.price) + item.addons.reduce((sum, addon) => sum + Number(addon.price), 0)) * Number(item.quantity || 1))).toFixed(2)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEditItem(index)}
                  disabled={activeTicket.status !== 'active' || isMixMatch}
                  className="rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  disabled={activeTicket.status !== 'active'}
                  className="rounded-md bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-400"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {!activeTicket.items.length && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No items in this ticket yet.</p>
        )}
      </div>

      <div className="mb-4 rounded-xl bg-slate-50 p-3">
        <p className="text-sm text-slate-600">Total</p>
        <p className="text-lg font-bold text-slate-800">PHP {Number(activeTicket.totalPrice).toFixed(2)}</p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={isPlacing || !activeTicket.items.length || activeTicket.status !== 'active'}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {isPlacing ? 'Placing...' : 'Place Order'}
        </button>

        <button
          type="button"
          onClick={onCompleteOrder}
          disabled={isCompleting || activeTicket.status !== 'preparing'}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {isCompleting ? 'Completing...' : 'Complete Order'}
        </button>
      </div>
    </aside>
  );
};

export default OrderPanel;
