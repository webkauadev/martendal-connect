import { CATALOGS } from "@/lib/catalog-tracking-contract";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import {
  panelGetDashboard,
  panelGetTrackingEventsPage,
  panelExportUrl,
  type Dashboard as DashboardData,
  type EventPage,
  type TrackingEvent as EventRow,
  type DashboardFilters,
  panelLogin,
  panelLogout,
  panelSessionValid,
} from "@/lib/panel-auth";

import { panelLotLabel, panelPeriodFilters, type Period } from "@/lib/panel-data";

const LOGO_URL = "/martendal-logo.jpg";

const TZ = "America/Porto_Velho";

const CATALOG_PREFIX = "/catalago/";

const EVENT_LABELS: Record<string, string> = {
  catalog_selector_view: "Abriu a seleção de catálogos",
  catalog_selected: "Selecionou catálogo",
  page_view: "Acessou a squeeze",
  whatsapp_click: "Clicou no WhatsApp",
  catalog_view: "Acessou o catálogo",
  lot_view: "Visualizou lote",
  lot_whatsapp_click: "Demonstrou interesse no lote",
  catalog_whatsapp_click: "Clicou no WhatsApp do catálogo",
  catalog_video_click: "Clicou no vídeo do lote",
  pdf_download: "Abriu o PDF do catálogo",
};

const CLICK_EVENTS = new Set(["whatsapp_click", "catalog_whatsapp_click", "lot_whatsapp_click"]);

export const Route = createFileRoute("/leads-panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel Martendal | Squeeze e Catálogo" },
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

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string): string {
  return dateFmt.format(new Date(iso)).replace(",", "");
}
function pct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function label(value: string | null, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function lotLabel(lot: string): string {
  return lot === "-100" ? "Coberturas" : `Lote ${lot}`;
}

function catalogName(row: EventRow): string {
  const catalog = Object.values(CATALOGS).find(
    (entry) =>
      row.catalog_key === entry.catalogKey ||
      row.catalog_name === entry.catalogName ||
      row.landing_path === entry.path,
  );
  if (catalog) return catalog.catalogName;
  // Preserve the existing historical interpretation of root-path Machos lots.
  if (row.lot_number) return CATALOGS.machos.catalogName;
  return "Seleção de catálogos";
}
function catalogLabel(row: EventRow): string {
  const name = catalogName(row);
  return Object.values(CATALOGS).find((entry) => entry.catalogName === name)?.label ?? name;
}
function lotIdentity(row: EventRow): string {
  return `${catalogLabel(row)} / ${lotLabel(row.lot_number ?? "")}`;
}

function experienceOf(row: EventRow): "squeeze" | "catalog" {
  if (row.experience_type === "catalog" || row.experience_type === "squeeze") {
    return row.experience_type;
  }
  return (row.landing_path ?? "").startsWith(CATALOG_PREFIX) ? "catalog" : "squeeze";
}

function sid(row: EventRow): string {
  return row.session_id || row.id;
}

// ------------------------------------------------------------------
// Auth gate — chave administrativa própria (sem OAuth)
// ------------------------------------------------------------------

function LeadsPanelRoute() {
  const [status, setStatus] = useState<"loading" | "anon" | "ok">("loading");

  const evaluate = useCallback(async () => {
    const valid = await panelSessionValid();
    setStatus(valid ? "ok" : "anon");
  }, []);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B09] text-white/70">
        Carregando…
      </div>
    );
  }

  if (status === "ok") return <Dashboard onSignedOut={() => setStatus("anon")} />;

  return <LoginScreen onSignedIn={() => setStatus("ok")} />;
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [accessKey, setAccessKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await panelLogin(accessKey);
    if (!result.ok) {
      setError(result.error ?? "Chave inválida.");
      setBusy(false);
      return;
    }
    setAccessKey("");
    setBusy(false);
    onSignedIn();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050706] px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B100D] p-8 shadow-2xl">
        <img
          src={LOGO_URL}
          alt="Pecuária Martendal"
          width={84}
          height={84}
          className="mx-auto h-20 w-auto"
        />
        <h1 className="mt-5 text-center text-xl font-bold text-white">Painel Martendal</h1>
        <p className="mt-1 text-center text-sm text-white/55">Acesso administrativo</p>

        <form onSubmit={submit} className="mt-7 space-y-4 text-left">
          <div>
            <label
              htmlFor="panel-access-key"
              className="text-xs font-semibold uppercase tracking-wide text-white/50"
            >
              Chave de acesso
            </label>
            <input
              id="panel-access-key"
              type="password"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#050706] px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !accessKey}
            className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#0B100D] transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------

type Experience = "all" | "squeeze" | "catalog";

type GroupStats = {
  key: string;
  views: number;
  uniques: number;
  clicks: number;
  rate: number;
};

type CatalogGroupStats = {
  key: string;
  sessions: number;
  lotViews: number;
  interested: number;
  clicks: number;
  rate: number;
};

