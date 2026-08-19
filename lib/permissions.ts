import { UserRole } from "./types";

export const permissions = {
  admin: {
    canManageUsers: true,
    canManageChains: true,
    canSeeAllTickets: true,
    canEditTicketStatus: true,
    canReplyTickets: true,
    canSeeAnalystActivity: true,
  },
  analista: {
    canManageUsers: false,
    canManageChains: false,
    canSeeAllTickets: true,
    canEditTicketStatus: true,
    canReplyTickets: true,
    canSeeAnalystActivity: false,
  },
  cliente: {
    canManageUsers: false,
    canManageChains: false,
    canSeeAllTickets: false,
    canEditTicketStatus: false,
    canReplyTickets: true,
    canSeeAnalystActivity: false,
  },
} satisfies Record<UserRole, Record<string, boolean>>;
