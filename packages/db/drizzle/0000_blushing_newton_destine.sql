DO $$ BEGIN
 CREATE TYPE "invoice_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUCCESS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_category" AS ENUM('CHEMICAL_CLINIC', 'IMMUNOLOGY', 'HEMATOLOGY', 'MICROSCOPIC', 'BLOOD_BANK', 'MICRO_BIOLOGY', 'SUB_STOCKS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('SUPERADMIN', 'ADMIN', 'GENERAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"movement_type" varchar(20) NOT NULL,
	"reference_transaction" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_stocks" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"description" text,
	"status" "invoice_status" DEFAULT 'PENDING' NOT NULL,
	"created_by" uuid NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"is_read" boolean DEFAULT false,
	"target_roles" varchar(100),
	"product_id" uuid,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0,
	"note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"admin_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"fulfilled_by" uuid,
	"fulfilled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"category" "product_category" NOT NULL,
	"description" text,
	"low_stock_threshold" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'general',
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"nickname" varchar(100),
	"role" "user_role" NOT NULL,
	"room_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_product" ON "inventory_movements" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tx_items_tx" ON "inventory_transaction_items" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tx_user" ON "inventory_transactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tx_room" ON "inventory_transactions" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice" ON "invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoice_items_product" ON "invoice_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_created_by" ON "invoices" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invoices_created_at" ON "invoices" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_product" ON "order_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_room" ON "orders" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_room" ON "users" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_username" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deleted_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_transaction_items" ADD CONSTRAINT "inventory_transaction_items_transaction_id_inventory_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "inventory_transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_transaction_items" ADD CONSTRAINT "inventory_transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfilled_by_users_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
