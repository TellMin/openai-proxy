import { Context, Hono, Next } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

type Bindings = {
  OPENAI_API_KEY: string;
  SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("*", cors());

app.post(
  "/",

  async (
    c: Context<{
      Bindings: Bindings;
    }>,
    next: Next
  ) => {
    return jwt({ secret: c.env.SECRET })(c, next);
  },

  async (c) => {
    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    const { messages } = await c.req.json();

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      stream: true,
      messages,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  }
);

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
