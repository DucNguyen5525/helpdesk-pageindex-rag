import { generateChatCompletion } from "./gemini";
import { normalize } from "./retrieval";

const MAX_EXPANSIONS = 4;
const MAX_EXPANSION_CHARS = 200;

// Retrieval (retrieval.ts) matches on surface tokens, so a paraphrased Vietnamese query
// ("cách gia hạn hợp đồng" vs "làm sao để extend hợp đồng") can miss the right node even
// when the answer exists. Ask the LLM for a few alternative phrasings / keyword sets and
// let the caller retrieve over the union. Fail-open: any error returns [] so retrieval
// falls back to the original-question-only behaviour.
export async function expandQuery(question: string, model?: string): Promise<string[]> {
  if (!question.trim()) return [];

  const prompt = `Bạn nhận một câu hỏi helpdesk. Hãy tạo tối đa ${MAX_EXPANSIONS} cách diễn đạt khác hoặc cụm từ khóa tương đương để giúp tìm kiếm theo từ khóa, giữ nguyên ngôn ngữ và thuật ngữ của người dùng.
- Không lặp lại nguyên văn câu hỏi gốc.
- Mỗi biến thể là một câu/cụm ngắn, độc lập.
- Chỉ trả về một mảng JSON các chuỗi, không giải thích, không thêm lời dẫn.

Câu hỏi: ${question}`;

  try {
    const raw = (await generateChatCompletion([{ role: "user", content: prompt }], {}, model)).trim();
    return parseExpansions(raw, question);
  } catch (error) {
    console.warn("Query expansion failed, using original question only:", error instanceof Error ? error.message : error);
    return [];
  }
}

// The model usually returns a JSON array; tolerate code fences and plain line lists too.
function parseExpansions(raw: string, original: string): string[] {
  const candidates = extractStrings(raw);
  const seen = new Set([normalize(original)]);
  const expansions: string[] = [];

  for (const candidate of candidates) {
    const trimmed = candidate.trim().slice(0, MAX_EXPANSION_CHARS);
    const key = normalize(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    expansions.push(trimmed);
    if (expansions.length >= MAX_EXPANSIONS) break;
  }

  return expansions;
}

function extractStrings(raw: string): string[] {
  const withoutFences = raw.replace(/```(?:json)?/gi, "").trim();
  const start = withoutFences.indexOf("[");
  const end = withoutFences.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(withoutFences.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      // fall through to line-based parsing
    }
  }
  return withoutFences
    .split("\n")
    .map((line) => line.replace(/^\s*[-*\d.)"]+\s*/, "").replace(/[",]+$/, "").trim())
    .filter(Boolean);
}
