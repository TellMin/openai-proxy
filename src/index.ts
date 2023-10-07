import { Context, Hono, Next } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

type Bindings = {
  OPENAI_API_KEY: string;
  SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("*", cors());

app.use(
  "/*",
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
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
});

app.post("/functions", async (c) => {
  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const { messages, function_call, functions } = await c.req.json();

  console.log(messages, functions, function_call);

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    stream: true,
    functions,
    function_call,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
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
