import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },

  async scheduled(event, env, ctx) {
    console.log(`⏰ Cron triggered: ${event.cron} at ${new Date().toISOString()}`);
    const { sendUpcomingReminders } = await import(
      "../app/features/appointments/server/actions/send-reminders.action"
    );
    ctx.waitUntil(
      sendUpcomingReminders()
        .then((result) => {
          console.log(`✅ Reminders complete: ${result.sent} sent, ${result.failed} failed`);
        })
        .catch((error) => {
          console.error("❌ Reminder cron failed:", error);
        })
    );
  },
} satisfies ExportedHandler<Env>;
