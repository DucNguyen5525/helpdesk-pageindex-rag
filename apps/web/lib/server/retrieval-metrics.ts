// Retrieval quality metrics for the offline eval harness (scripts/eval-retrieval.ts).
// Pure functions over per-query relevance flags so they stay unit-testable without Mongo.
// A "relevance flag" is one boolean per retrieved item, in ranked order (index 0 = top result).

export interface QueryResult {
  // Relevance of each retrieved item, ordered best-first.
  relevance: boolean[];
  // Total number of relevant items that exist for this query (for recall). Defaults to
  // the count of relevant items seen when omitted, which makes recall behave like hit-rate.
  totalRelevant?: number;
}

export interface RetrievalMetrics {
  queries: number;
  hitAtK: number;
  recallAtK: number;
  precisionAtK: number;
  mrr: number;
  k: number;
}

// 1 if any relevant item appears within the first k results, else 0.
export function hitAtK(relevance: boolean[], k: number): number {
  return relevance.slice(0, k).some(Boolean) ? 1 : 0;
}

// Fraction of the query's relevant items that appear within the first k results.
export function recallAtK(relevance: boolean[], k: number, totalRelevant: number): number {
  if (totalRelevant <= 0) return 0;
  const found = relevance.slice(0, k).filter(Boolean).length;
  return Math.min(found, totalRelevant) / totalRelevant;
}

// Fraction of the first k results that are relevant.
export function precisionAtK(relevance: boolean[], k: number): number {
  if (k <= 0) return 0;
  const window = relevance.slice(0, k);
  if (window.length === 0) return 0;
  return window.filter(Boolean).length / window.length;
}

// Reciprocal of the rank of the first relevant item (1-indexed); 0 if none.
export function reciprocalRank(relevance: boolean[]): number {
  const index = relevance.findIndex(Boolean);
  return index === -1 ? 0 : 1 / (index + 1);
}

// Mean of the per-query metrics across the whole eval set.
export function aggregate(results: QueryResult[], k: number): RetrievalMetrics {
  const queries = results.length;
  if (queries === 0) {
    return { queries: 0, hitAtK: 0, recallAtK: 0, precisionAtK: 0, mrr: 0, k };
  }

  let hit = 0;
  let recall = 0;
  let precision = 0;
  let rr = 0;

  for (const result of results) {
    const relevantSeen = result.relevance.filter(Boolean).length;
    const totalRelevant = result.totalRelevant ?? relevantSeen;
    hit += hitAtK(result.relevance, k);
    recall += recallAtK(result.relevance, k, totalRelevant);
    precision += precisionAtK(result.relevance, k);
    rr += reciprocalRank(result.relevance);
  }

  return {
    queries,
    hitAtK: hit / queries,
    recallAtK: recall / queries,
    precisionAtK: precision / queries,
    mrr: rr / queries,
    k
  };
}
