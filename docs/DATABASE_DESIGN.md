# Laboratory Inventory - Database Design Document

## Table of Contents
1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Tables](#tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Enums](#enums)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LABORATORY INVENTORY DATABASE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    rooms     │
                              │──────────────│
                              │ id (PK)      │
                              │ name (UQ)    │
                              │ description  │
                              │ created_at   │
                              └──────┬───────┘
                                     │
                                     │ 1:N
                                     │
┌──────────────┐              ┌──────▼───────┐              ┌──────────────┐
│ system_config│              │    users     │              │   products   │
│──────────────│              │──────────────│              │──────────────│
│ key (PK)     │◄─────────────│ id (PK)      │              │ id (PK)      │
│ value        │  updated_by  │ username(UQ) │              │ name         │
│ description  │              │ password     │              │ unit         │
│ category     │              │ full_name    │              │ description  │
│ updated_at   │              │ nickname     │              │ low_stock_   │
│ updated_by   │              │ role (ENUM)  │              │   threshold  │
└──────────────┘              │ room_id (FK) │              │ is_active    │
                              │ is_active    │              │ created_at   │
                              │ created_at   │              └──────┬───────┘
                              │ deleted_at   │                     │
                              └──────┬───────┘                     │
                                     │                             │
              ┌──────────────────────┼──────────────────────┬─────┘
              │                      │                      │
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ inventory_      │    │     orders      │    │ inventory_      │
    │ transactions    │    │─────────────────│    │    stocks       │
    │─────────────────│    │ id (PK)         │    │─────────────────│
    │ id (PK)         │    │ order_number(UQ)│    │ product_id(PK,FK)│
    │ user_id (FK)    │    │ user_id (FK)    │    │ quantity        │
    │ room_id (FK)    │    │ room_id (FK)    │    │ updated_at      │
    │ note            │    │ status (ENUM)   │    └─────────────────┘
    │ created_at      │    │ note            │
    └────────┬────────┘    │ admin_note      │
             │             │ reviewed_by(FK) │
             │             │ reviewed_at     │
             │             │ fulfilled_by(FK)│
             │             │ fulfilled_at    │
             │             │ created_at      │
             │             │ updated_at      │
             │             └────────┬────────┘
             │                      │
             ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐
    │ inventory_      │    │  order_items    │
    │ transaction_    │    │─────────────────│
    │ items           │    │ id (PK)         │
    │─────────────────│    │ order_id (FK)   │
    │ id (PK)         │    │ product_id (FK) │
    │ transaction_id  │    │ quantity        │
    │ (FK)            │    │ fulfilled_      │
    │ product_id (FK) │    │   quantity      │
    │ quantity        │    │ note            │
    └─────────────────┘    └─────────────────┘
             │                      │
             │                      │
             ▼                      │
    ┌─────────────────┐             │
    │ inventory_      │◄────────────┘
    │ movements       │
    │─────────────────│
    │ id (PK)         │
    │ product_id (FK) │
    │ quantity        │
    │ movement_type   │
    │ reference_      │
    │   transaction   │
    │ created_by (FK) │
    │ created_at      │
    └─────────────────┘


                    ┌─────────────────┐
                    │ notifications   │
                    │─────────────────│
                    │ id (PK)         │
                    │ type            │
                    │ title           │
                    │ message         │
                    │ data (JSON)     │
                    │ is_read         │
                    │ target_roles    │
                    │ product_id (FK) │
                    │ order_id (FK)   │
                    │ created_at      │
                    └─────────────────┘
```

---

## Tables

### 1. `rooms`
Stores information about laboratory rooms/locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Room name |
| `description` | TEXT | NULLABLE | Room description |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### 2. `users`
Stores user accounts with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Login username |
| `password` | VARCHAR(255) | NOT NULL | Hashed password (argon2) |
| `full_name` | VARCHAR(150) | NOT NULL | User's full name |
| `nickname` | VARCHAR(100) | NULLABLE | User's nickname |
| `role` | ENUM | NOT NULL | User role: SUPERADMIN, ADMIN, GENERAL |
| `room_id` | UUID | FK → rooms.id | Assigned room |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes:**
- `idx_users_room` on `room_id`
- `idx_users_role` on `role`
- `idx_users_username` on `username`
- `idx_users_deleted_at` on `deleted_at`

---

### 3. `products`
Stores product/item catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `name` | VARCHAR(200) | NOT NULL | Product name |
| `unit` | VARCHAR(50) | NOT NULL | Unit of measure (pcs, ml, g, etc.) |
| `description` | TEXT | NULLABLE | Product description |
| `low_stock_threshold` | INTEGER | DEFAULT 0 | Threshold for low stock alert |
| `is_active` | BOOLEAN | DEFAULT true | Product availability |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### 4. `inventory_stocks`
Stores current stock levels for each product.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `product_id` | UUID | PK, FK → products.id | Product reference |
| `quantity` | INTEGER | NOT NULL | Current stock quantity |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationship:** One-to-One with products (each product has one stock record)

---

### 5. `orders`
Stores order information from users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `order_number` | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable order number |
| `user_id` | UUID | NOT NULL, FK → users.id | User who placed order |
| `room_id` | UUID | NOT NULL, FK → rooms.id | Delivery room |
| `status` | ENUM | NOT NULL, DEFAULT 'PENDING' | Order status |
| `note` | TEXT | NULLABLE | User's note |
| `admin_note` | TEXT | NULLABLE | Admin's note |
| `reviewed_by` | UUID | FK → users.id | Admin who reviewed |
| `reviewed_at` | TIMESTAMP | NULLABLE | Review timestamp |
| `fulfilled_by` | UUID | FK → users.id | Admin who fulfilled |
| `fulfilled_at` | TIMESTAMP | NULLABLE | Fulfillment timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_orders_user` on `user_id`
- `idx_orders_room` on `room_id`
- `idx_orders_status` on `status`
- `idx_orders_created_at` on `created_at`

---

### 6. `order_items`
Stores individual items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `order_id` | UUID | NOT NULL, FK → orders.id (CASCADE) | Parent order |
| `product_id` | UUID | NOT NULL, FK → products.id | Product reference |
| `quantity` | INTEGER | NOT NULL | Requested quantity |
| `fulfilled_quantity` | INTEGER | DEFAULT 0 | Actually provided quantity |
| `note` | TEXT | NULLABLE | Item-specific note |

**Indexes:**
- `idx_order_items_order` on `order_id`
- `idx_order_items_product` on `product_id`

---

### 7. `inventory_transactions`
Legacy transaction table for direct inventory operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | UUID | NOT NULL, FK → users.id | User who made transaction |
| `room_id` | UUID | NOT NULL, FK → rooms.id | Target room |
| `note` | TEXT | NULLABLE | Transaction note |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_tx_user` on `user_id`
- `idx_tx_room` on `room_id`

---

### 8. `inventory_transaction_items`
Items within a legacy transaction.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `transaction_id` | UUID | NOT NULL, FK → inventory_transactions.id (CASCADE) | Parent transaction |
| `product_id` | UUID | NOT NULL, FK → products.id | Product reference |
| `quantity` | INTEGER | NOT NULL | Quantity moved |

**Indexes:**
- `idx_tx_items_tx` on `transaction_id`

---

### 9. `inventory_movements`
Audit trail for all inventory changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `product_id` | UUID | NOT NULL, FK → products.id | Product reference |
| `quantity` | INTEGER | NOT NULL | Quantity moved |
| `movement_type` | VARCHAR(20) | NOT NULL | IN, OUT, ADJUST |
| `reference_transaction` | UUID | NULLABLE | Reference to order/transaction |
| `created_by` | UUID | FK → users.id | User who made change |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_movements_product` on `product_id`

---

### 10. `notifications`
System notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| `type` | VARCHAR(50) | NOT NULL | Notification type |
| `title` | VARCHAR(255) | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Detailed message |
| `data` | TEXT | NULLABLE | JSON additional data |
| `is_read` | BOOLEAN | DEFAULT false | Read status |
| `target_roles` | VARCHAR(100) | NULLABLE | Comma-separated roles |
| `product_id` | UUID | FK → products.id | Related product |
| `order_id` | UUID | FK → orders.id | Related order |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### 11. `system_config`
System-wide configuration settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(100) | PK | Configuration key |
| `value` | TEXT | NOT NULL | Configuration value |
| `description` | TEXT | NULLABLE | Description |
| `category` | VARCHAR(50) | DEFAULT 'general' | Config category |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |
| `updated_by` | UUID | FK → users.id | Who updated |

---

## Relationships

### Entity Relationships

| From Table | To Table | Relationship | Foreign Key |
|------------|----------|--------------|-------------|
| `users` | `rooms` | N:1 | `users.room_id` → `rooms.id` |
| `orders` | `users` | N:1 | `orders.user_id` → `users.id` |
| `orders` | `rooms` | N:1 | `orders.room_id` → `rooms.id` |
| `orders` | `users` (reviewer) | N:1 | `orders.reviewed_by` → `users.id` |
| `orders` | `users` (fulfiller) | N:1 | `orders.fulfilled_by` → `users.id` |
| `order_items` | `orders` | N:1 | `order_items.order_id` → `orders.id` |
| `order_items` | `products` | N:1 | `order_items.product_id` → `products.id` |
| `inventory_stocks` | `products` | 1:1 | `inventory_stocks.product_id` → `products.id` |
| `inventory_transactions` | `users` | N:1 | `inventory_transactions.user_id` → `users.id` |
| `inventory_transactions` | `rooms` | N:1 | `inventory_transactions.room_id` → `rooms.id` |
| `inventory_transaction_items` | `inventory_transactions` | N:1 | `inventory_transaction_items.transaction_id` → `inventory_transactions.id` |
| `inventory_transaction_items` | `products` | N:1 | `inventory_transaction_items.product_id` → `products.id` |
| `inventory_movements` | `products` | N:1 | `inventory_movements.product_id` → `products.id` |
| `inventory_movements` | `users` | N:1 | `inventory_movements.created_by` → `users.id` |
| `notifications` | `products` | N:1 | `notifications.product_id` → `products.id` |
| `notifications` | `orders` | N:1 | `notifications.order_id` → `orders.id` |
| `system_config` | `users` | N:1 | `system_config.updated_by` → `users.id` |

### Cascade Rules

| Table | On Delete |
|-------|-----------|
| `order_items` | CASCADE (when order deleted) |
| `inventory_transaction_items` | CASCADE (when transaction deleted) |

---

## Enums

### `user_role`
```sql
CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'GENERAL');
```

| Value | Description |
|-------|-------------|
| `SUPERADMIN` | Full system access, can manage all |
| `ADMIN` | Can view stock, manage orders |
| `GENERAL` | Can place orders, view own data |

### `order_status`
```sql
CREATE TYPE order_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');
```

| Value | Description |
|-------|-------------|
| `PENDING` | Order placed, awaiting review |
| `APPROVED` | Approved by admin/superadmin |
| `REJECTED` | Rejected by admin/superadmin |
| `FULFILLED` | Items delivered to user |
| `CANCELLED` | Cancelled by user or admin |

---

## Default Configuration Values

| Key | Default | Category |
|-----|---------|----------|
| `LOW_STOCK_THRESHOLD` | `10` | inventory |
| `ENABLE_LOW_STOCK_ALERTS` | `true` | inventory |
| `LOW_STOCK_ALERT_ROLES` | `SUPERADMIN,ADMIN` | notification |
| `AUTO_DEDUCT_STOCK_ON_ORDER` | `true` | order |
| `NEW_ORDER_ALERT_ROLES` | `SUPERADMIN,ADMIN` | notification |
| `ORDER_STATUS_ALERT_ROLES` | `SUPERADMIN,ADMIN` | notification |
| `NOTIFICATION_RETENTION_DAYS` | `30` | notification |

---

## Notification Types

| Type | Description | Target |
|------|-------------|--------|
| `LOW_STOCK` | Product stock below threshold | SUPERADMIN, ADMIN |
| `NEW_ORDER` | New order placed | SUPERADMIN, ADMIN |
| `ORDER_STATUS` | Order status changed | SUPERADMIN, ADMIN |

---

## Movement Types

| Type | Description |
|------|-------------|
| `IN` | Stock added (restock) |
| `OUT` | Stock removed (order fulfillment) |
| `ADJUST` | Manual stock adjustment |

---

## Data Flow

### Order Flow (with auto-deduct enabled)
```
1. User places order → orders + order_items created
2. Stock automatically deducted → inventory_stocks updated
3. Movement recorded → inventory_movements (OUT)
4. Order marked as FULFILLED
5. Low stock check → notifications created if needed
```

### Order Flow (with manual fulfillment)
```
1. User places order → orders + order_items created (status: PENDING)
2. Admin approves → status: APPROVED
3. Superadmin fulfills → stock deducted, status: FULFILLED
4. Movement recorded → inventory_movements (OUT)
5. Low stock check → notifications created if needed
```
