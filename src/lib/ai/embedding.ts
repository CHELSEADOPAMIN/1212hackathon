// src/lib/ai/embedding.ts
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text.replace(/\n/g, ' '), // 清理换行符
  });
  return embedding;
}