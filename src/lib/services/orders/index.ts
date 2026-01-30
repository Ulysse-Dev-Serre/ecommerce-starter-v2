// Order Creation - Création de commandes
export * from './order-creation.service';

// Order Management - Consultation et gestion
export * from './order-management.service';

// Order Fulfillment - Gestion des expéditions
export * from './order-fulfillment.service';

// Order Refunds - Désormais géré dans le module payments
// Réexport pour compatibilité avec le code existant
export { updateOrderStatus, processRefund } from '@/lib/services/payments';

// Order Notifications - Envoi d'emails
export * from './order-notifications.service';
