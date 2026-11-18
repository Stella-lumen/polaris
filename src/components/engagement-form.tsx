"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateEngagement, createEngagement } from "@/lib/actions";

type Opt = { value: string; label: string };
type PlannedOpt = Opt & { planId: string };
type TeamRow = { user_id: string; position: string; qualifications: string; experience: string };

const EMPTY = {
  id: "",
  engagement_name: "",
  engagement_number: "",
  annual_audit_plan_id: "",
  planned_engagement_id: "",
  engagement_type_id: "",
  start_date: "",
  end_date: "",
  engagement_budget: "",
  engagement_spend: "",
  authorised_date: null,
};

const inputCls = "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm";
const selCls = inputCls;
const sectionCls = "text-sm font-semibold text-orange-600";
const labelCls = "flex flex-col gap-1 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={labelCls}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function EngagementForm({
  engagement = EMPTY,
  plans,
  plannedEngagements,
  types,
  typeDefaults = {},
  users,
  initialOutsourcedId = "",
  initialTeam = [],
}: {
  engagement?: {
    id: string;
    engagement_name: string | null;
    engagement_number: string | null;
    annual_audit_plan_id: string | null;
    planned_engagement_id: string | null;
    engagement_type_id: string | null;
    start_date: string | null;
    end_date: string | null;
    engagement_budget: string | number | null;
    engagement_spend: string | number | null;
    authorised_date: string | null;
  };
  plans: Opt[];
  plannedEngagements: PlannedOpt[];
  types: Opt[];
  typeDefaults?: Record<string, string>;
  users: Opt[];
  initialOutsourcedId?: string;
  initialTeam?: TeamRow[];
}) {
  const router = useRouter();
  const isNew = !engagement.id;
  const [busy, setBusy] = useState<"save" | "authorise" | null>(null);
  const [planId, setPlanId] = useState(engagement.annual_audit_plan_id ?? "");
  const [plannedId, setPlannedId] = useState(engagement.planned_engagement_id ?? "");
  const [typeId, setTypeId] = useState(engagement.engagement_type_id ?? "");
  const [useDefaults, setUseDefaults] = useState(true);
  const [outsourcedId, setOutsourcedId] = useState(initialOutsourcedId);
  const [team, setTeam] = useState<TeamRow[]>(initialTeam);

  const filteredPlanned = planId
    ? plannedEngagements.filter((p) => p.planId === planId)
    : plannedEngagements;

  const setRow = (i: number, patch: Partial<TeamRow>) =>
    setTeam((t) => t.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit(authorise: boolean) {
    const f = document.getElementById("engagement-form") as HTMLFormElement;
    const fd = new FormData(f);
    const payload = {
      engagement_name: String(fd.get("engagement_name") ?? ""),
      engagement_number: String(fd.get("engagement_number") ?? ""),
      annual_audit_plan_id: planId || null,
      planned_engagement_id: plannedId || null,
      engagement_type_id: typeId || null,
      use_type_defaults: isNew && useDefaults,
      start_date: String(fd.get("start_date") ?? "") || null,
      end_date: String(fd.get("end_date") ?? "") || null,
      engagement_budget: fd.get("engagement_budget") ? Number(fd.get("engagement_budget")) : null,
      engagement_spend: fd.get("engagement_spend") ? Number(fd.get("engagement_spend")) : null,
      outsourced_party_id: outsourcedId || null,
      authorise,
      team: team.filter((r) => r.user_id && r.position),
    };
    setBusy(authorise ? "authorise" : "save");
    try {
      const id = isNew ? await createEngagement(payload) : (await updateEngagement(engagement.id, payload), engagement.id);
      router.push(`/engagements/${id}/dashboard`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form id="engagement-form" className="flex max-w-4xl flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-3">
        <div className={sectionCls}>Annual Audit Plan</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Annual Audit Plan">
            <select className={selCls} value={planId} onChange={(e) => { setPlanId(e.target.value); setPlannedId(""); }}>
              <option value="">Select plan…</option>
              {plans.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Planned Engagement">
            <div className="flex gap-2">
              <select className={selCls} value={plannedId} onChange={(e) => setPlannedId(e.target.value)}>
                <option value="">Select…</option>
                {filteredPlanned.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {plannedId && (
                <button type="button" onClick={() => setPlannedId("")} className="shrink-0 rounded-md border px-3 text-sm hover:bg-accent">
                  Clear
                </button>
              )}
            </div>
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className={sectionCls}>Engagement Information</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <input name="engagement_name" defaultValue={engagement.engagement_name ?? ""} required className={inputCls} />
          </Field>
          <Field label="Engagement Number">
            <input name="engagement_number" defaultValue={engagement.engagement_number ?? ""} required className={inputCls} />
          </Field>
          <Field label="Engagement Type">
            <select className={selCls} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Select…</option>
              {types.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          {isNew && typeId && typeDefaults[typeId] && (
            <Field label="Type defaults">
              <label className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50/60 px-3 py-2 text-sm">
                <input type="checkbox" checked={useDefaults} onChange={(e) => setUseDefaults(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
                <span>
                  Apply this type's defaults — <span className="text-muted-foreground">{typeDefaults[typeId]}</span>
                </span>
              </label>
            </Field>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className={sectionCls}>Period of Engagement</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Start Date">
            <input name="start_date" type="date" defaultValue={engagement.start_date ?? ""} className={inputCls} />
          </Field>
          <Field label="End Date">
            <input name="end_date" type="date" defaultValue={engagement.end_date ?? ""} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className={sectionCls}>Financial Implications</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Engagement Budget">
            <input name="engagement_budget" type="number" step="0.01" defaultValue={engagement.engagement_budget != null ? String(engagement.engagement_budget) : ""} className={inputCls} />
          </Field>
          <Field label="Engagement Spend">
            <input name="engagement_spend" type="number" step="0.01" defaultValue={engagement.engagement_spend != null ? String(engagement.engagement_spend) : ""} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className={sectionCls}>Auditor in Charge</div>
        <Field label="Outsourced Party">
          <select className={selCls} value={outsourcedId} onChange={(e) => setOutsourcedId(e.target.value)}>
            <option value="">Select…</option>
            {users.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={sectionCls}>Audit Team</div>
          <button
            type="button"
            onClick={() => setTeam((t) => [...t, { user_id: "", position: "AUDITOR", qualifications: "", experience: "" }])}
            className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-accent"
          >
            <span className="text-base leading-none">+</span> Add Team Member
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {team.map((r, i) => (
            <div key={i} className="rounded-md border border-neutral-300 p-4">
              <div className="mb-3 flex items-center justify-between text-sm font-medium">
                Team Member {i + 1}
                <button type="button" onClick={() => setTeam((t) => t.filter((_, j) => j !== i))} className="text-sm hover:underline">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Team Member">
                  <select className={selCls} value={r.user_id} onChange={(e) => setRow(i, { user_id: e.target.value })}>
                    <option value="">Select…</option>
                    {users.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Position on Audit">
                  <select className={selCls} value={r.position} onChange={(e) => setRow(i, { position: e.target.value })}>
                    <option value="SENIOR_AUDITOR">SENIOR AUDITOR</option>
                    <option value="AUDITOR">AUDITOR</option>
                  </select>
                </Field>
                <Field label="Qualifications">
                  <input value={r.qualifications} onChange={(e) => setRow(i, { qualifications: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Experience">
                  <input value={r.experience} onChange={(e) => setRow(i, { experience: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => submit(false)}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={busy !== null || !!engagement.authorised_date}
          onClick={() => submit(true)}
          className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
        >
          {busy === "authorise" ? "Authorising…" : engagement.authorised_date ? "Authorised" : "Authorise"}
        </button>
      </div>
    </form>
  );
}
