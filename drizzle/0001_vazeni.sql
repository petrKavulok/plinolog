ALTER TABLE "action_type" ADD COLUMN "weighing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "session_entry" ADD COLUMN "weight_before" real;--> statement-breakpoint
ALTER TABLE "session_entry" ADD COLUMN "weight_after" real;