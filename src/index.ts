import { Hono } from "hono";
import { logger } from "hono/logger";
import { jwt } from "hono/jwt";
import { chat } from "./openai";
import { cors } from "hono/cors";

type Bindings = {
  OPENAI_API_KEY: string;
  SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("*", (c, next) => {
  const auth = jwt({ secret: c.env.SECRET });
  return auth(c, next);
});

app.use("*", cors());

app.post("/", async (c) => chat(c.req, c.env.OPENAI_API_KEY));

export default app;
