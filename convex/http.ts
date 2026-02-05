import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-create-user",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { data, type } = await req.json();

    if (type === "user.created") {
      const { id, first_name, last_name, email_addresses, phone_numbers } = data;

      const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : "";
      const name = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";
      const phone = phone_numbers && phone_numbers.length > 0 ? phone_numbers[0].phone_number : undefined;

      await ctx.runMutation(api.user.createUser, {
        clerkUserId: id,
        name,
        email,
        phone,
        role: "contact",
      });
    }

    return new Response(JSON.stringify({ message: "Webhook received" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

export default http;
