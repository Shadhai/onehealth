import { useEffect, useState } from "react";
import { API } from "../lib/api.js";
import { clearPendingObservations, listPendingObservations, queueObservation } from "../lib/offlineQueue.js";
import { useLang } from "../lib/LangContext.jsx";
import { t } from "../lib/i18n.js";

const emptyForm = { research_site: "", ph: "", dissolved_oxygen: "", water_temperature: "", overall_rating: "" };

export default function ObservationCapture({ onClose, onComplete }) {
  const { lang } = useLang();
  const tr = (key) => t(lang, key);
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState([]);

  const refreshQueue = async () => setPending(await listPendingObservations());
  useEffect(() => {
    refreshQueue().catch(() => setMessage(tr("capture.queueError")));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const readMedia = (files) => Promise.all([...files].map((file) => new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("file-too-large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));

  const sync = async (items = pending) => {
    if (!items.length || !navigator.onLine) return;
    setSaving(true);
    try {
      await API.submitObservations(items);
      await clearPendingObservations(items.map((item) => item.submission_id));
      await refreshQueue();
      setMessage(tr("capture.synced"));
      onComplete?.();
    } catch {
      setMessage(tr("capture.syncFailed"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const retryPending = async () => {
      if (!navigator.onLine) return;
      try {
        const items = await listPendingObservations();
        if (items.length) await sync(items);
      } catch {
        setMessage(tr("capture.syncFailed"));
      }
    };
    window.addEventListener("online", retryPending);
    return () => window.removeEventListener("online", retryPending);
  }, [pending]);

  const save = async (event) => {
    event.preventDefault();
    const observation = {
      ...form,
      submission_id: `FIELD-${Date.now()}`,
      submitted_at: new Date().toISOString(),
      source: "oah_app",
      photo_data_urls: media.filter((item) => item.type.startsWith("image/")).map((item) => item.data),
      video_data_urls: media.filter((item) => item.type.startsWith("video/")).map((item) => item.data),
    };
    ["ph", "dissolved_oxygen", "water_temperature"].forEach((key) => {
      if (form[key] !== "") observation[key] = Number(form[key]);
    });
    setSaving(true);
    try {
      await queueObservation(observation);
      await refreshQueue();
      setForm(emptyForm);
      setMedia([]);
      setMessage(navigator.onLine ? tr("capture.savedPending") : tr("capture.savedOffline"));
      if (navigator.onLine) await sync([observation]);
    } catch {
      setMessage(tr("capture.queueError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="capture-title">
      <form onSubmit={save} className="w-full max-w-xl rounded-3xl bg-[var(--bg)] border border-[var(--border-line-strong)] shadow-2xl p-6 space-y-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-teal-400 font-mono-code">{tr("capture.kicker")}</p>
            <h2 id="capture-title" className="text-2xl font-serif-title font-bold text-[var(--ink)]">{tr("capture.title")}</h2>
            <p className="text-xs text-[var(--ink-dim)] mt-1">{tr("capture.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--ink-dim)] hover:text-[var(--ink)] text-xl" aria-label={tr("capture.close")}>×</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--ink-dim)] sm:col-span-2">{tr("capture.site")}
            <input required value={form.research_site} onChange={(e) => update("research_site", e.target.value)} className="field-input" placeholder="River segment or site name" />
          </label>
          {[
            ["ph", tr("capture.ph"), "0", "14"],
            ["dissolved_oxygen", tr("capture.oxygen"), "0", "20"],
            ["water_temperature", tr("capture.temperature"), "-10", "50"],
          ].map(([key, label, min, max]) => (
            <label key={key} className="text-xs text-[var(--ink-dim)]">{label}
              <input type="number" step="any" min={min} max={max} value={form[key]} onChange={(e) => update(key, e.target.value)} className="field-input" />
            </label>
          ))}
          <label className="text-xs text-[var(--ink-dim)]">{tr("capture.rating")}
            <select value={form.overall_rating} onChange={(e) => update("overall_rating", e.target.value)} className="field-input">
              <option value="">Not assessed</option><option>Good</option><option>Moderate</option><option>Poor</option>
            </select>
          </label>
          <label className="text-xs text-[var(--ink-dim)] sm:col-span-2">{tr("capture.media")}
            <input type="file" accept="image/*,video/*" multiple onChange={async (e) => {
              try {
                setMedia(await readMedia(e.target.files));
                setMessage("");
              } catch {
                setMessage(tr("capture.mediaError"));
              }
            }} className="field-input file:mr-3 file:rounded-lg file:border-0 file:bg-teal-500/20 file:px-3 file:py-1 file:text-teal-200" />
            <span className="block mt-1 text-[10px]">{tr("capture.mediaHint")}</span>
          </label>
        </div>

        <div className="rounded-xl border border-[var(--border-line)] bg-black/15 p-3 text-xs text-[var(--ink-dim)]">
          <span className="text-teal-300 font-semibold">{pending.length}</span> {tr("capture.pending")}
          {message && <p className="mt-1 text-amber-300">{message}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={sync} disabled={!pending.length || saving || !navigator.onLine} className="btn-outline disabled:opacity-40">{tr("capture.sync")}</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? tr("capture.saving") : tr("capture.save")}</button>
        </div>
      </form>
    </div>
  );
}
