import { describe, expect, it } from "vitest";
import { rankSimilarQuestions } from "../similar-questions";
import type { HelpdeskQnaPair } from "../repository";

function pair(id: string, question: string, answer = "answer"): HelpdeskQnaPair {
  return { conversationId: `c-${id}`, messageId: `m-${id}`, question, answer, createdAt: new Date("2026-01-01T00:00:00Z") };
}

const corpus: HelpdeskQnaPair[] = [
  pair("1", "Làm sao để cài đặt lại máy P8?"),
  pair("2", "Cách khắc phục lỗi kết nối mạng wifi"),
  pair("3", "Hướng dẫn thay đổi mật khẩu tài khoản")
];

describe("rankSimilarQuestions", () => {
  it("ranks the question sharing the most terms first", () => {
    const results = rankSimilarQuestions("cài đặt lại máy P8 như thế nào", corpus);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].question).toContain("P8");
  });

  it("matches ignore Vietnamese diacritics (shared tokenizer)", () => {
    const results = rankSimilarQuestions("khac phuc loi mang", corpus);
    expect(results[0].question).toContain("kết nối mạng");
  });

  it("returns nothing when no query term overlaps the corpus", () => {
    expect(rankSimilarQuestions("xyz khong lien quan gi", corpus)).toEqual([]);
  });

  it("respects the limit", () => {
    const results = rankSimilarQuestions("máy mạng mật khẩu", corpus, 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("truncates a long answer into a preview", () => {
    const long = pair("4", "câu hỏi dài", "x".repeat(500));
    const results = rankSimilarQuestions("câu hỏi dài", [long]);
    expect(results[0].answerPreview.endsWith("…")).toBe(true);
    expect(results[0].answerPreview.length).toBeLessThan(500);
  });
});
