import { Jwt } from "hono/utils/jwt";
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { CreateChatCompletionRequestMessage } from "openai/resources/chat";
import { HTTPException } from "hono/http-exception";

type Request = {
  json: () => Promise<{ messages: CreateChatCompletionRequestMessage[] }>;
};

export async function chat(
  req: Request,
  apiKey: string,
  token: string,
  secret: string
) {
  if (!(await verifyToken(token, secret))) throw new HTTPException(401);

  const openai = new OpenAI({ apiKey });
  const { messages } = await req.json();

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

const verifyToken = async (
  credentials: string,
  secret: string
): Promise<boolean> => {
  const parts = credentials.split(/\s+/);
  let token;
  if (credentials) {
    const parts = credentials.split(/\s+/);
    if (parts.length !== 2) {
      return false;
    } else {
      token = parts[1];
    }
  }

  try {
    await Jwt.verify(token ?? "", secret);
  } catch (e) {
    return false;
  }
  return true;
};
