import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import logoAsset from "@/assets/martendal-logo.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const ALLOWED_EMAIL = "beludokuka321@gmail.com";
const TZ = "America/Porto_Velho";

type EventRow = {
  id: string;
  event_type: "page_view" | "whatsapp_click";
  created_at: string;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  traffic_source: string | null;
  referrer: string | null;
  landing_path: string | null;
  device_type: string | null;
};

export const Route = createFileRoute("/leads-panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel Martendal | Acessos e Reservas" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Painel administrativo interno do Martendal Weekend 2026." },
      { property: "og:title", content: "Painel Martendal" },
      { property: "og:description", content: "Painel administrativo interno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeadsPanelRoute,
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string): string {
  return dateFmt.format(new Date(iso)).replace(",", "");
}

function dayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
  return parts;
}

function pct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function label(value: string | null, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

// ------------------------------------------------------------------
// Auth gate
// ------------------------------------------------------------------

function LeadsPanelRoute() {
  const [status, setStatus] = useState<"loading" | "anon" | "denied" | "ok">("loading");
  const [email, setEmail] = useState("");

  const evaluate = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setStatus("anon");
      return;
    }
    const userEmail = (user.email || "").toLowerCase();
    const providers = [
      (user.app_metadata as { provider?: string } | undefined)?.provider,
      ...(((user.app_metadata as { providers?: string[] } | undefined)?.providers) ?? []),
    ].filter(Boolean) as string[];
    const isGoogle = providers.includes("google");
    const verified =
      (user.user_metadata as { email_verified?: boolean | string } | undefined)?.email_verified;
    const emailVerified = verified === true || verified === "true";

    if (userEmail !== ALLOWED_EMAIL || !isGoogle || !emailVerified) {
      await supabase.auth.signOut();
      setStatus("denied");
      return;
    }
    setEmail(user.email || "");
    setStatus("ok");
  }, []);


  useEffect(() => {
    void evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void evaluate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B09] text-white/70">
        Carregando…
      </div>
    );
  }

  if (status === "ok") return <Dashboard email={email} />;

  return <LoginScreen denied={status === "denied"} />;
}

