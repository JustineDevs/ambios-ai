import { Tiktoken } from "js-tiktoken/lite";
import cl100k_base from "js-tiktoken/ranks/cl100k_base";

let encoder: Tiktoken | null = null;

async function getEncoder(): Promise<Tiktoken> {
  if (!encoder) {
    encoder = new Tiktoken(cl100k_base);
  }
  return encoder;
}

export async function estimateTokenCount(text: string): Promise<number> {
  const enc = await getEncoder();
  return enc.encode(text).length;
}
