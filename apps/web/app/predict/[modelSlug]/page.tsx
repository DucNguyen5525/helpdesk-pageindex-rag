"use client";

import type { PredictionModelInfo, PredictionResult } from "@helpdesk/shared";
import { Activity, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api-client";

// Friendlier Vietnamese labels + units for known baseline features.
const FIELD_META: Record<string, { label: string; unit?: string }> = {
  age: { label: "Tuổi", unit: "năm" },
  wt: { label: "Cân nặng", unit: "kg" },
  day_ill: { label: "Ngày bệnh khi nhập viện" },
  temp: { label: "Nhiệt độ", unit: "°C" },
  pulse: { label: "Mạch", unit: "lần/phút" },
  sys_bp: { label: "Huyết áp tâm thu", unit: "mmHg" },
  liver: { label: "Kích thước gan", unit: "cm" },
  hct_bsl: { label: "Hematocrit", unit: "%" },
  plt_bsl: { label: "Tiểu cầu", unit: "cells/mm³" },
  sex: { label: "Giới tính" },
  his_tired: { label: "Tiền sử mệt mỏi" },
  his_vomit: { label: "Tiền sử nôn" },
  ttest: { label: "Nghiệm pháp dây thắt" },
  mucosal_bleed: { label: "Xuất huyết niêm mạc" },
  abdominal_pain: { label: "Đau bụng" },
  serotype2: { label: "Serotype (PCR)" },
  serology: { label: "Huyết thanh học" }
};

const RISK_STYLE: Record<PredictionResult["riskLabel"], string> = {
  thấp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "trung bình": "bg-amber-50 text-amber-700 border-amber-200",
  cao: "bg-rose-50 text-rose-700 border-rose-200"
};

export default function PredictPage() {
  const params = useParams();
  const modelSlug = params.modelSlug as string;

  const [model, setModel] = useState<PredictionModelInfo | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.getPredictionModel(modelSlug);
        setModel(res.data);
      } catch (err) {
        setLoadError(getErrorMessage(err));
      }
    }
    load();
  }, [modelSlug]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!model) return;
    setIsLoading(true);
    setError(undefined);
    setResult(null);

    try {
      const features: Record<string, string | number | null> = {};
      for (const f of model.inputFeatures) {
        const raw = form[f.name]?.trim();
        if (!raw) continue;
        features[f.name] = f.type === "number" ? Number(raw) : raw;
      }
      const res = await apiClient.predict({ modelSlug, features });
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Không tải được mô hình &quot;{modelSlug}&quot;: {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-mint hover:underline">
          <ArrowLeft size={12} /> Quay lại Dashboard
        </Link>

        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10 text-mint">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{model?.title ?? "Dự đoán"}</h1>
            {model && (
              <p className="mt-0.5 text-xs text-stone-500">
                Dự đoán {model.target} = {model.positiveClass} · AUROC (CV) {model.metrics.auroc} · n={model.metrics.n}
              </p>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Công cụ nghiên cứu/tham khảo dựa trên dữ liệu quan sát cỡ mẫu nhỏ. KHÔNG dùng để quyết định điều trị lâm sàng khi chưa được kiểm định.
          </span>
        </div>

        {!model ? (
          <div className="flex items-center gap-3 py-20 justify-center text-stone-400">
            <div className="h-2 w-2 animate-ping rounded-full bg-mint" />
            <span className="text-sm">Đang tải mô hình...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-stone-500">Nhập các chỉ số lúc nhập viện. Trường để trống sẽ dùng giá trị trung bình.</p>
              {model.inputFeatures.map((f) => {
                const meta = FIELD_META[f.name] ?? { label: f.label };
                return (
                  <label key={f.name} className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-700">
                      {meta.label}
                      {meta.unit ? <span className="text-stone-400"> ({meta.unit})</span> : null}
                    </span>
                    {f.type === "category" ? (
                      <select
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                        className="h-9 w-full rounded-md border border-stone-300 px-2 text-sm outline-none focus:border-mint"
                      >
                        <option value="">— Không rõ —</option>
                        {(f.categories ?? []).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                        className="h-9 w-full rounded-md border border-stone-300 px-2 text-sm outline-none focus:border-mint"
                      />
                    )}
                  </label>
                );
              })}

              {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-mint/90 disabled:opacity-50"
              >
                {isLoading ? "Đang tính..." : "Dự đoán nguy cơ"}
              </button>
            </form>

            {/* Result */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              {!result ? (
                <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-stone-400">
                  Kết quả dự đoán sẽ hiển thị ở đây.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-lg border p-4 text-center ${RISK_STYLE[result.riskLabel]}`}>
                    <div className="text-3xl font-bold">{(result.probability * 100).toFixed(1)}%</div>
                    <div className="mt-1 text-sm font-medium">Nguy cơ {result.riskLabel}</div>
                    <div className="mt-1 text-xs opacity-80">
                      Ngưỡng cảnh báo {(result.threshold * 100).toFixed(1)}% · {result.aboveThreshold ? "trên ngưỡng" : "dưới ngưỡng"}
                    </div>
                  </div>

                  {result.contributions.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-stone-600">Yếu tố ảnh hưởng chính</p>
                      <ul className="space-y-1.5">
                        {result.contributions.map((c) => (
                          <li key={c.feature} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-stone-600">{c.feature}</span>
                            <span className={c.impact >= 0 ? "font-medium text-rose-600" : "font-medium text-emerald-600"}>
                              {c.impact >= 0 ? "+" : ""}
                              {c.impact.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] text-stone-400">
                        Dương (đỏ) làm tăng nguy cơ, âm (xanh) làm giảm — theo thang đặc trưng đã chuẩn hoá.
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-stone-400">{result.disclaimer}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
