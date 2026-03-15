import { useState, useEffect, useCallback } from 'react';
import api, { isHostingOnlyMode } from '../services/api.js';

/**
 * useTickets Hook
 * Manages ticket state with localStorage persistence AND database sync
 * 
 * Features:
 * - Auto-persist tickets to localStorage
 * - Sync tickets with backend database
 * - Load tickets on component mount from database
 * - Create, update, delete tickets
 * - Filter tickets by status
 * - Track order counter
 */
const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [orderCounter, setOrderCounter] = useState(1001);
  const STORAGE_KEY = 'kiosk_tickets';
  const COUNTER_KEY = 'kiosk_order_counter';

  // Load tickets from backend on component mount
  useEffect(() => {
    const loadTicketsFromBackend = async () => {
      if (isHostingOnlyMode) {
        const savedTickets = localStorage.getItem(STORAGE_KEY);
        const savedCounter = localStorage.getItem(COUNTER_KEY);

        if (savedTickets) {
          try {
            setTickets(JSON.parse(savedTickets));
          } catch {
            setTickets([]);
          }
        }

        if (savedCounter) {
          try {
            setOrderCounter(Number(savedCounter));
          } catch {
            setOrderCounter(1001);
          }
        }

        return;
      }

      try {
        // Fetch active/preparing orders from backend
        const response = await api.get('/orders/active/list');
        const dbTickets = response.data.map((order) => ({
          ticketId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName || '',
          items: order.items || [],
          totalPrice: order.totalPrice || 0,
          status: order.status || 'active',
          placedOrderId: order._id,
          createdAt: order.createdAt || new Date().toISOString(),
          syncedWithDB: true,
        }));

        setTickets(dbTickets);
        
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbTickets));

        // Update counter based on highest order number
        if (dbTickets.length > 0) {
          const maxOrderNumber = Math.max(...dbTickets.map((t) => t.orderNumber));
          setOrderCounter(maxOrderNumber + 1);
          localStorage.setItem(COUNTER_KEY, String(maxOrderNumber + 1));
        }
      } catch (error) {
        console.error('Failed to load tickets from backend, falling back to localStorage:', error);
        
        // Fallback to localStorage if backend fails
        const savedTickets = localStorage.getItem(STORAGE_KEY);
        const savedCounter = localStorage.getItem(COUNTER_KEY);

        if (savedTickets) {
          try {
            setTickets(JSON.parse(savedTickets));
          } catch (parseError) {
            console.error('Failed to parse tickets from localStorage:', parseError);
          }
        }

        if (savedCounter) {
          try {
            setOrderCounter(Number(savedCounter));
          } catch (counterError) {
            console.error('Failed to parse order counter:', counterError);
          }
        }
      }
    };

    loadTicketsFromBackend();
  }, []); // Only run on mount

  // Persist tickets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  // Persist order counter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(COUNTER_KEY, String(orderCounter));
  }, [orderCounter]);

  // Create a new ticket
  const createTicket = useCallback((ticketData = {}) => {
    const newTicket = {
      ticketId: `ticket-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      orderNumber: orderCounter,
      customerName: ticketData.customerName || '',
      items: ticketData.items || [],
      totalPrice: ticketData.totalPrice || 0,
      status: 'active', // Status: 'active' | 'preparing' | 'ready' | 'served'
      placedOrderId: null,
      createdAt: new Date().toISOString(),
      ...ticketData,
    };

    setTickets((prev) => [...prev, newTicket]);
    setOrderCounter((prev) => prev + 1);

    return newTicket;
  }, [orderCounter]);

  // Update a specific ticket
  const updateTicket = useCallback((ticketId, updates) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.ticketId === ticketId
          ? { ...ticket, ...updates, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
  }, []);

  // Update ticket status (preparing, ready, served, etc.)
  const updateTicketStatus = useCallback((ticketId, newStatus) => {
    updateTicket(ticketId, { status: newStatus });
  }, [updateTicket]);

  // Delete a ticket (only from dashboard, not from history)
  const deleteTicket = useCallback((ticketId) => {
    setTickets((prev) => prev.filter((ticket) => ticket.ticketId !== ticketId));
  }, []);

  // Complete a ticket (remove from active, but keep in history via API)
  const completeTicket = useCallback((ticketId) => {
    deleteTicket(ticketId);
  }, [deleteTicket]);

  // Get a specific ticket by ID
  const getTicket = useCallback(
    (ticketId) => tickets.find((t) => t.ticketId === ticketId),
    [tickets]
  );

  // Get all active tickets (status !== 'served')
  const getActiveTickets = useCallback(
    () => tickets.filter((t) => t.status !== 'served'),
    [tickets]
  );

  // Get all preparing tickets
  const getPreparingTickets = useCallback(
    () => tickets.filter((t) => t.status === 'preparing'),
    [tickets]
  );

  // Sync with backend API (optional - call this periodically)
  // To use: const { syncWithBackend } = useTickets();
  // Then: syncWithBackend(api) where api is your axios instance
  const syncWithBackend = useCallback(async (api) => {
    try {
      // Fetch tickets from backend
      const response = await api.get('/tickets/active');
      setTickets(response.data);

      // Update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to sync tickets with backend:', error);
    }
  }, []);

  return {
    // State
    tickets,
    activeTickets: getActiveTickets(),
    preparingTickets: getPreparingTickets(),
    orderCounter,

    // Methods
    createTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    completeTicket,
    getTicket,
    getActiveTickets,
    getPreparingTickets,
    syncWithBackend,
  };
};

export default useTickets;
