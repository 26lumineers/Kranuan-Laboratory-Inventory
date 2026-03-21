# Laboratory Inventory

### user

- general user that have difference type of room that they are responsible
- superadmin that do all thing such as CRUD products
- admin thay only make invoice items for superadmin manually insert product at a times.

## general users

    - chemical clinic
    - hematology
    - micro biology
    - bloodbank
    - immunology
    - micro scopic
    - sub stocks

### general users scenarios.

    - login
    - input items that are available in stocks ,but they didn't know how many items can order, just update item to its lab's room
    - user contain fullname ,nickname, role, created date and soft-delete
    - optional make note for each order

## admin user scenarios.
    - view stocks and update the stock
    - create listing item that will be in the stock every 2 weeks, once items are delivery to lab, admin will update the actual stock
    - can do all the things like general but she can insert the item into stocks.

## superadmin scenarios.

    - crud stocks
    - crud users, inactive also
    - view all transactions who are ordering item from inventory to its room
    - superier admin role
    - create item as a form for admin can insert item to inventory

# Pages

- login
- general users ordering items by listing items how many they want, do it like number make default are 1 and have increment,decrease button for each and hit submit form.
-

## items inside inventory page

show - item name - item unit - how many still available, what number that are trigger the notify that it will notice that item are getting run out.

# Feature

- notify to superadmin and admin to know that items are going the run out of item,by superadmin can configure it one by one.
- daily,monthly,weekly report that can filter out by its room or by who

# Frontend

- use nextjs with responsive design for mobile as well
- validation use Eden/ts

# Backend

- use Elysia Bun Ts with Eden and drizzle orm
- use argon2 for hash password
## Monorepo Conventions

- Import shared modules using workspace names: `Laboratory Inventory`

##
