import { Hono } from "hono";
import { logger } from "hono/logger";
import OpenAI from "openai";

type Bindings = {
  OPENAI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.get("/chat", async (c) => {
  const openai = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Hello, how are you?",
      },
    ],
    model: "gpt-3.5-turbo",
  });

  return c.json(completion.choices);
});

export default app;
