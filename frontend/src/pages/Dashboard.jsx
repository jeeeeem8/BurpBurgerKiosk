import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import CategoryTabs from '../components/CategoryTabs.jsx';
import FoodCard from '../components/FoodCard.jsx';
import OrderPanel from '../components/OrderPanel.jsx';
import TicketCarousel from '../components/TicketCarousel.jsx';
import api from '../services/api.js';

const categoryOrder = ['All', 'Burger', 'Rice Meal', 'Fries', 'Drinks'];
const cardCategoryPriority = ['Burger', 'Rice Meal', 'Fries', 'Drinks'];

// Addon mapping by category
const categoryAddonMap = {
  Burger: [
    { name: 'Sliced Cheese', price: 25 },
    { name: 'Melted Cheese', price: 15 },
    { name: 'Bacon', price: 10 },
    { name: 'Sliced Pineapple', price: 25 },
  ],
  'Rice Meal': [
    { name: 'Egg', price: 15 },
    { name: 'BBQ Sauce', price: 15 },
    { name: 'Garlic Mayo', price: 15 },
  ],
};

const normalizeCategory = (category = '') => {
  if (category === 'Desserts') {
    return 'Fries';
  }
  return category;
};

const calculateTicketTotal = (items) => {
  return items.reduce((sum, item) => {
    const addonsTotal = (item.addons || []).reduce((addonSum, addon) => addonSum + Number(addon.price), 0);
    
    // Handle Mix & Match items (fixed price)
    if (item.type === 'mix-match') {
      return sum + (item.price + addonsTotal);
    }
    
    // Handle regular items (quantity-based)
    return sum + (Number(item.price) + addonsTotal) * Number(item.quantity || 1);
  }, 0);
};

const buildAddonHtml = (addons, selected) => {
  return addons
    .map((addon) => {
      const checked = selected.some((chosen) => {
        // Handle both DB addons (with _id) and category-mapped addons (with name)
        if (addon._id) {
          return chosen._id === addon._id;
        }
        return chosen.name === addon.name;
      }) ? 'checked' : '';
      
      return `<label style="display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-bottom:6px;">
        <span>${addon.name}</span>
        <span>PHP ${Number(addon.price).toFixed(2)} <input class="swal-addon" type="checkbox" data-addon-name="${addon.name}" data-addon-price="${addon.price}" ${checked}/></span>
      </label>`;
    })
    .join('');
};

const Dashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [isMobileTicketWindowOpen, setIsMobileTicketWindowOpen] = useState(false);
  const [orderCounter, setOrderCounter] = useState(1001);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.ticketId === activeTicketId) || null,
    [tickets, activeTicketId],
  );

  const categories = useMemo(() => {
    const dbCategories = [...new Set(menuItems.map((item) => normalizeCategory(item.category)))];
    const ordered = categoryOrder.filter((category) => dbCategories.includes(category) || category === 'All');
    const extra = dbCategories.filter((category) => !ordered.includes(category));
    return [...ordered, ...extra];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let baseItems = activeCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

    const sorted = [...baseItems].sort((a, b) => {
      const aIndex = cardCategoryPriority.indexOf(a.category);
      const bIndex = cardCategoryPriority.indexOf(b.category);
      const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return a.name.localeCompare(b.name);
    });

    // Add Mix & Match card at the beginning for Rice Meals
    if (activeCategory === 'Rice Meals') {
      return [
        {
          isMixMatch: true,
          _id: 'mix-match',
          name: 'Mix & Match',
          price: 158,
        },
        ...sorted,
      ];
    }

    return sorted;
  }, [activeCategory, menuItems]);

  const loadData = async () => {
    const [menuResponse, addonsResponse] = await Promise.all([api.get('/menu'), api.get('/addons')]);
    setMenuItems(
      menuResponse.data.map((item) => ({
        ...item,
        category: normalizeCategory(item.category),
      })),
    );
    setAddons(addonsResponse.data);
  };

  useEffect(() => {
    loadData().catch(() => {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load menu data.' });
    });
  }, []);

  const createNewTicket = () => {
    const ticketId = `ticket-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const newTicket = {
      ticketId,
      orderNumber: orderCounter,
      customerName: '',
      items: [],
      totalPrice: 0,
      status: 'active',
      placedOrderId: null,
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) => [...prev, newTicket]);
    setActiveTicketId(ticketId);
    setOrderCounter((prev) => prev + 1);
  };

  const updateTicket = (ticketId, updater) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.ticketId !== ticketId) {
          return ticket;
        }

        const updated = updater(ticket);
        return {
          ...updated,
          totalPrice: calculateTicketTotal(updated.items),
        };
      }),
    );
  };

  const openItemPopup = async (menuItem, initialItem = null) => {
    const selectedAddons = initialItem?.addons || [];
    
    // Get category-specific add-ons
    const categorySpecificAddons = categoryAddonMap[menuItem.category] || [];

    const popup = await Swal.fire({
      title: menuItem.name,
      html: `
        <div style="text-align:left;display:grid;gap:10px;">
          <label style="font-size:13px;font-weight:600;">Quantity</label>
          <input id="swal-qty" type="number" min="1" value="${initialItem?.quantity || 1}" class="swal2-input" style="margin:0;height:40px;"/>
          ${categorySpecificAddons.length > 0 ? `
            <label style="font-size:13px;font-weight:600;">Add-ons</label>
            <div style="max-height:140px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">${buildAddonHtml(categorySpecificAddons, selectedAddons)}</div>
          ` : ''}
          <label style="font-size:13px;font-weight:600;">Special Request</label>
          <textarea id="swal-note" class="swal2-textarea" style="margin:0;height:80px;" placeholder="No onions, extra sauce...">${initialItem?.requestNote || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save',
      preConfirm: () => {
        const qtyInput = document.getElementById('swal-qty');
        const noteInput = document.getElementById('swal-note');
        const checkedAddons = [...document.querySelectorAll('.swal-addon:checked')].map((checkbox) => {
          const addonName = checkbox.dataset.addonName;
          const addonPrice = checkbox.dataset.addonPrice;
          return {
            name: addonName,
            price: Number(addonPrice),
          };
        });

        return {
          quantity: Math.max(1, Number(qtyInput?.value) || 1),
          requestNote: noteInput?.value || '',
          addons: checkedAddons,
        };
      },
    });

    return popup.isConfirmed ? popup.value : null;
  };

  const openMixMatchPopup = async () => {
    const riceMeals = menuItems.filter((item) => item.category === 'Rice Meals');

    const buildMealCheckboxes = () => {
      return riceMeals
        .map(
          (meal) =>
            `<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;padding:8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;">
              <input class="swal-meal-checkbox" type="checkbox" data-meal-id="${meal._id}" data-meal-name="${meal.name}" style="cursor:pointer;"/>
              <span style="flex:1;">${meal.name}</span>
              <span style="font-weight:600;color:#666;">PHP ${Number(meal.price).toFixed(2)}</span>
            </label>`,
        )
        .join('');
    };

    const popup = await Swal.fire({
      title: 'Mix & Match',
      html: `
        <div style="text-align:left;display:grid;gap:10px;">
          <p style="font-size:13px;color:#666;margin:0;">Pick 2 Rice Meals for ₱158</p>
          <div style="max-height:250px;overflow:auto;">
            ${buildMealCheckboxes()}
          </div>
          <label style="font-size:13px;font-weight:600;">Add-ons</label>
          <div style="max-height:140px;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">${buildAddonHtml(categoryAddonMap['Rice Meals'], [])}</div>
          <label style="font-size:13px;font-weight:600;">Special Request</label>
          <textarea id="swal-note" class="swal2-textarea" style="margin:0;height:80px;" placeholder="No onions, extra sauce..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add to Order',
      preConfirm: () => {
        const checkedMeals = [...document.querySelectorAll('.swal-meal-checkbox:checked')].map((checkbox) => ({
          mealId: checkbox.dataset.mealId,
          name: checkbox.dataset.mealName,
        }));

        if (checkedMeals.length !== 2) {
          Swal.showValidationMessage('Please select exactly 2 rice meals.');
          return false;
        }

        const checkedAddons = [...document.querySelectorAll('.swal-addon:checked')].map((checkbox) => ({
          name: checkbox.dataset.addonName,
          price: Number(checkbox.dataset.addonPrice),
        }));

        const noteInput = document.getElementById('swal-note');

        return {
          meals: checkedMeals,
          addons: checkedAddons,
          requestNote: noteInput?.value || '',
        };
      },
    });

    return popup.isConfirmed ? popup.value : null;
  };

  const handleAddFoodToTicket = async (menuItem) => {
    if (!activeTicketId) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Active Ticket',
        text: 'Please create a new order first.',
      });
      return;
    }

    // Handle Mix & Match
    if (menuItem.isMixMatch) {
      await handleAddMixMatch();
      return;
    }

    const config = await openItemPopup(menuItem);
    if (!config) {
      return;
    }

    updateTicket(activeTicketId, (ticket) => ({
      ...ticket,
      items: [
        ...ticket.items,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: config.quantity,
          addons: config.addons,
          requestNote: config.requestNote,
        },
      ],
    }));
  };

  const handleAddMixMatch = async () => {
    if (!activeTicketId) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Active Ticket',
        text: 'Please create a new order first.',
      });
      return;
    }

    const config = await openMixMatchPopup();
    if (!config) {
      return;
    }

    updateTicket(activeTicketId, (ticket) => ({
      ...ticket,
      items: [
        ...ticket.items,
        {
          type: 'mix-match',
          meals: config.meals,
          price: 158,
          addons: config.addons,
          requestNote: config.requestNote,
        },
      ],
    }));
  };

  const handleDeleteTicket = async (ticketId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this ticket?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) {
      return;
    }

    setTickets((prev) => {
      const remaining = prev.filter((ticket) => ticket.ticketId !== ticketId);
      if (activeTicketId === ticketId) {
        setActiveTicketId(remaining[0]?.ticketId || null);
        setIsMobileTicketWindowOpen(false);
      }
      return remaining;
    });
  };

  const handleSelectTicket = (ticketId) => {
    setActiveTicketId(ticketId);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsMobileTicketWindowOpen(true);
    }
  };

  const handleCustomerNameChange = (value) => {
    if (!activeTicketId) {
      return;
    }

    updateTicket(activeTicketId, (ticket) => ({
      ...ticket,
      customerName: value || 'Guest',
    }));
  };

  const handleEditItem = async (itemIndex) => {
    if (!activeTicket || activeTicket.status !== 'active') {
      return;
    }

    const currentItem = activeTicket.items[itemIndex];
    const menuItem = {
      _id: currentItem.menuItemId,
      name: currentItem.name,
      price: currentItem.price,
    };

    const config = await openItemPopup(menuItem, currentItem);
    if (!config) {
      return;
    }

    updateTicket(activeTicket.ticketId, (ticket) => ({
      ...ticket,
      items: ticket.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              quantity: config.quantity,
              addons: config.addons,
              requestNote: config.requestNote,
            }
          : item,
      ),
    }));
  };

  const handleRemoveItem = (itemIndex) => {
    if (!activeTicketId || !activeTicket || activeTicket.status !== 'active') {
      return;
    }

    updateTicket(activeTicketId, (ticket) => ({
      ...ticket,
      items: ticket.items.filter((_, index) => index !== itemIndex),
    }));
  };

  const handlePlaceOrder = async () => {
    if (!activeTicket || !activeTicket.items.length) {
      await Swal.fire({ icon: 'warning', title: 'No items', text: 'Add items before placing.' });
      return;
    }

    if (activeTicket.status !== 'active') {
      return;
    }

    const confirmation = await Swal.fire({
      title: `Place Order #${activeTicket.orderNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Place Order',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setIsPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        orderNumber: activeTicket.orderNumber,
        customerName: activeTicket.customerName || 'Guest',
        items: activeTicket.items,
        totalPrice: activeTicket.totalPrice,
        status: 'preparing',
      });

      updateTicket(activeTicket.ticketId, (ticket) => ({
        ...ticket,
        orderNumber: data.orderNumber,
        status: 'preparing',
        placedOrderId: data._id,
      }));

      await Swal.fire({
        icon: 'success',
        title: 'Order Placed',
        text: `Order #${activeTicket.orderNumber} has been saved.`,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not place order.',
      });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!activeTicket) {
      return;
    }

    if (activeTicket.status !== 'preparing' || !activeTicket.placedOrderId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Place order first',
        text: 'Use Place Order before completing this ticket.',
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: `Complete Order #${activeTicket.orderNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Complete',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setIsCompleting(true);
    try {
      await api.patch(`/orders/${activeTicket.placedOrderId}/complete`);

      setTickets((prev) => {
        const remaining = prev.filter((ticket) => ticket.ticketId !== activeTicket.ticketId);
        setActiveTicketId(remaining[0]?.ticketId || null);
        return remaining;
      });

      await Swal.fire({
        icon: 'success',
        title: 'Order Completed',
        text: `Order #${activeTicket.orderNumber} marked completed.`,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not complete order.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="grid gap-4 pb-20 pt-24 sm:pb-0 sm:pt-0 xl:h-[calc(100vh-3rem)] xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:overflow-hidden">
      <TicketCarousel
        className="fixed left-2 right-2 top-14 z-20 rounded-xl border border-slate-200 bg-slate-100/95 px-3 py-2 shadow-md backdrop-blur sm:static sm:rounded-2xl sm:border-none sm:bg-white sm:px-4 sm:py-4 sm:shadow-sm sm:backdrop-blur-0"
        tickets={tickets}
        activeTicketId={activeTicketId}
        onCreateTicket={createNewTicket}
        onSelectTicket={handleSelectTicket}
        onDeleteTicket={handleDeleteTicket}
      />

      <section className="w-full shrink-0 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
        <h2 className="mb-2 text-xl font-black text-slate-800 sm:mb-3 sm:text-2xl">Kiosk Ordering Screen</h2>
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      </section>

      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4 xl:min-h-0 xl:content-start xl:overflow-y-auto xl:pr-2">
          {filteredItems.map((item) => (
            <FoodCard key={item._id} item={item} onAddItem={handleAddFoodToTicket} />
          ))}
        </div>

        <div className="hidden xl:sticky xl:top-0 xl:block xl:self-start">
          <OrderPanel
            activeTicket={activeTicket}
            onCustomerNameChange={handleCustomerNameChange}
            onEditItem={handleEditItem}
            onRemoveItem={handleRemoveItem}
            onPlaceOrder={handlePlaceOrder}
            onCompleteOrder={handleCompleteOrder}
            isPlacing={isPlacing}
            isCompleting={isCompleting}
          />
        </div>
      </section>

      <div className="xl:hidden">
        {activeTicket && (
          <button
            type="button"
            onClick={() => setIsMobileTicketWindowOpen(true)}
            className="fixed bottom-4 right-4 z-30 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Active Ticket #{activeTicket.orderNumber}
          </button>
        )}

        {isMobileTicketWindowOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 p-3" onClick={() => setIsMobileTicketWindowOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              className="ml-auto mt-8 max-h-[calc(100vh-5rem)] w-full max-w-md overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Active Ticket Window</p>
                <button
                  type="button"
                  onClick={() => setIsMobileTicketWindowOpen(false)}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>

              <OrderPanel
                activeTicket={activeTicket}
                onCustomerNameChange={handleCustomerNameChange}
                onEditItem={handleEditItem}
                onRemoveItem={handleRemoveItem}
                onPlaceOrder={handlePlaceOrder}
                onCompleteOrder={handleCompleteOrder}
                isPlacing={isPlacing}
                isCompleting={isCompleting}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
