CREATE TABLE "action_type" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"emoji" text NOT NULL,
	"kind" text DEFAULT 'event' NOT NULL,
	"unit" text,
	"presets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_value" real,
	"goal_period" text DEFAULT 'day' NOT NULL,
	"goal_value" real,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"started_at" bigint NOT NULL,
	"ended_at" bigint,
	"note" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"action_type_id" text NOT NULL,
	"value" real,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "care_session" ADD CONSTRAINT "care_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_entry" ADD CONSTRAINT "session_entry_session_id_care_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."care_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_entry" ADD CONSTRAINT "session_entry_action_type_id_action_type_id_fk" FOREIGN KEY ("action_type_id") REFERENCES "public"."action_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "care_session_started_at_idx" ON "care_session" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "session_entry_session_idx" ON "session_entry" USING btree ("session_id");