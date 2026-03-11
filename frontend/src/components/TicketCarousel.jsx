import TicketCard from './TicketCard.jsx';

const TicketCarousel = ({ tickets, activeTicketId, onCreateTicket, onSelectTicket, onDeleteTicket, className = '' }) => {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-stretch gap-2 overflow-x-auto scroll-smooth pb-1 sm:gap-3">
        <button
          type="button"
          onClick={onCreateTicket}
          className="min-w-[110px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-500 hover:bg-slate-100 sm:min-w-[150px] sm:px-4 sm:py-3 sm:text-sm"
        >
          + New Order
        </button>

        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.ticketId}
            ticket={ticket}
            isActive={ticket.ticketId === activeTicketId}
            onSelect={onSelectTicket}
            onDelete={onDeleteTicket}
          />
        ))}
      </div>
    </section>
  );
};

export default TicketCarousel;