type LotStats = {
  key: string;
  catalogName: string;
  lot: string;
  horse: string;
  uniqueViews: number;
  totalViews: number;
  videoClicks: number;
  videoSessions: number;
  waClicks: number;
  interested: number;
  videoThenWa: number;
  rate: number;
  topSource: string;
  sources: Map<string, number>;
  campaigns: Map<string, { views: number; interested: number; clicks: number }>;
  contents: Map<string, { views: number; interested: number; clicks: number }>;
  devices: Map<string, number>;
  videoUrl: string | null;
};

function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventPage | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsCursors, setEventsCursors] = useState<EventPage["nextCursor"][]>([null]);
  const eventsRequest = useRef(0);
  const [refresh, setRefresh] = useState(0);
  const [debouncedLotSearch, setDebouncedLotSearch] = useState("");
  const [timelinePage, setTimelinePage] = useState<EventPage | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineCursors, setTimelineCursors] = useState<EventPage["nextCursor"][]>([null]);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const timelineRequest = useRef(0);
  const [lotKeys, setLotKeys] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exp, setExp] = useState<Experience>("all");
  const [fCatalog, setFCatalog] = useState("");
  const [fSource, setFSource] = useState("");
  const [fCampaign, setFCampaign] = useState("");
  const [fTerm, setFTerm] = useState("");
  const [fContent, setFContent] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [fDevice, setFDevice] = useState("");
  const [fLot, setFLot] = useState("");
  const [lotSearch, setLotSearch] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [openLot, setOpenLot] = useState<string | null>(null);
  const [timelineSession, setTimelineSession] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLotSearch(lotSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [lotSearch]);

  const periodFilters = useMemo(
    () => panelPeriodFilters(period, from, to),
    // Recompute the local day when the user refreshes after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, from, to, refresh],
  );
  const filters: DashboardFilters = {
    ...periodFilters,
    ...(exp !== "all" ? { experience: exp } : {}),
    catalog_key: Object.values(CATALOGS).find((c) => c.label === fCatalog)?.catalogKey ?? "",
    source: fSource,
    campaign: fCampaign,
    term: fTerm,
    content: fContent,
    event: fEvent,
    device: fDevice,
    lot: lotKeys.find((key) => panelLotLabel(key) === fLot) ?? "",
    search: debouncedLotSearch,
  };
  const filterKey = JSON.stringify(filters);
  const activeFilters = useMemo<DashboardFilters>(
    () => JSON.parse(filterKey) as DashboardFilters,
    [filterKey],
  );
  const load = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    void panelGetDashboard(activeFilters, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setLoading(false);
      if (result.unauthorized) {
        onSignedOut();
        return;
      }
      if (result.ok && result.dashboard) {
        setDashboard(result.dashboard);
        setLotKeys(result.dashboard.filter_options.lots);
      } else setLoadError(result.error ?? "Não foi possível carregar os dados do painel.");
    });
    return () => controller.abort();
  }, [activeFilters, refresh, onSignedOut]);

  useEffect(() => {
    const controller = new AbortController();
    const request = ++eventsRequest.current;
    setPage(0);
    setEventsCursors([null]);
    setRecentEvents(null);
    setEventsLoading(true);
    setEventsError(null);
    void panelGetTrackingEventsPage(null, activeFilters, controller.signal).then((result) => {
      if (controller.signal.aborted || request !== eventsRequest.current) return;
      setEventsLoading(false);
      if (result.unauthorized) {
        onSignedOut();
        return;
      }
      if (result.ok && result.page) setRecentEvents(result.page);
      else setEventsError(result.error ?? "Não foi possível carregar os eventos.");
    });
    return () => {
      controller.abort();
      eventsRequest.current += 1;
    };
  }, [activeFilters, refresh, onSignedOut]);

  async function changeEventsPage(nextPage: number) {
    const cursor = nextPage > page ? recentEvents?.nextCursor : eventsCursors[nextPage];
    if (nextPage < 0 || (nextPage > 0 && !cursor) || eventsLoading) return;
    const request = ++eventsRequest.current;
    setEventsLoading(true);
    setEventsError(null);
    const result = await panelGetTrackingEventsPage(cursor ?? null, activeFilters);
    if (request !== eventsRequest.current) return;
    setEventsLoading(false);
    if (result.unauthorized) {
      onSignedOut();
      return;
    }
    if (result.ok && result.page) {
      setRecentEvents(result.page);
      setEventsCursors((previous) => [...previous.slice(0, nextPage), cursor ?? null]);
      setPage(nextPage);
    } else setEventsError(result.error ?? "Não foi possível carregar os eventos.");
  }
  const showCatalog = exp !== "squeeze";
  const showSqueeze = exp !== "catalog";
  const ratio = (numerator = 0, denominator = 0) =>
    denominator ? (100 * numerator) / denominator : 0;
  const summary = dashboard?.summary;
  const totals = {
    views: summary?.accesses ?? 0,
    uniques: summary?.uniques ?? 0,
    clicks: summary?.clicks ?? 0,
    clickSessions: summary?.click_sessions ?? 0,
    rate: ratio(summary?.click_sessions, summary?.uniques),
  };
  const squeezeTotals = {
    views: summary?.sq_accesses ?? 0,
    uniques: summary?.sq_uniques ?? 0,
    clicks: summary?.sq_clicks ?? 0,
    clickSessions: summary?.sq_click_sessions ?? 0,
    rate: ratio(summary?.sq_click_sessions, summary?.sq_uniques),
  };
  const catalogTotals = {
    views: summary?.cat_accesses ?? 0,
    sessions: summary?.cat_uniques ?? 0,
    lotViewsUnique: summary?.unique_lot_views ?? 0,
    lotViewsTotal: summary?.lot_views ?? 0,
    lotViewSessions: summary?.lot_sessions ?? 0,
    lotInterestUnique: summary?.interested_lots ?? 0,
    interestSessions: summary?.interested_sessions ?? 0,
    waClicks: summary?.cat_wa_clicks ?? 0,
    waSessions: summary?.cat_wa_sessions ?? 0,
    videos: summary?.video_clicks ?? 0,
    videoSessions: summary?.video_sessions ?? 0,
    pdfs: summary?.pdfs ?? 0,
    interestRate: ratio(summary?.interested_sessions, summary?.lot_sessions),
    advanceRate: ratio(summary?.cat_wa_sessions, summary?.cat_uniques),
  };
  // Presentation adapter: all counts and per-lot groups come from PostgreSQL.
  const lotStats = useMemo<LotStats[]>(
    () =>
      (dashboard?.lots ?? []).map((lot) => ({
        ...lot,
        key: panelLotLabel(lot.key),
        catalogName:
          Object.values(CATALOGS).find((c) => c.catalogKey === lot.catalogKey)?.catalogName ??
          "Seleção de catálogos",
        horse: lot.horse ?? "—",
        sources: new Map(Object.entries(lot.sources)),
        devices: new Map(Object.entries(lot.devices)),
        campaigns: new Map(Object.entries(lot.campaigns)),
        contents: new Map(Object.entries(lot.contents)),
      })),
    [dashboard],
  );

  const [sortKey, setSortKey] = useState<keyof LotStats>("uniqueViews");

  const lotsMostViewed = useMemo(
    () =>
      [...lotStats]
        .sort((a, b) => b.uniqueViews - a.uniqueViews || b.interested - a.interested)
        .slice(0, 20),
    [lotStats],
  );
  const lotsMostInterest = useMemo(
    () =>
      [...lotStats]
        .filter((l) => l.interested > 0)
        .sort((a, b) => b.interested - a.interested || b.uniqueViews - a.uniqueViews)
        .slice(0, 20),
    [lotStats],
  );
  const lotsSorted = useMemo(() => {
    const numeric = (l: LotStats) => {
      const value = l[sortKey];
      return typeof value === "number" ? value : 0;
    };
    return [...lotStats].sort((a, b) => numeric(b) - numeric(a) || a.lot.localeCompare(b.lot));
  }, [lotStats, sortKey]);
  const videosRanking = useMemo(
    () => lotStats.filter((l) => l.videoClicks > 0).sort((a, b) => b.videoClicks - a.videoClicks),
    [lotStats],
  );

  const catalogFunnel = {
    visitors: catalogTotals.sessions,
    viewedLot: catalogTotals.lotViewSessions,
    video: catalogTotals.videoSessions,
    interest: catalogTotals.interestSessions,
    whatsapp: catalogTotals.waSessions,
  };
  const catalogDaily = dashboard?.catalog_timeseries ?? [];
  const daily = dashboard?.timeseries ?? [];
  const bySource = dashboard?.breakdowns["source"] ?? [];
  const byCampaign = dashboard?.breakdowns["campaign"] ?? [];
  const byTerm = dashboard?.breakdowns["term"] ?? [];
  const byContent = dashboard?.breakdowns["content"] ?? [];
  const byUtmSource = dashboard?.breakdowns["utm_source"] ?? [];
  const metaIds = dashboard?.breakdowns["meta"] ?? [];
  const catalogBySource = dashboard?.catalog_breakdowns.source ?? [];
  const catalogByCampaign = dashboard?.catalog_breakdowns.campaign ?? [];
  const sourceOptions = dashboard?.filter_options.sources ?? [];
  const campaignOptions = dashboard?.filter_options.campaigns ?? [];
  const termOptions = dashboard?.filter_options.terms ?? [];
  const contentOptions = dashboard?.filter_options.contents ?? [];
  const deviceOptions = dashboard?.filter_options.devices ?? [];
  const lotOptions = lotKeys.map(panelLotLabel);

  const matchesSearch = useCallback(
    (value: string) => !search.trim() || value.toLowerCase().includes(search.trim().toLowerCase()),
    [search],
  );

  const lotDetail = useMemo(
    () => (openLot ? (lotStats.find((l) => l.key === openLot) ?? null) : null),
    [openLot, lotStats],
  );

  // Original timeline scope: the session in the selected period, independent of segmentation.
  const timelineFilters = useMemo<DashboardFilters>(
    () => ({
      ...periodFilters,
      session_id: timelineSession ?? "",
    }),
    [periodFilters, timelineSession],
  );
  useEffect(() => {
    const controller = new AbortController();
    const request = ++timelineRequest.current;
    setTimelinePage(null);
    setTimelineCursors([null]);
    setTimelineIndex(0);
    setTimelineError(null);
    if (!timelineSession) return () => controller.abort();
    setTimelineLoading(true);
    void panelGetTrackingEventsPage(null, timelineFilters, controller.signal).then((result) => {
      if (controller.signal.aborted || request !== timelineRequest.current) return;
      setTimelineLoading(false);
      if (result.unauthorized) {
        onSignedOut();
        return;
      }
      if (result.ok && result.page) setTimelinePage(result.page);
      else setTimelineError(result.error ?? "Não foi possível carregar esta sessão.");
    });
    return () => {
      controller.abort();
      timelineRequest.current += 1;
    };
  }, [timelineSession, timelineFilters, onSignedOut]);

  async function changeTimelinePage(nextIndex: number) {
    const cursor =
      nextIndex > timelineIndex ? timelinePage?.nextCursor : timelineCursors[nextIndex];
    if (nextIndex < 0 || (nextIndex > 0 && !cursor) || timelineLoading) return;
    const request = ++timelineRequest.current;
    setTimelineLoading(true);
    setTimelineError(null);
    const result = await panelGetTrackingEventsPage(cursor ?? null, timelineFilters);
    if (request !== timelineRequest.current) return;
    setTimelineLoading(false);
    if (result.unauthorized) {
      onSignedOut();
      return;
    }
    if (result.ok && result.page) {
      setTimelinePage(result.page);
      setTimelineCursors((previous) => [...previous.slice(0, nextIndex), cursor ?? null]);
      setTimelineIndex(nextIndex);
    } else setTimelineError(result.error ?? "Não foi possível carregar esta sessão.");
  }
  const timelineRows = [...(timelinePage?.events ?? [])].reverse();
  async function signOut() {
    await panelLogout();
    onSignedOut();
  }
  function exportCsv() {
    const link = document.createElement("a");
    link.href = panelExportUrl(activeFilters);
    link.download = `martendal-${exp}.csv`;
    link.click();
  }
  const empty = dashboard !== null && dashboard.summary.total_events === 0;
  const pageRows = recentEvents?.events ?? [];
  const pageCount = Math.max(1, Math.ceil((dashboard?.summary.total_events ?? 0) / 100));

  return (
    <div className="min-h-screen bg-[#050706] px-4 py-6 text-white sm:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 border-b border-white/10 pb-5">
        <img
          src={LOGO_URL}
          alt="Pecuária Martendal"
          width={48}
          height={48}
          className="h-12 w-auto"
        />
        <div className="mr-auto">
          <h1 className="text-lg font-bold leading-tight">Martendal Weekend 2026</h1>
          <p className="text-sm text-white/50">Painel de performance — squeeze e catálogo</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/80 transition hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 pt-6">
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

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["all", "Todos"],
                ["squeeze", "Squeeze"],
                ["catalog", "Catálogo"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                onClick={() => setExp(value)}
                className={`rounded-full border px-5 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                  exp === value
                    ? "border-[#e0bd45] bg-[#e0bd45]/15 text-[#e0bd45]"
                    : "border-white/15 text-white/60 hover:bg-white/5"
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={fCatalog}
              onChange={setFCatalog}
              placeholder="Catálogo"
              options={Object.values(CATALOGS).map((entry) => entry.label)}
            />
            <Select
              value={fSource}
              onChange={setFSource}
              placeholder="Origem"
              options={sourceOptions}
            />
            <Select
              value={fCampaign}
              onChange={setFCampaign}
              placeholder="Campanha"
              options={campaignOptions}
            />
            <Select
              value={fTerm}
              onChange={setFTerm}
              placeholder="Conjunto"
              options={termOptions}
            />
            <Select
              value={fContent}
              onChange={setFContent}
              placeholder="Criativo"
              options={contentOptions}
            />
            <Select
              value={fDevice}
              onChange={setFDevice}
              placeholder="Dispositivo"
              options={deviceOptions}
            />
            <Select
              value={fEvent}
              onChange={setFEvent}
              placeholder="Tipo de evento"
              options={Object.keys(EVENT_LABELS)}
            />
            <Select value={fLot} onChange={setFLot} placeholder="Lote" options={lotOptions} />
            <input
              value={lotSearch}
              onChange={(e) => setLotSearch(e.target.value)}
              placeholder="Buscar lote ou animal…"
              className="rounded-lg border border-white/15 bg-[#0B100D] px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          </div>
        </section>

        {loadError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Não foi possível carregar os dados: {loadError}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/60" role="status">
            Carregando métricas…
          </p>
        ) : null}
        {dashboard && !loading && !loadError ? (
          <>
            {/* Visão geral */}
            <Panel title="Visão geral">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Card title="Acessos" value={String(totals.views)} />
                <Card title="Visitantes únicos" value={String(totals.uniques)} />
                <Card title="Cliques no WhatsApp" value={String(totals.clicks)} />
                <Card
                  title="Taxa de avanço"
                  value={pct(totals.rate)}
                  hint={`${totals.clickSessions} sessões com clique`}
                />
              </div>
            </Panel>

            {empty ? (
              <p className="rounded-xl border border-white/10 bg-[#0B100D] p-6 text-center text-white/60">
                Nenhum dado neste período.
              </p>
            ) : null}

            {/* SQUEEZE */}
            {showSqueeze ? (
              <Panel title="Squeeze (tráfego pago)">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Card title="Acessos" value={String(squeezeTotals.views)} />
                  <Card title="Visitantes únicos" value={String(squeezeTotals.uniques)} />
                  <Card title="Cliques no WhatsApp" value={String(squeezeTotals.clicks)} />
                  <Card
                    title="Taxa de avanço"
                    value={pct(squeezeTotals.rate)}
                    hint={`${squeezeTotals.clickSessions} sessões com clique`}
                  />
                </div>
                <div className="mt-4 flex flex-col items-center gap-1 text-center">
                  <FunnelStep value={squeezeTotals.views} text="acessos" />
                  <span className="text-white/30">↓</span>
                  <FunnelStep value={squeezeTotals.uniques} text="visitantes únicos" />
                  <span className="text-white/30">↓</span>
                  <FunnelStep
                    value={squeezeTotals.clickSessions}
                    text="sessões que abriram o WhatsApp"
                  />
                </div>
              </Panel>
            ) : null}

            {/* CATÁLOGO */}
            {showCatalog ? (
              <>
                <Panel title="Catálogo digital">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Card title="Acessos ao catálogo" value={String(catalogTotals.views)} />
                    <Card title="Visitantes únicos" value={String(catalogTotals.sessions)} />
                    <Card
                      title="Lotes visualizados"
                      value={String(catalogTotals.lotViewsUnique)}
                      hint={`${catalogTotals.lotViewsTotal} visualizações totais`}
                    />
                    <Card
                      title="Lotes com interesse"
                      value={String(catalogTotals.lotInterestUnique)}
                      hint={`${catalogTotals.interestSessions} sessões interessadas`}
                    />
                    <Card
                      title="Cliques no WhatsApp"
                      value={String(catalogTotals.waClicks)}
                      hint={`${catalogTotals.waSessions} sessões com clique`}
                    />
                    <Card
                      title="Cliques em vídeos"
                      value={String(catalogTotals.videos)}
                      hint={`${catalogTotals.videoSessions} sessões`}
                    />
                    <Card title="Downloads do PDF" value={String(catalogTotals.pdfs)} />
                    <Card
                      title="Taxa de interesse"
                      value={pct(catalogTotals.interestRate)}
                      hint={`Avanço p/ WhatsApp: ${pct(catalogTotals.advanceRate)}`}
                    />
                  </div>
                </Panel>

                <Panel title="Funil do catálogo">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <FunnelStep value={catalogFunnel.visitors} text="visitantes do catálogo" />
                    <span className="text-white/30">↓</span>
                    <FunnelStep
                      value={catalogFunnel.viewedLot}
                      text="visualizaram pelo menos um lote"
                    />
                    <p className="text-xs text-white/40">
                      ({catalogFunnel.video} clicaram em pelo menos um vídeo — etapa opcional)
                    </p>
                    <span className="text-white/30">↓</span>
                    <FunnelStep
                      value={catalogFunnel.interest}
                      text="demonstraram interesse em lote"
                    />
                    <span className="text-white/30">↓</span>
                    <FunnelStep value={catalogFunnel.whatsapp} text="abriram o WhatsApp" />
                    <p className="mt-2 text-sm font-semibold text-[#e0bd45]">
                      Taxa de interesse: {pct(catalogTotals.interestRate)} · Avanço para WhatsApp:{" "}
                      {pct(catalogTotals.advanceRate)}
                    </p>
                  </div>
                </Panel>

                <Panel title="Lotes mais visualizados">
                  <LotTable rows={lotsMostViewed} onOpen={setOpenLot} />
                </Panel>

                <Panel title="Lotes com maior interesse">
                  {lotsMostInterest.length ? (
                    <LotTable rows={lotsMostInterest} onOpen={setOpenLot} ranked />
                  ) : (
                    <p className="text-sm text-white/55">
                      Nenhum interesse registrado neste período.
                    </p>
                  )}
                </Panel>

                <Panel title="Desempenho por lote">
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    {(
                      [
                        ["uniqueViews", "Visualizações únicas"],
                        ["totalViews", "Visualizações totais"],
                        ["videoClicks", "Cliques de vídeo"],
                        ["waClicks", "Cliques WhatsApp"],
                        ["interested", "Interessados únicos"],
                        ["rate", "Taxa de interesse"],
                      ] as const
                    ).map(([key, text]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSortKey(key)}
                        className={`rounded-full border px-3 py-1 font-semibold transition ${
                          sortKey === key
                            ? "border-[#1c7a45] bg-[#1c7a45]/25 text-white"
                            : "border-white/15 text-white/60"
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  <LotTable rows={lotsSorted} onOpen={setOpenLot} full />
                </Panel>

                <Panel title="Vídeos mais clicados">
                  {videosRanking.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-white/45">
                          <tr>
                            <th className="py-2 pr-3">Lote</th>
                            <th className="py-2 pr-3">Animal</th>
                            <th className="py-2 pr-3">Cliques no vídeo</th>
                            <th className="py-2 pr-3">Sessões únicas</th>
                            <th className="py-2">WhatsApp depois do vídeo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {videosRanking.map((row) => (
                            <tr key={row.key} className="border-t border-white/8 text-white/80">
                              <td className="py-2 pr-3 font-semibold whitespace-nowrap">
                                {row.key}
                              </td>
                              <td className="py-2 pr-3">{row.horse}</td>
                              <td className="py-2 pr-3">{row.videoClicks}</td>
                              <td className="py-2 pr-3">{row.videoSessions}</td>
                              <td className="py-2 font-semibold text-[#3ddc84]">
                                {row.videoThenWa}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-white/55">Nenhum clique em vídeo neste período.</p>
                  )}
                </Panel>

                <Panel title="Origens do catálogo">
                  <CatalogStatsTable rows={catalogBySource} firstColumn="Origem" />
                </Panel>

                <Panel title="Campanhas do catálogo">
                  <CatalogStatsTable
                    rows={catalogByCampaign.filter((r) => matchesSearch(r.key))}
                    firstColumn="Campanha"
                  />
                </Panel>

                <Panel title="Desempenho do catálogo por dia">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={catalogDaily}>
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
                        <Bar
                          dataKey="visitantes"
                          name="Visitantes"
                          fill="#1c7a45"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="lotes"
                          name="Lotes visualizados"
                          fill="#2f9d63"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="interesses"
                          name="Interesses em lotes"
                          fill="#e0bd45"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="whatsapp"
                          name="Cliques WhatsApp"
                          fill="#3ddc84"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </>
            ) : null}

            {/* Busca de campanhas */}
            <div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campanha, conjunto ou criativo…"
                className="w-full rounded-xl border border-white/15 bg-[#0B100D] px-4 py-2.5 text-sm text-white placeholder:text-white/40"
              />
            </div>

            <Panel title="Acessos por origem">
              <StatsTable rows={bySource} firstColumn="Origem" />
            </Panel>

            <Panel title="Origem do tráfego (utm_source)">
              <StatsTable
                rows={byUtmSource.filter((r) => matchesSearch(r.key))}
                firstColumn="utm_source"
              />
            </Panel>

            <Panel title="Desempenho por campanha">
              <StatsTable
                rows={byCampaign.filter((r) => matchesSearch(r.key))}
                firstColumn="Campanha"
              />
            </Panel>

            <Panel title="Desempenho por conjunto / público">
              <StatsTable
                rows={byTerm.filter((r) => matchesSearch(r.key))}
                firstColumn="Conjunto / Público"
              />
            </Panel>

            <Panel title="Desempenho por criativo">
              <StatsTable
                rows={byContent.filter((r) => matchesSearch(r.key))}
                firstColumn="Criativo"
              />
            </Panel>

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
                    <Bar
                      dataKey="cliques"
                      name="Cliques no WhatsApp"
                      fill="#e0bd45"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="IDs do Meta (diagnóstico)">
              <StatsTable rows={metaIds} firstColumn="campaign_id / adset_id / ad_id" />
            </Panel>

            {/* Eventos recentes */}
          </>
        ) : null}
        <Panel title="Eventos recentes">
          {eventsLoading ? (
            <p className="mb-3 text-sm text-white/60" role="status">
              Carregando eventos…
            </p>
          ) : null}
          {eventsError ? (
            <p className="mb-3 text-sm text-red-300" role="alert">
              {eventsError}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="py-2 pr-3">Data/Hora</th>
                  <th className="py-2 pr-3">Origem</th>
                  <th className="py-2 pr-3">Experiência</th>
                  <th className="py-2 pr-3">Lote / Animal</th>
                  <th className="py-2 pr-3">Campanha</th>
                  <th className="py-2 pr-3">Criativo</th>
                  <th className="py-2 pr-3">Dispositivo</th>
                  <th className="py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-t border-white/8 text-white/80">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="py-2 pr-3">{label(row.traffic_source, "—")}</td>
                    <td className="py-2 pr-3">
                      {experienceOf(row) === "catalog" ? catalogLabel(row) : "Squeeze"}
                    </td>
                    <td className="py-2 pr-3">
                      {row.lot_number
                        ? `${lotLabel(row.lot_number)}${row.horse_name ? ` — ${row.horse_name}` : ""}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3">{label(row.utm_campaign, "—")}</td>
                    <td className="py-2 pr-3">{label(row.utm_content, "—")}</td>
                    <td className="py-2 pr-3">{label(row.device_type, "—")}</td>
                    <td className="py-2 whitespace-nowrap font-semibold">
                      <button
                        type="button"
                        onClick={() => setTimelineSession(sid(row))}
                        className={
                          CLICK_EVENTS.has(row.event_type)
                            ? "text-[#3ddc84] underline-offset-2 hover:underline"
                            : "text-white/60 underline-offset-2 hover:underline"
                        }
                      >
                        {EVENT_LABELS[row.event_type] ?? row.event_type}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageRows.length === 0 && !eventsLoading && !eventsError ? (
            <p className="mt-3 text-sm text-white/55">Nenhum dado neste período.</p>
          ) : (
            <div className="mt-3 flex items-center justify-between text-sm text-white/60">
              <span>
                {dashboard?.summary.total_events ?? "—"} eventos · página {page + 1} de {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0 || eventsLoading}
                  onClick={() => void changeEventsPage(page - 1)}
                  className="rounded-lg border border-white/15 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!recentEvents?.hasMore || eventsLoading}
                  onClick={() => void changeEventsPage(page + 1)}
                  className="rounded-lg border border-white/15 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </Panel>
      </main>

      {lotDetail ? <LotDetail lot={lotDetail} onClose={() => setOpenLot(null)} /> : null}
      {timelineSession ? (
        <Drawer title="Sequência da sessão (anônima)" onClose={() => setTimelineSession(null)}>
          {timelineLoading ? (
            <p className="mb-3 text-sm text-white/60" role="status">
              Carregando sessão…
            </p>
          ) : null}
          {timelineError ? (
            <p className="mb-3 text-sm text-red-300" role="alert">
              {timelineError}
            </p>
          ) : null}
          <ul className="space-y-2 text-sm">
            {timelineRows.map((row) => (
              <li key={row.id} className="flex gap-3 text-white/75">
                <span className="w-12 shrink-0 text-white/45">
                  {timeFmt.format(new Date(row.created_at))}
                </span>
                <span>
                  {EVENT_LABELS[row.event_type] ?? row.event_type}
                  {experienceOf(row) === "catalog" && !row.lot_number
                    ? ` · ${catalogLabel(row)}`
                    : ""}
                  {row.lot_number
                    ? ` · ${lotIdentity(row)}${row.horse_name ? ` — ${row.horse_name}` : ""}`
                    : ""}
                </span>
              </li>
            ))}
            {timelineRows.length === 0 && !timelineLoading && !timelineError ? (
              <li className="text-white/55">Nenhum evento nesta sessão.</li>
            ) : null}
          </ul>
          <div className="mt-4 flex gap-2 text-sm">
            <button
              type="button"
              disabled={timelineIndex === 0 || timelineLoading}
              onClick={() => void changeTimelinePage(timelineIndex - 1)}
              className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40"
            >
              Mais recentes
            </button>
            <button
              type="button"
              disabled={!timelinePage?.hasMore || timelineLoading}
              onClick={() => void changeTimelinePage(timelineIndex + 1)}
              className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40"
            >
              Mais antigos
            </button>
          </div>
        </Drawer>
      ) : null}
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
    return <p className="text-sm text-white/50">Nenhum dado neste período.</p>;
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

function CatalogStatsTable({
  rows,
  firstColumn,
}: {
  rows: CatalogGroupStats[];
  firstColumn: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/50">Nenhum dado neste período.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="py-2 pr-3">{firstColumn}</th>
            <th className="py-2 pr-3">Visitantes</th>
            <th className="py-2 pr-3">Lotes visualizados</th>
            <th className="py-2 pr-3">Interessados</th>
            <th className="py-2 pr-3">Cliques WhatsApp</th>
            <th className="py-2">Taxa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-white/8 text-white/80">
              <td className="py-2 pr-3 break-all">{row.key}</td>
              <td className="py-2 pr-3">{row.sessions}</td>
              <td className="py-2 pr-3">{row.lotViews}</td>
              <td className="py-2 pr-3">{row.interested}</td>
              <td className="py-2 pr-3 font-semibold text-[#3ddc84]">{row.clicks}</td>
              <td className="py-2">{pct(row.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LotTable({
  rows,
  onOpen,
  full,
  ranked,
}: {
  rows: LotStats[];
  onOpen: (lot: string) => void;
  full?: boolean;
  ranked?: boolean;
}) {
  if (!rows.length) return <p className="text-sm text-white/55">Nenhum dado neste período.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-white/45">
          <tr>
            {ranked ? <th className="py-2 pr-3">#</th> : null}
            <th className="py-2 pr-3">Lote</th>
            <th className="py-2 pr-3">Animal</th>
            <th className="py-2 pr-3">Visualizações únicas</th>
            <th className="py-2 pr-3">Visualizações totais</th>
            {full ? <th className="py-2 pr-3">Cliques de vídeo</th> : null}
            <th className="py-2 pr-3">Cliques WhatsApp</th>
            <th className="py-2 pr-3">Interessados únicos</th>
            <th className="py-2 pr-3">Taxa de interesse</th>
            {full ? <th className="py-2">Principal origem</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.key}
              onClick={() => onOpen(row.key)}
              className="cursor-pointer border-t border-white/8 text-white/80 transition hover:bg-white/5"
            >
              {ranked ? <td className="py-2 pr-3 text-white/50">{index + 1}</td> : null}
              <td className="py-2 pr-3 font-semibold whitespace-nowrap">{row.key}</td>
              <td className="py-2 pr-3">{row.horse}</td>
              <td className="py-2 pr-3">{row.uniqueViews}</td>
              <td className="py-2 pr-3 text-white/60">{row.totalViews}</td>
              {full ? <td className="py-2 pr-3">{row.videoClicks}</td> : null}
              <td className="py-2 pr-3">{row.waClicks}</td>
              <td className="py-2 pr-3 font-semibold text-[#3ddc84]">{row.interested}</td>
              <td className="py-2 pr-3">{pct(row.rate)}</td>
              {full ? <td className="py-2">{row.topSource}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 p-0 sm:p-4">
      <div className="h-full w-full max-w-md overflow-y-auto rounded-none border border-white/10 bg-[#0B100D] p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-start gap-3">
          <h3 className="mr-auto text-sm font-bold uppercase tracking-wide text-[#e0bd45]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-3 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MiniList({ title, entries }: { title: string; entries: [string, number][] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{title}</p>
      {entries.length ? (
        <ul className="mt-2 space-y-1 text-sm text-white/75">
          {entries.map(([key, value]) => (
            <li key={key} className="flex justify-between gap-3">
              <span className="break-all">{key}</span>
              <span className="font-semibold">{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-white/45">Nenhum dado neste período.</p>
      )}
    </div>
  );
}

function LotDetail({ lot, onClose }: { lot: LotStats; onClose: () => void }) {
  const campaigns = [...lot.campaigns.entries()].sort((a, b) => b[1].views - a[1].views);
  const contents = [...lot.contents.entries()].sort((a, b) => b[1].views - a[1].views);
  return (
    <Drawer title={`${lot.key} — ${lot.horse}`} onClose={onClose}>
      <p className="mb-4 text-sm text-white/70">{lot.catalogName}</p>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Visualizações únicas" value={String(lot.uniqueViews)} />
        <Card title="Visualizações totais" value={String(lot.totalViews)} />
        <Card title="Cliques de vídeo" value={String(lot.videoClicks)} />
        <Card title="Cliques WhatsApp" value={String(lot.waClicks)} />
        <Card title="Interessados únicos" value={String(lot.interested)} />
        <Card title="Taxa de interesse" value={pct(lot.rate)} />
      </div>

      <MiniList
        title="Origem do tráfego"
        entries={[...lot.sources.entries()].sort((a, b) => b[1] - a[1])}
      />
      <MiniList
        title="Dispositivos"
        entries={[...lot.devices.entries()].sort((a, b) => b[1] - a[1])}
      />

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Campanhas</p>
        {campaigns.length ? (
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/40">
              <tr>
                <th className="py-1 pr-2">Campanha</th>
                <th className="py-1 pr-2">Views</th>
                <th className="py-1 pr-2">Interessados</th>
                <th className="py-1">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(([key, v]) => (
                <tr key={key} className="border-t border-white/8 text-white/75">
                  <td className="py-1 pr-2 break-all">{key}</td>
                  <td className="py-1 pr-2">{v.views}</td>
                  <td className="py-1 pr-2">{v.interested}</td>
                  <td className="py-1">{v.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-1 text-sm text-white/45">Nenhum dado neste período.</p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Criativos</p>
        {contents.length ? (
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs uppercase text-white/40">
              <tr>
                <th className="py-1 pr-2">Criativo</th>
                <th className="py-1 pr-2">Views</th>
                <th className="py-1 pr-2">Interessados</th>
                <th className="py-1">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {contents.map(([key, v]) => (
                <tr key={key} className="border-t border-white/8 text-white/75">
                  <td className="py-1 pr-2 break-all">{key}</td>
                  <td className="py-1 pr-2">{v.views}</td>
                  <td className="py-1 pr-2">{v.interested}</td>
                  <td className="py-1">{v.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-1 text-sm text-white/45">Nenhum dado neste período.</p>
        )}
      </div>

      {lot.videoUrl ? (
        <a
          href={lot.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block text-sm font-semibold text-[#e0bd45] underline-offset-2 hover:underline"
        >
          Abrir vídeo do lote
        </a>
      ) : null}
    </Drawer>
  );
}
