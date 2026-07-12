import type { PredictionContribution, PredictionResult } from "@helpdesk/shared";

export interface NumericFeature {
  name: string;
  label: string;
  kind: "numeric";
  mean: number;
  std: number;
}

export interface CategoryFeature {
  name: string;
  label: string;
  kind: "category";
  categories: string[];
}

export type FeatureSpec = NumericFeature | CategoryFeature;

export interface PredictionModelArtifact {
  slug: string;
  title: string;
  target: string;
  positiveClass: string;
  datasetSlug: string;
  features: FeatureSpec[];
  expandedNames: string[];
  weights: number[];
  intercept: number;
  metrics: { auroc: number; n: number; positives: number; threshold: number };
}

const DISCLAIMER =
  "Kết quả chỉ mang tính tham khảo nghiên cứu, dựa trên dữ liệu quan sát cỡ mẫu nhỏ; KHÔNG dùng để quyết định điều trị lâm sàng khi chưa được kiểm định.";

export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "" || text.toUpperCase() === "NA") return null;
  const n = Number(text);
  return Number.isNaN(n) ? null : n;
}

export function buildExpandedNames(features: FeatureSpec[]): string[] {
  const names: string[] = [];
  for (const feature of features) {
    if (feature.kind === "numeric") names.push(feature.name);
    else for (const cat of feature.categories) names.push(`${feature.name}=${cat}`);
  }
  return names;
}

// Encode one case (raw field values) into the expanded numeric vector aligned with buildExpandedNames.
export function encodeCase(features: FeatureSpec[], data: Record<string, unknown>): number[] {
  const vector: number[] = [];
  for (const feature of features) {
    if (feature.kind === "numeric") {
      const raw = toNumber(data[feature.name]);
      const value = raw ?? feature.mean; // mean imputation
      vector.push(feature.std > 0 ? (value - feature.mean) / feature.std : 0);
    } else {
      const raw = data[feature.name];
      const label = raw === null || raw === undefined ? "" : String(raw).trim();
      for (const cat of feature.categories) vector.push(label === cat ? 1 : 0);
    }
  }
  return vector;
}

export function predictFromArtifact(
  model: PredictionModelArtifact,
  data: Record<string, unknown>
): PredictionResult {
  const vector = encodeCase(model.features, data);
  let z = model.intercept;
  const rawContribs: PredictionContribution[] = [];
  for (let i = 0; i < model.weights.length; i += 1) {
    const impact = model.weights[i] * vector[i];
    z += impact;
    if (impact !== 0) rawContribs.push({ feature: model.expandedNames[i] ?? `f${i}`, impact });
  }

  const probability = sigmoid(z);
  const threshold = model.metrics.threshold;
  const riskLabel = probability >= threshold * 2 ? "cao" : probability >= threshold ? "trung bình" : "thấp";

  const contributions = rawContribs
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 6)
    .map((c) => ({ feature: c.feature, impact: Number(c.impact.toFixed(4)) }));

  return {
    probability: Number(probability.toFixed(4)),
    riskLabel,
    aboveThreshold: probability >= threshold,
    threshold,
    contributions,
    modelSlug: model.slug,
    disclaimer: DISCLAIMER
  };
}
