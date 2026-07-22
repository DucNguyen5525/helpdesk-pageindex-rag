import { getRecentHelpdeskQna, type HelpdeskQnaPair } from "./repository";
import { tokenize } from "./retrieval";

const CORPUS_LIMIT = 500;
const DEFAULT_LIMIT = 5;
const ANSWER_PREVIEW_CHARS = 220;
// BM25 tuning: k1 controls term-frequency saturation, b controls length normalization.
const K1 = 1.5;
const B = 0.75;

export interface SimilarQuestion {
  conversationId: string;
  messageId: string;
  question: string;
  answerPreview: string;
  score: number;
  createdAt: string;
}

export interface FindSimilarQuestionsInput {
  helpdeskSlug: string;
  question: string;
  limit?: number;
  // Minimum BM25 score to keep. Scored matches are always > 0 (share ≥1 query term);
  // raise this to trade recall for precision. Defaults to keeping every positive match.
  minScore?: number;
}

// Lexical BM25 over past answered questions for a helpdesk. Reuses retrieval's Vietnamese
// diacritic-stripping tokenizer so scoring is consistent with document retrieval. No
// embeddings — keyword overlap only, so paraphrases that share no terms will not match.
export async function findSimilarQuestions(input: FindSimilarQuestionsInput): Promise<SimilarQuestion[]> {
  if (tokenize(input.question).length === 0) return [];
  const corpus = await getRecentHelpdeskQna(input.helpdeskSlug, CORPUS_LIMIT);
  return rankSimilarQuestions(input.question, corpus, input.limit, input.minScore);
}

// Pure BM25 ranking, split out from the DB fetch so it can be unit-tested directly.
export function rankSimilarQuestions(
  question: string,
  corpus: HelpdeskQnaPair[],
  limit = DEFAULT_LIMIT,
  minScore = 0
): SimilarQuestion[] {
  const queryTerms = tokenize(question);
  if (queryTerms.length === 0 || corpus.length === 0) return [];

  const docs = corpus.map((pair) => tokenize(pair.question));
  const avgdl = docs.reduce((sum, terms) => sum + terms.length, 0) / docs.length || 1;
  const idf = buildIdf(queryTerms, docs);

  return corpus
    .map((pair, index) => ({ pair, score: bm25(queryTerms, docs[index], avgdl, idf) }))
    .filter((item) => item.score > 0 && item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ pair, score }) => toSimilarQuestion(pair, score));
}

function buildIdf(queryTerms: string[], docs: string[][]): Map<string, number> {
  const total = docs.length;
  const idf = new Map<string, number>();
  for (const term of new Set(queryTerms)) {
    let df = 0;
    for (const terms of docs) {
      if (terms.includes(term)) df += 1;
    }
    // BM25 idf; the +1 keeps it positive even for terms present in every document.
    idf.set(term, Math.log(1 + (total - df + 0.5) / (df + 0.5)));
  }
  return idf;
}

function bm25(queryTerms: string[], docTerms: string[], avgdl: number, idf: Map<string, number>): number {
  if (docTerms.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const term of docTerms) {
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }

  let score = 0;
  for (const term of queryTerms) {
    const tf = frequencies.get(term);
    if (!tf) continue;
    const weight = idf.get(term) ?? 0;
    const numerator = tf * (K1 + 1);
    const denominator = tf + K1 * (1 - B + B * (docTerms.length / avgdl));
    score += weight * (numerator / denominator);
  }
  return score;
}

function toSimilarQuestion(pair: HelpdeskQnaPair, score: number): SimilarQuestion {
  const answer = pair.answer.trim();
  const answerPreview = answer.length > ANSWER_PREVIEW_CHARS ? `${answer.slice(0, ANSWER_PREVIEW_CHARS)}…` : answer;
  return {
    conversationId: pair.conversationId,
    messageId: pair.messageId,
    question: pair.question,
    answerPreview,
    score,
    createdAt: pair.createdAt.toISOString()
  };
}
