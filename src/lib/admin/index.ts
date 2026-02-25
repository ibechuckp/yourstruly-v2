// Admin library barrel exports

// Auth
export { requireAdmin, getCurrentAdmin, requirePermission, isAdmin, checkPermission } from './auth';

// Audit - async functions only (server actions)
export { 
  logAdminAction, 
  getAuditLogs, 
  getEntityAuditLogs, 
  getAuditStats 
} from './audit';

// Audit actions constants
export { AuditActions, type AuditAction } from './audit-actions';
