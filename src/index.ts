import { Hono } from "hono";
import { logger } from "hono/logger";
import { jwt } from "hono/jwt";
import { getToken } from "./token";

type Bindings = {
  OPENAI_API_KEY: string;
  SECRET: string;
};
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

app.use("/token/verify/*", (c, next) => {
  const auth = jwt({ secret: c.env.SECRET });
  return auth(c, next);
});

app.get("/", (c) => c.text("Hello World!"));

app.get("/token", async (c) => c.json(await getToken(c.env.SECRET)));

app.get("/token/verify", (c) => c.text("Verified!"));

export default app;
