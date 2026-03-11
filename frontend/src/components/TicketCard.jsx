const statusClasses = {
  active: 'border-amber-400 bg-amber-50 text-amber-800',
  preparing: 'border-sky-400 bg-sky-50 text-sky-800',
  completed: 'border-emerald-400 bg-emerald-50 text-emerald-800',
};

const dotClasses = {
  active: 'bg-amber-500',
  preparing: 'bg-sky-500',
  completed: 'bg-emerald-500',
};

const TicketCard = ({ ticket, isActive, onSelect, onDelete }) => {
  const itemCount = ticket.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(ticket.ticketId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect(ticket.ticketId);
        }
      }}
      className={`min-w-[130px] cursor-pointer rounded-xl p-2.5 shadow transition md:hover:scale-[1.02] sm:min-w-[160px] sm:p-3 ${
        isActive ? 'border-2 border-green-500 bg-green-50' : 'bg-white'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-800 sm:text-sm">#{ticket.orderNumber}</p>
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${dotClasses[ticket.status] || dotClasses.active}`}
        />
      </div>
      <p className="truncate text-xs text-slate-600 sm:text-sm">{ticket.customerName || 'Guest'}</p>
      <p className="text-xs font-semibold text-slate-700 sm:text-sm">PHP {Number(ticket.totalPrice).toFixed(2)}</p>
      <p className="text-xs text-slate-500">{itemCount} item(s)</p>
      <span
        className={`mt-2 inline-block rounded-md border px-2 py-1 text-xs font-semibold uppercase ${
          statusClasses[ticket.status] || statusClasses.active
        }`}
      >
        {ticket.status}
      </span>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(ticket.ticketId);
        }}
        className="mt-2 w-full rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-400"
      >
        Delete
      </button>
    </div>
  );
};

export default TicketCard;
