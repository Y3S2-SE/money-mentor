// In-memory short-lived ticket store
// In production, replace with Redis using: redisClient.setEx(ticket, 30, userId)

const tickets = new Map();
const TICKET_TTL_MS = 30_000; // 30 seconds

export const createTicket = (userId) => {
  const ticket = crypto.randomUUID();
  
  tickets.set(ticket, {
    userId,
    expiresAt: Date.now() + TICKET_TTL_MS,
  });

  // Auto-cleanup after TTL
  setTimeout(() => tickets.delete(ticket), TICKET_TTL_MS);

  return ticket;
};

export const consumeTicket = (ticket) => {
  const data = tickets.get(ticket);
  
  if (!data) return null;
  
  if (Date.now() > data.expiresAt) {
    tickets.delete(ticket);
    return null;
  }

  tickets.delete(ticket); // ONE-TIME USE — deleted immediately after use
  return data.userId;
};