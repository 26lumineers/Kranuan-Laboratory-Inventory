-refactor project structure from claude.md file
-use jwt expired 2hrs for authorization request,in middleware directory each role can access by my rule
 general user can order items but cant view stock
 admin can view stock and acces all general user can
 superadmin crud stock and can all access control

 - make configuration from yaml file etc database or others credentials
- create table for users that have soft delete
-create order table for user can order the lab stuff
- merge docker compose file once for frontend stuff , backend will include all backend service ad db and pgadmin as well
- each order that every user order item it will deduction on inventory
- each order is trigger when general user are order item it will automatically update stock and warning to superadmin admin that shown on dashboard page
- plan design database table and all relations