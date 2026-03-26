# Laboratory Inventory

### user

-   general user that have difference type of room that they are responsible
-   superadmin that do all thing such as CRUD products
-   admin thay only make invoice items for superadmin manually insert product at a times.

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

-   login
-   general users ordering items by listing items how many they want, do it like number make default are 1 and have increment,decrease button for each and hit submit form.
-

## items inside inventory page

show - item name - item unit - how many still available, what number that are trigger the notify that it will notice that item are getting run out.

# Feature

-   notify to superadmin and admin to know that items are going the run out of item,by superadmin can configure it one by one.
-   daily,monthly,weekly report that can filter out by its room or by who

# Frontend

-   use nextjs with responsive design for mobile as well
-   validation use Eden/ts

# Backend

-   use Elysia Bun Ts with Eden and drizzle orm
-   use argon2 for hash password

## Monorepo Conventions

-   Import shared modules using workspace names: `Laboratory Inventory`

##

Add invoice page i want all of

-   /apps/invoice/list -> want to view invoice running number Name who create the form, description if i too long just truncate it, date in thai format ,status()
-   /apps/invoice/preview
-   /apps/invoice/add
-   /apps/invoice/edit
    all of it, just apply it to my domain

Page:/apps/invoice/list
card section for filter status which is contain : pending,reject
column :i want to view invoice running number Name who create the form, description if i too long just truncate it, date in thai format ,status, action(edit-> can't edit after status is sucess or disable that button,view -> navigate to /apps/invoice/preview page ,remove->can't remove if not superadmin role)

Page:/apps/invoice/preview
on top right will be the same but remove + create button.
detail invoice section : remove Order ID,Shipment ID,Bank Name:
Bank Of America
Account Number:
1234567890
SWIFT Code:
S58K796
IBAN:
L5698445485
Country:
United States

and the list detail show No.,items,Qty,Amount by this consequent
after list detail it will shown summary

Page:

-   remove element <div class="panel mb-5"><label for="currency">Currency</label><select id="currency" name="currency" class="form-select"><option>USD - US Dollar</option><option>GBP - British Pound</option><option>IDR - Indonesian Rupiah</option><option>INR - Indian Rupee</option><option>BRL - Brazilian Real</option><option>EUR - Germany (Euro)</option><option>TRY - Turkish Lira</option></select><div class="mt-4"><div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label for="tax">Tax(%) </label><input id="tax" type="number" name="tax" class="form-input" placeholder="Tax" value="0"></div><div><label for="discount">Discount(%) </label><input id="discount" type="number" name="discount" class="form-input" placeholder="Discount" value="0"></div></div></div><div class="mt-4"><div><label for="shipping-charge">Shipping Charge($) </label><input id="shipping-charge" type="number" name="shipping-charge" class="form-input" placeholder="Shipping Charge" value="0"></div></div><div class="mt-4"><label for="payment-method">Accept Payment Via</label><select id="payment-method" name="payment-method" class="form-select"><option value=" ">Select Payment</option><option value="bank">Bank Account</option><option value="paypal">Paypal</option><option value="upi">UPI Transfer</option></select></div></div>
-   on submit section just let save button left, other remove
-   everything keep it the same,
-   items list will show up as products table so i can add quantity

i think you need to design new table for support this feature
