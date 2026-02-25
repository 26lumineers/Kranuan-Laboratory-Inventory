# Bruno Collection: Laboratory Inventory API

This collection provides HTTP request templates for the inventory endpoints:

- `GET /health`
- `GET /inventory`
- `GET /inventory/low-stock`
- `POST /inventory/restock`
- `POST /inventory/adjust`

## How to use

1. Open Bruno.
2. Open the `bruno/laboratory-inventory` folder as a collection.
3. Select environment: `local`.
4. Set `userId` and `productId` values in `environments/local.bru`.
5. Run requests.

## Defaults

- `baseUrl`: `http://localhost:3001`
- `restockQty`: `10`
- `adjustQty`: `5`
- `adjustReason`: `Stock reconciliation`
