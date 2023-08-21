import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { CreateChatCompletionRequestMessage } from "openai/resources/chat";

type Request = {
  json: () => Promise<{ messages: CreateChatCompletionRequestMessage[] }>;
};

export async function chat(req: Request, secret: string) {
  const openai = new OpenAI({ apiKey: secret });
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
