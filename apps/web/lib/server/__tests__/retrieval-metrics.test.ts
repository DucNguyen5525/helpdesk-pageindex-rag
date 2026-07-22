import { describe, expect, it } from "vitest";
import { aggregate, hitAtK, precisionAtK, recallAtK, reciprocalRank } from "../retrieval-metrics";

describe("retrieval-metrics", () => {
  it("hitAtK is 1 when a relevant item is within k, else 0", () => {
    expect(hitAtK([false, true, false], 3)).toBe(1);
    expect(hitAtK([false, true, false], 1)).toBe(0);
    expect(hitAtK([false, false], 5)).toBe(0);
  });

  it("recallAtK divides relevant-in-window by total relevant", () => {
    expect(recallAtK([true, false, true, false], 4, 3)).toBeCloseTo(2 / 3);
    expect(recallAtK([true, false, true, false], 2, 3)).toBeCloseTo(1 / 3);
    expect(recallAtK([false], 3, 0)).toBe(0);
  });

  it("precisionAtK divides relevant by the window size", () => {
    expect(precisionAtK([true, false, true, false], 4)).toBeCloseTo(0.5);
    expect(precisionAtK([true, true], 2)).toBe(1);
    expect(precisionAtK([], 3)).toBe(0);
  });

  it("reciprocalRank uses the rank of the first relevant item", () => {
    expect(reciprocalRank([false, true, true])).toBeCloseTo(1 / 2);
    expect(reciprocalRank([true])).toBe(1);
    expect(reciprocalRank([false, false])).toBe(0);
  });

  it("aggregate averages each metric across queries", () => {
    const metrics = aggregate(
      [
        { relevance: [true, false], totalRelevant: 1 },
        { relevance: [false, false], totalRelevant: 1 }
      ],
      2
    );
    expect(metrics.queries).toBe(2);
    expect(metrics.hitAtK).toBeCloseTo(0.5);
    expect(metrics.recallAtK).toBeCloseTo(0.5);
    expect(metrics.mrr).toBeCloseTo(0.5);
  });

  it("returns zeroed metrics for an empty eval set", () => {
    expect(aggregate([], 5)).toEqual({ queries: 0, hitAtK: 0, recallAtK: 0, precisionAtK: 0, mrr: 0, k: 5 });
  });
});
