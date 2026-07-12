import { NextResponse } from "next/server";
import type { PredictionModelInfo } from "@helpdesk/shared";
import { z } from "zod";
import { getPredictionModel } from "@/lib/server/repository";
import { predictFromArtifact, type PredictionModelArtifact } from "@/lib/server/prediction";

export const runtime = "nodejs";

const DEFAULT_MODEL = "shock-baseline";

const predictSchema = z.object({
  modelSlug: z.string().optional(),
  features: z.record(z.union([z.string(), z.number(), z.null()]))
});

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("model") ?? DEFAULT_MODEL;
    const artifact = (await getPredictionModel(slug)) as PredictionModelArtifact | null;
    if (!artifact) return NextResponse.json({ detail: `Model '${slug}' not found` }, { status: 404 });

    const info: PredictionModelInfo = {
      slug: artifact.slug,
      title: artifact.title,
      target: artifact.target,
      positiveClass: artifact.positiveClass,
      datasetSlug: artifact.datasetSlug,
      inputFeatures: artifact.features.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.kind === "numeric" ? "number" : "category",
        categories: f.kind === "category" ? f.categories : undefined
      })),
      metrics: artifact.metrics
    };
    return NextResponse.json({ data: info });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = predictSchema.parse(await request.json());
    const slug = input.modelSlug ?? DEFAULT_MODEL;
    const artifact = (await getPredictionModel(slug)) as PredictionModelArtifact | null;
    if (!artifact) return NextResponse.json({ detail: `Model '${slug}' not found` }, { status: 404 });

    const result = predictFromArtifact(artifact, input.features);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
