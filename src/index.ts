import { Context, Hono, Next } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import OpenAI from "openai";
import { ChatCompletionMessage } from "openai/resources/chat";
import { messageReducer } from "./lib/reducer";

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

app.post("/function", async (c) => {
  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const { messages, functions } = await c.req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const chatStream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    stream: true,
    functions: functions,
    function_call: "auto",
  });

  let message = {} as ChatCompletionMessage;
  let isFunctionCallDetected = false;

  return c.streamText(async (stream) => {
    for await (const chunk of chatStream) {
      const choice = chunk.choices[0];
      const finish_reason = choice?.finish_reason;

      // Set the flag when function_call is detected
      if (finish_reason === "function_call" && !isFunctionCallDetected) {
        isFunctionCallDetected = true;
      }

      // Aggregate the message
      message = messageReducer(message, chunk);

      // Write delta_content to the stream only if function_call has not been detected yet
      if (!isFunctionCallDetected) {
        const delta_content = choice?.delta.content ?? "";
        await stream.write(delta_content);
      }
    }

    if (isFunctionCallDetected) {
      stream.write(JSON.stringify(message.function_call));
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