function LoginScreen({ denied }: { denied: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/leads-panel`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setError("Não foi possível iniciar o login com o Google.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    window.location.replace("/leads-panel");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050706] px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B100D] p-8 text-center shadow-2xl">
        <img
          src={logoAsset.url}
          alt="Pecuária Martendal"
          width={84}
          height={84}
          className="mx-auto h-20 w-auto"
        />
        <h1 className="mt-5 text-xl font-bold text-white">Painel Martendal</h1>
        <p className="mt-1 text-sm text-white/55">Acesso administrativo</p>

        {denied ? (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
            Acesso não autorizado.
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="button"
          onClick={() => void signIn()}
          disabled={busy}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#0B100D] transition hover:bg-white/90 disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.5l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24c0-1.6-.1-2.8-.4-4.1H24v8.3h12.7c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.5-4.2 6.8-10.3 6.8-17.4z"
            />
            <path
              fill="#FBBC05"
              d="M10.4 28.4A14.6 14.6 0 0 1 9.6 24c0-1.5.3-3 .8-4.4l-7.8-6.1A23.9 23.9 0 0 0 .5 24c0 3.8.9 7.4 2.1 10.5l7.8-6.1z"
            />
            <path
              fill="#34A853"
              d="M24 47.5c6.2 0 11.5-2 15.7-5.6l-7.6-5.9c-2 1.4-4.7 2.4-8.1 2.4-6.4 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.2 14.6 47.5 24 47.5z"
            />
          </svg>
          Continuar com Google
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------

type Period = "today" | "yesterday" | "7d" | "all" | "custom";

type GroupStats = {
  key: string;
  views: number;
  uniques: number;
  clicks: number;
  rate: number;
};

function startOfDayTz(offsetDays: number): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const base = new Date(`${parts}T00:00:00-04:00`);
  base.setDate(base.getDate() + offsetDays);
  return base;
}

function groupBy(rows: EventRow[], pick: (r: EventRow) => string): GroupStats[] {
  const map = new Map<string, { views: number; clicks: number; vs: Set<string>; cs: Set<string> }>();
  for (const row of rows) {
    const key = pick(row);
    let entry = map.get(key);
    if (!entry) {
      entry = { views: 0, clicks: 0, vs: new Set(), cs: new Set() };
      map.set(key, entry);
    }
    const session = row.session_id || row.id;
    if (row.event_type === "page_view") {
      entry.views += 1;
      entry.vs.add(session);
    } else {
      entry.clicks += 1;
      entry.cs.add(session);
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      views: v.views,
      uniques: v.vs.size,
      clicks: v.clicks,
      rate: v.vs.size ? (v.cs.size / v.vs.size) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views);
}

function Dashboard({ email }: { email: string }) {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fSource, setFSource] = useState("");
  const [fCampaign, setFCampaign] = useState("");
  const [fTerm, setFTerm] = useState("");
  const [fContent, setFContent] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("martendal_tracking_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) setLoadError(error.message);
    else {
      setLoadError(null);
      setRows((data ?? []) as EventRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const periodRows = useMemo(() => {
    const all = rows ?? [];
    if (period === "all") return all;
    let start: Date | null = null;
    let end: Date | null = null;
    if (period === "today") start = startOfDayTz(0);
    if (period === "yesterday") {
      start = startOfDayTz(-1);
      end = startOfDayTz(0);
    }
    if (period === "7d") start = startOfDayTz(-6);
    if (period === "custom") {
      if (from) start = new Date(`${from}T00:00:00-04:00`);
      if (to) {
        end = new Date(`${to}T00:00:00-04:00`);
        end.setDate(end.getDate() + 1);
      }
    }
    return all.filter((r) => {
      const t = new Date(r.created_at).getTime();
      if (start && t < start.getTime()) return false;
      if (end && t >= end.getTime()) return false;
      return true;
    });
  }, [rows, period, from, to]);

  const filtered = useMemo(() => {
    return periodRows.filter((r) => {
      if (fSource && label(r.traffic_source, "Direto / Desconhecido") !== fSource) return false;
      if (fCampaign && label(r.utm_campaign, "Sem campanha identificada") !== fCampaign) return false;
      if (fTerm && label(r.utm_term, "Sem conjunto identificado") !== fTerm) return false;
      if (fContent && label(r.utm_content, "Sem criativo identificado") !== fContent) return false;
      if (fEvent && r.event_type !== fEvent) return false;
      return true;
    });
  }, [periodRows, fSource, fCampaign, fTerm, fContent, fEvent]);

  const totals = useMemo(() => {
    const views = filtered.filter((r) => r.event_type === "page_view");
    const clicks = filtered.filter((r) => r.event_type === "whatsapp_click");
    const viewSessions = new Set(views.map((r) => r.session_id || r.id));
    const clickSessions = new Set(clicks.map((r) => r.session_id || r.id));
    return {
      views: views.length,
      uniques: viewSessions.size,
      clicks: clicks.length,
      clickSessions: clickSessions.size,
      rate: viewSessions.size ? (clickSessions.size / viewSessions.size) * 100 : 0,
    };
  }, [filtered]);

  const bySource = useMemo(
    () => groupBy(filtered, (r) => label(r.traffic_source, "Direto / Desconhecido")),
    [filtered],
  );
  const byCampaign = useMemo(
    () => groupBy(filtered, (r) => label(r.utm_campaign, "Sem campanha identificada")),
    [filtered],
  );
  const byTerm = useMemo(
    () => groupBy(filtered, (r) => label(r.utm_term, "Sem conjunto identificado")),
    [filtered],
  );
  const byContent = useMemo(
    () => groupBy(filtered, (r) => label(r.utm_content, "Sem criativo identificado")),
    [filtered],
  );
  const byUtmSource = useMemo(
    () => groupBy(filtered, (r) => label(r.utm_source, "sem utm_source")),
    [filtered],
  );

  const daily = useMemo(() => {
    const map = new Map<string, { day: string; ts: number; acessos: number; cliques: number }>();
    for (const row of filtered) {
      const key = dayKey(row.created_at);
      let entry = map.get(key);
      if (!entry) {
        entry = { day: key, ts: new Date(row.created_at).getTime(), acessos: 0, cliques: 0 };
        map.set(key, entry);
      }
      entry.ts = Math.min(entry.ts, new Date(row.created_at).getTime());
      if (row.event_type === "page_view") entry.acessos += 1;
      else entry.cliques += 1;
    }
    return [...map.values()].sort((a, b) => a.ts - b.ts);
  }, [filtered]);

  const metaIds = useMemo(
    () =>
      groupBy(
        filtered.filter((r) => r.campaign_id || r.adset_id || r.ad_id),
        (r) => `${r.campaign_id ?? "-"} / ${r.adset_id ?? "-"} / ${r.ad_id ?? "-"}`,
      ),
    [filtered],
  );

  const sourceOptions = useMemo(
    () => [...new Set((rows ?? []).map((r) => label(r.traffic_source, "Direto / Desconhecido")))],
    [rows],
  );
  const campaignOptions = useMemo(
    () => [...new Set((rows ?? []).map((r) => label(r.utm_campaign, "Sem campanha identificada")))],
    [rows],
  );
  const termOptions = useMemo(
    () => [...new Set((rows ?? []).map((r) => label(r.utm_term, "Sem conjunto identificado")))],
    [rows],
  );
  const contentOptions = useMemo(
    () => [...new Set((rows ?? []).map((r) => label(r.utm_content, "Sem criativo identificado")))],
    [rows],
  );

  const matchesSearch = useCallback(
    (value: string) => !search.trim() || value.toLowerCase().includes(search.trim().toLowerCase()),
    [search],
  );

  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace("/leads-panel");
  }

  function exportCsv() {
    const cols = [
      "created_at",
      "event_type",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "campaign_id",
      "adset_id",
      "ad_id",
      "traffic_source",
      "device_type",
    ] as const;
    const escape = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [cols.join(",")];
    for (const row of filtered) {
      lines.push(cols.map((c) => escape(row[c] as string | null)).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `martendal-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const empty = filtered.length === 0;

  return (
    <div className="min-h-screen bg-[#050706] px-4 py-6 text-white sm:px-8">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 border-b border-white/10 pb-5">
        <img
          src={logoAsset.url}
          alt="Pecuária Martendal"
          width={48}
          height={48}
          className="h-12 w-auto"
        />
        <div className="mr-auto">
          <h1 className="text-lg font-bold leading-tight">Martendal Weekend 2026</h1>
          <p className="text-sm text-white/50">Painel de acessos e reservas</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-white/60 sm:inline">{email}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/80 transition hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 pt-6">
        {/* Filtros */}
        <section className="rounded-xl border border-white/10 bg-[#0B100D] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["today", "Hoje"],
                ["yesterday", "Ontem"],
                ["7d", "Últimos 7 dias"],
                ["all", "Todo período"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  period === value
                    ? "bg-[#1c7a45] text-white"
                    : "border border-white/15 text-white/70 hover:bg-white/10"
                }`}
              >
                {text}
              </button>
            ))}
            <div className="flex items-center gap-2 text-sm">
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPeriod("custom");
                }}
                className="rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-white/80"
              />
              <span className="text-white/40">até</span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPeriod("custom");
                }}
                className="rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-white/80"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg bg-[#1c7a45] px-3 py-1.5 text-sm font-semibold hover:bg-[#229352]"
              >
                {loading ? "Atualizando…" : "Atualizar dados"}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-[#c9a227]/50 px-3 py-1.5 text-sm font-semibold text-[#e0bd45] hover:bg-[#c9a227]/10"
              >
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={fSource} onChange={setFSource} placeholder="Origem" options={sourceOptions} />
            <Select
              value={fCampaign}
              onChange={setFCampaign}
              placeholder="Campanha"
              options={campaignOptions}
            />
            <Select value={fTerm} onChange={setFTerm} placeholder="Conjunto" options={termOptions} />
            <Select
              value={fContent}
              onChange={setFContent}
              placeholder="Criativo"
              options={contentOptions}
            />
            <Select
              value={fEvent}
              onChange={setFEvent}
              placeholder="Tipo de evento"
              options={["page_view", "whatsapp_click"]}
            />
          </div>
        </section>

        {loadError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Não foi possível carregar os dados: {loadError}
          </p>
        ) : null}

        {/* Cards */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card title="Acessos" value={String(totals.views)} />
          <Card title="Acessos únicos" value={String(totals.uniques)} />
          <Card title="Cliques no WhatsApp" value={String(totals.clicks)} />
          <Card title="Taxa de avanço" value={pct(totals.rate)} hint={`${totals.clickSessions} sessões com clique`} />
        </section>

        {empty ? (
          <p className="rounded-xl border border-white/10 bg-[#0B100D] p-6 text-center text-white/60">
            Nenhum dado registrado neste período.
          </p>
        ) : null}

        {/* Funil */}
        <Panel title="Funil da squeeze">
          <div className="flex flex-col items-center gap-1 text-center">
            <FunnelStep value={totals.views} text="acessos" />
            <span className="text-white/30">↓</span>
            <FunnelStep value={totals.uniques} text="visitantes únicos" />
            <span className="text-white/30">↓</span>
            <FunnelStep value={totals.clicks} text="cliques no WhatsApp" />
            <p className="mt-2 text-sm font-semibold text-[#e0bd45]">Taxa: {pct(totals.rate)}</p>
          </div>
        </Panel>

        {/* Origem */}
        <Panel title="Acessos por origem">
          <StatsTable rows={bySource} firstColumn="Origem" />
        </Panel>

        {/* Evolução diária */}
        <Panel title="Acessos e cliques por dia">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0B100D",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="acessos" name="Acessos" fill="#1c7a45" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cliques" name="Cliques no WhatsApp" fill="#e0bd45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Busca */}
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campanha, conjunto ou criativo…"
            className="w-full rounded-xl border border-white/15 bg-[#0B100D] px-4 py-2.5 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <Panel title="Origem do tráfego (utm_source)">
          <StatsTable rows={byUtmSource.filter((r) => matchesSearch(r.key))} firstColumn="utm_source" />
        </Panel>

        <Panel title="Desempenho por campanha">
          <StatsTable rows={byCampaign.filter((r) => matchesSearch(r.key))} firstColumn="Campanha" />
        </Panel>

        <Panel title="Desempenho por conjunto / público">
          <StatsTable rows={byTerm.filter((r) => matchesSearch(r.key))} firstColumn="Conjunto / Público" />
        </Panel>

        <Panel title="Desempenho por criativo">
          <StatsTable rows={byContent.filter((r) => matchesSearch(r.key))} firstColumn="Criativo" />
        </Panel>

        <Panel title="IDs do Meta (diagnóstico)">
          <StatsTable rows={metaIds} firstColumn="campaign_id / adset_id / ad_id" />
        </Panel>

        <Panel title="Acessos recentes">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="py-2 pr-3">Data/Hora</th>
                  <th className="py-2 pr-3">Origem</th>
                  <th className="py-2 pr-3">Campanha</th>
                  <th className="py-2 pr-3">Conjunto</th>
                  <th className="py-2 pr-3">Criativo</th>
                  <th className="py-2 pr-3">Dispositivo</th>
                  <th className="py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((row) => (
                  <tr key={row.id} className="border-t border-white/8 text-white/80">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                    <td className="py-2 pr-3">{label(row.traffic_source, "—")}</td>
                    <td className="py-2 pr-3">{label(row.utm_campaign, "—")}</td>
                    <td className="py-2 pr-3">{label(row.utm_term, "—")}</td>
                    <td className="py-2 pr-3">{label(row.utm_content, "—")}</td>
                    <td className="py-2 pr-3">{label(row.device_type, "—")}</td>
                    <td className="py-2 whitespace-nowrap font-semibold">
                      {row.event_type === "whatsapp_click" ? (
                        <span className="text-[#3ddc84]">Clicou no WhatsApp</span>
                      ) : (
                        <span className="text-white/60">Acessou</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/15 bg-[#0B100D] px-2 py-2 text-sm text-white/80"
    >
      <option value="">{placeholder}: todos</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B100D] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0B100D] p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#e0bd45]">{title}</h2>
      {children}
    </section>
  );
}

function FunnelStep({ value, text }: { value: number; text: string }) {
  return (
    <p className="text-white">
      <span className="text-xl font-bold">{value}</span>{" "}
      <span className="text-white/60">{text}</span>
    </p>
  );
}

function StatsTable({ rows, firstColumn }: { rows: GroupStats[]; firstColumn: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/50">Nenhum dado registrado neste período.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="py-2 pr-3">{firstColumn}</th>
            <th className="py-2 pr-3">Acessos</th>
            <th className="py-2 pr-3">Únicos</th>
            <th className="py-2 pr-3">Cliques WhatsApp</th>
            <th className="py-2">Taxa de avanço</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-white/8 text-white/80">
              <td className="py-2 pr-3 break-all">{row.key}</td>
              <td className="py-2 pr-3">{row.views}</td>
              <td className="py-2 pr-3">{row.uniques}</td>
              <td className="py-2 pr-3 font-semibold text-[#3ddc84]">{row.clicks}</td>
              <td className="py-2">{pct(row.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
