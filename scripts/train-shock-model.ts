import { getDatasetBySlug, getDatasetRows, upsertPredictionModel } from "../apps/web/lib/server/repository";
import {
  buildExpandedNames,
  encodeCase,
  sigmoid,
  type CategoryFeature,
  type FeatureSpec,
  type NumericFeature,
  type PredictionModelArtifact
} from "../apps/web/lib/server/prediction";

const DATASET_SLUG = "dengue-baseline";
const TARGET = "shock";
const POSITIVE = "Yes";
const MODEL_SLUG = "shock-baseline";

// Enrolment-time predictors only (no post-baseline / outcome leakage).
const NUMERIC = ["age", "wt", "day_ill", "temp", "pulse", "sys_bp", "liver", "hct_bsl", "plt_bsl"];
const CATEGORY = ["sex", "his_tired", "his_vomit", "ttest", "mucosal_bleed", "abdominal_pain", "serotype2", "serology"];

type Row = Record<string, unknown>;

function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (t === "" || t.toUpperCase() === "NA") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

function buildFeatureSpec(rows: Row[]): FeatureSpec[] {
  const specs: FeatureSpec[] = [];
  for (const name of NUMERIC) {
    const vals = rows.map((r) => num(r[name])).filter((v): v is number => v !== null);
    const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length || 1);
    const std = Math.sqrt(variance) || 1;
    specs.push({ name, label: name, kind: "numeric", mean, std } satisfies NumericFeature);
  }
  for (const name of CATEGORY) {
    const cats = new Set<string>();
    for (const r of rows) {
      const v = r[name];
      if (v === null || v === undefined) continue;
      const t = String(v).trim();
      if (t !== "" && t.toUpperCase() !== "NA") cats.add(t);
    }
    specs.push({ name, label: name, kind: "category", categories: [...cats].sort() } satisfies CategoryFeature);
  }
  return specs;
}

function trainLogistic(X: number[][], y: number[], dim: number, iters = 800, lr = 0.3, l2 = 1e-3) {
  const w = new Array<number>(dim).fill(0);
  let b = 0;
  const n = X.length;
  for (let it = 0; it < iters; it += 1) {
    const gw = new Array<number>(dim).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i += 1) {
      let z = b;
      const xi = X[i];
      for (let j = 0; j < dim; j += 1) z += w[j] * xi[j];
      const err = sigmoid(z) - y[i];
      for (let j = 0; j < dim; j += 1) gw[j] += err * xi[j];
      gb += err;
    }
    for (let j = 0; j < dim; j += 1) w[j] -= lr * (gw[j] / n + l2 * w[j]);
    b -= lr * (gb / n);
  }
  return { w, b };
}

function predictScore(w: number[], b: number, x: number[]): number {
  let z = b;
  for (let j = 0; j < w.length; j += 1) z += w[j] * x[j];
  return sigmoid(z);
}

function auroc(scores: number[], labels: number[]): number {
  const pairs = scores.map((s, i) => ({ s, y: labels[i] })).sort((a, b) => a.s - b.s);
  const ranks = new Array<number>(pairs.length);
  let i = 0;
  while (i < pairs.length) {
    let j = i;
    while (j + 1 < pairs.length && pairs[j + 1].s === pairs[i].s) j += 1;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) ranks[k] = avg;
    i = j + 1;
  }
  let sumPosRanks = 0;
  let pos = 0;
  for (let k = 0; k < pairs.length; k += 1) {
    if (pairs[k].y === 1) {
      sumPosRanks += ranks[k];
      pos += 1;
    }
  }
  const neg = pairs.length - pos;
  if (pos === 0 || neg === 0) return 0.5;
  return (sumPosRanks - (pos * (pos + 1)) / 2) / (pos * neg);
}

function youdenThreshold(scores: number[], labels: number[]): number {
  const pos = labels.filter((y) => y === 1).length;
  const neg = labels.length - pos;
  if (pos === 0 || neg === 0) return 0.5;
  const candidates = [...new Set(scores)].sort((a, b) => a - b);
  let best = 0.5;
  let bestJ = -Infinity;
  for (const t of candidates) {
    let tp = 0;
    let fp = 0;
    for (let i = 0; i < scores.length; i += 1) {
      if (scores[i] >= t) {
        if (labels[i] === 1) tp += 1;
        else fp += 1;
      }
    }
    const j = tp / pos - fp / neg;
    if (j > bestJ) {
      bestJ = j;
      best = t;
    }
  }
  return Number(best.toFixed(4));
}

function stratifiedFolds(labels: number[], k: number): number[] {
  const foldOf = new Array<number>(labels.length);
  let posC = 0;
  let negC = 0;
  for (let i = 0; i < labels.length; i += 1) {
    if (labels[i] === 1) foldOf[i] = posC++ % k;
    else foldOf[i] = negC++ % k;
  }
  return foldOf;
}

async function main() {
  const dataset = await getDatasetBySlug(DATASET_SLUG);
  if (!dataset) throw new Error(`dataset '${DATASET_SLUG}' not found`);
  const allRows = (await getDatasetRows(dataset._id)).map((r) => r.data as Row);

  const rows = allRows.filter((r) => {
    const t = r[TARGET];
    return t !== null && t !== undefined && String(t).trim() !== "" && String(t).trim().toUpperCase() !== "NA";
  });

  const features = buildFeatureSpec(rows);
  const expandedNames = buildExpandedNames(features);
  const dim = expandedNames.length;

  const X = rows.map((r) => encodeCase(features, r));
  const y = rows.map((r) => (String(r[TARGET]).trim() === POSITIVE ? 1 : 0));
  const positives = y.reduce((s, v) => s + v, 0);

  // 5-fold stratified CV -> out-of-fold scores
  const k = 5;
  const foldOf = stratifiedFolds(y, k);
  const oof = new Array<number>(rows.length).fill(0);
  for (let f = 0; f < k; f += 1) {
    const trX: number[][] = [];
    const trY: number[] = [];
    for (let i = 0; i < rows.length; i += 1) {
      if (foldOf[i] !== f) {
        trX.push(X[i]);
        trY.push(y[i]);
      }
    }
    const { w, b } = trainLogistic(trX, trY, dim);
    for (let i = 0; i < rows.length; i += 1) {
      if (foldOf[i] === f) oof[i] = predictScore(w, b, X[i]);
    }
  }
  const cvAuroc = auroc(oof, y);
  const threshold = youdenThreshold(oof, y);

  // Final model on all data
  const final = trainLogistic(X, y, dim);

  const artifact: PredictionModelArtifact = {
    slug: MODEL_SLUG,
    title: "Nguy cơ shock (baseline paper1)",
    target: TARGET,
    positiveClass: POSITIVE,
    datasetSlug: DATASET_SLUG,
    features,
    expandedNames,
    weights: final.w,
    intercept: final.b,
    metrics: { auroc: Number(cvAuroc.toFixed(4)), n: rows.length, positives, threshold }
  };

  await upsertPredictionModel(MODEL_SLUG, artifact as unknown as Record<string, unknown>);

  console.log(
    JSON.stringify(
      {
        model: MODEL_SLUG,
        n: rows.length,
        positives,
        prevalence: Number((positives / rows.length).toFixed(4)),
        expandedDim: dim,
        cvAuroc: artifact.metrics.auroc,
        threshold
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
