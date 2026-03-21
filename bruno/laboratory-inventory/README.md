# Bruno Collection: Laboratory Inventory API

This collection provides HTTP request templates for the Laboratory Inventory API.

## Folders

### auth
- `POST /auth/login` - Login
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user

### health
- `GET /health` - Health check

### products
- `GET /products` - List products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (SUPERADMIN)
- `PUT /products/:id` - Update product (SUPERADMIN)
- `DELETE /products/:id` - Delete product (SUPERADMIN)

### users
- `GET /users` - List users (ADMIN/SUPERADMIN)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (SUPERADMIN)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user (SUPERADMIN)
- `POST /users/:id/restore` - Restore deleted user (SUPERADMIN)

### rooms
- `GET /rooms` - List rooms
- `GET /rooms/:id` - Get room by ID
- `POST /rooms` - Create room (SUPERADMIN)
- `PUT /rooms/:id` - Update room (SUPERADMIN)
- `DELETE /rooms/:id` - Delete room (SUPERADMIN)

### inventory
- `GET /inventory` - List inventory stocks (ADMIN/SUPERADMIN)
- `GET /inventory/low-stock` - List low stock items (ADMIN/SUPERADMIN)
- `POST /inventory/restock` - Restock inventory (SUPERADMIN)
- `POST /inventory/adjust` - Adjust inventory (SUPERADMIN)

### orders
- `GET /orders` - List orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order
- `POST /orders/:id/approve` - Approve order (ADMIN/SUPERADMIN)
- `POST /orders/:id/reject` - Reject order (ADMIN/SUPERADMIN)
- `POST /orders/:id/fulfill` - Fulfill order (SUPERADMIN)
- `POST /orders/:id/cancel` - Cancel order

### transactions
- `GET /transactions` - List transactions
- `GET /transactions/:id` - Get transaction by ID
- `POST /transactions` - Create transaction (order items)

### notifications
- `GET /notifications` - List notifications (ADMIN/SUPERADMIN)
- `GET /notifications/unread` - List unread notifications (ADMIN/SUPERADMIN)
- `DELETE /notifications/:id` - Delete notification (SUPERADMIN)
- `DELETE /notifications` - Clear all notifications (SUPERADMIN)

### reports
- `GET /reports/daily` - Daily report (ADMIN/SUPERADMIN)
- `GET /reports/weekly` - Weekly report (ADMIN/SUPERADMIN)
- `GET /reports/monthly` - Monthly report (ADMIN/SUPERADMIN)
- `GET /reports/by-room` - Report by room (ADMIN/SUPERADMIN)
- `GET /reports/by-user` - Report by user (ADMIN/SUPERADMIN)
- `GET /reports/inventory-movements` - Inventory movements (ADMIN/SUPERADMIN)

### dashboard
- `GET /dashboard` - Dashboard data (ADMIN/SUPERADMIN)
- `GET /dashboard/stats` - Dashboard statistics (ADMIN/SUPERADMIN)
- `GET /dashboard/stock-ratio` - Stock ratio items (ADMIN/SUPERADMIN)
- `GET /dashboard/out-of-stock` - Out of stock items (ADMIN/SUPERADMIN)
- `GET /dashboard/stock-summary` - Stock summary by status (ADMIN/SUPERADMIN)

## How to use

1. Open Bruno.
2. Open the `bruno/laboratory-inventory` folder as a collection.
3. Select environment: `local`.
4. Set required values in `environments/local.bru`.
5. Run requests.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:3001` |
| `token` | Bearer auth token | (set after login) |
| `userId` | User ID for requests | |
| `productId` | Product ID | `00000000-0000-0000-0000-000000000001` |
| `roomId` | Room ID | |
| `orderId` | Order ID | |
| `orderItemId` | Order item ID | |
| `transactionId` | Transaction ID | |
| `notificationId` | Notification ID | |
| `restockQty` | Quantity to restock | `10` |
| `adjustQty` | Quantity for adjustment | `5` |
| `adjustReason` | Reason for adjustment | `Stock reconciliation` |
| `registerUsername` | Username for registration | `general.user` |
| `registerPassword` | Password for registration | `TestPassword123!` |
| `registerFullName` | Full name for registration | `General User` |
| `registerNickname` | Nickname for registration | `Gen` |
| `registerRole` | Role for registration | `GENERAL` |

## Role Permissions

- **SUPERADMIN**: Full access to all endpoints
- **ADMIN**: Can view/manage orders, reports, dashboard, and inventory
- **GENERAL**: Can view products, create orders, view own transactions
