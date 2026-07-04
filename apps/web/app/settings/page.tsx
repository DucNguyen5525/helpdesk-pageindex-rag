"use client";

import { Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [topK, setTopK] = useState(defaultSettings.topK);
  const [tags, setTags] = useState(defaultSettings.tags);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setTopK(settings.topK);
    setTags(settings.tags);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveSettings({ topK, tags });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="p-5 md:p-8">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>
      <form onSubmit={handleSubmit} className="mt-5 max-w-xl space-y-5 rounded-md border border-stone-200 bg-white p-5">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Top K PageIndex nodes</span>
          <input
            type="number"
            min={1}
            max={12}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-mint"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">Tag filter</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="helpdesk,warranty"
            className="mt-2 h-10 w-full rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-mint"
          />
        </label>

        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          Gemini model, MongoDB, and R2 settings are configured on the server through environment variables.
        </div>

        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-mint px-4 py-2 text-sm font-medium text-white">
          <Save size={16} aria-hidden="true" />
          Save
        </button>
        {saved ? <span className="ml-3 text-sm text-emerald-700">Saved</span> : null}
      </form>
    </section>
  );
}
