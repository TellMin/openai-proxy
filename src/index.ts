import { Context, Hono, Next } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import OpenAI from "openai";

type Bindings = {
  OPENAI_API_KEY: string;
  SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("*", cors());

app.use(
  "/",
  async (
    c: Context<{
      Bindings: Bindings;
    }>,
    next: Next
  ) => jwt({ secret: c.env.SECRET })(c, next)
);

app.post("/", async (c) => {
  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const { messages } = await c.req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const chatStream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
  });

  return c.streamText(async (stream) => {
    for await (const message of chatStream) {
      await stream.write(message.choices[0]?.delta.content ?? "");
    }
  });
});

app.options("*", (c) => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
});

export default app;
