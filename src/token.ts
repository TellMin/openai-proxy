import { Jwt } from "hono/utils/jwt/index";

export const getToken = async (secret: string) => {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 10,
  };
  return { token: await Jwt.sign(payload, secret) };
};
