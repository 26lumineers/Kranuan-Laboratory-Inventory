-refactor project structure from claude.md file
-use jwt expired 2hrs for authorization request,in middleware directory each role can access by my rule
general user can order items but cant view stock
admin can view stock and acces all general user can
superadmin crud stock and can all access control

-   make configuration from yaml file etc database or others credentials
-   create table for users that have soft delete, mean deleteAt date column which known as this user are getting removed
    -create order table for user can order the lab stuff,do it first i will edit it later;
-   merge docker compose file once for frontend stuff , backend will include all backend service ad db and pgadmin as well
-   each order that every user order item it will deduction on inventory
-   each order is trigger when general user are order item it will automatically update stock and warning to superadmin admin that shown on dashboard page base on configuration table call something you name it for me
-   plan design database table and all relations
-   in jwt payload i need to verify it from payload which is role for each request that going to verify
