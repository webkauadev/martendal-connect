import { CATALOGS } from "@/lib/catalog-tracking-contract";
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

import {
  panelGetTrackingEvents,
  panelLogin,
  panelLogout,
  panelSessionValid,
} from "@/lib/panel-auth";

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

const VIEW_EVENTS = new Set(["page_view", "catalog_view"]);
const CLICK_EVENTS = new Set(["whatsapp_click", "catalog_whatsapp_click", "lot_whatsapp_click"]);

type EventType =
  | "page_view"
  | "whatsapp_click"
  | "catalog_view"
  | "lot_view"
  | "lot_whatsapp_click"
  | "catalog_whatsapp_click"
  | "catalog_video_click"
  | "pdf_download"
  | "catalog_selector_view"
  | "catalog_selected";

type EventRow = {
  id: string;
  event_type: EventType;
  lot_number: string | null;
  horse_name: string | null;
  video_url: string | null;
  catalog_name: string | null;
  catalog_key: string | null;
  experience_type: string | null;
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

function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
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
  if (
    row.catalog_key === "femeas" ||
    row.catalog_name === CATALOGS.femeas.catalogName ||
    row.landing_path === CATALOGS.femeas.path
  )
    return CATALOGS.femeas.catalogName;
  if (
    row.catalog_key === "machos" ||
    row.catalog_name === CATALOGS.machos.catalogName ||
    row.lot_number
  )
    return CATALOGS.machos.catalogName;
  return "Seleção de catálogos";
}
function catalogLabel(row: EventRow): string {
  const name = catalogName(row);
  return name === CATALOGS.femeas.catalogName
    ? "Fêmeas Elite"
    : name === CATALOGS.machos.catalogName
      ? "Machos"
      : name;
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

type Period = "today" | "yesterday" | "7d" | "all" | "custom";
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

function startOfDayTz(offsetDays: number): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const base = new Date(`${parts}T00:00:00-04:00`);
  base.setDate(base.getDate() + offsetDays);
  return base;
}

function groupBy(rows: EventRow[], pick: (r: EventRow) => string): GroupStats[] {
  const map = new Map<
    string,
    { views: number; clicks: number; vs: Set<string>; cs: Set<string> }
  >();
  for (const row of rows) {
    const key = pick(row);
    let entry = map.get(key);
    if (!entry) {
      entry = { views: 0, clicks: 0, vs: new Set(), cs: new Set() };
      map.set(key, entry);
    }
    if (VIEW_EVENTS.has(row.event_type)) {
      entry.views += 1;
      entry.vs.add(sid(row));
    } else if (CLICK_EVENTS.has(row.event_type)) {
      entry.clicks += 1;
      entry.cs.add(sid(row));
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

function groupCatalogBy(rows: EventRow[], pick: (r: EventRow) => string): CatalogGroupStats[] {
  const map = new Map<
    string,
    {
      sessions: Set<string>;
      lotViews: Set<string>;
      interested: Set<string>;
      clicks: number;
      clickSessions: Set<string>;
    }
  >();
  for (const row of rows) {
    const key = pick(row);
    let entry = map.get(key);
    if (!entry) {
      entry = {
        sessions: new Set(),
        lotViews: new Set(),
        interested: new Set(),
        clicks: 0,
        clickSessions: new Set(),
      };
      map.set(key, entry);
    }
    const session = sid(row);
    entry.sessions.add(session);
    if (row.event_type === "lot_view" && row.lot_number) {
      entry.lotViews.add(`${session}:${lotIdentity(row)}`);
    }
    if (row.event_type === "lot_whatsapp_click") {
      entry.interested.add(session);
    }
    if (CLICK_EVENTS.has(row.event_type)) {
      entry.clicks += 1;
      entry.clickSessions.add(session);
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      sessions: v.sessions.size,
      lotViews: v.lotViews.size,
      interested: v.interested.size,
      clicks: v.clicks,
      rate: v.sessions.size ? (v.clickSessions.size / v.sessions.size) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.sessions - a.sessions);
}

function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exp, setExp] = useState<Experience>("all");
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

  const load = useCallback(async () => {
    setLoading(true);

    const result = await panelGetTrackingEvents();

    if (!result.ok) {
      if (result.unauthorized) {
        setLoading(false);
        onSignedOut();
        return;
      }

      setLoadError(result.error ?? "Não foi possível carregar os dados do painel.");
      setLoading(false);
      return;
    }

    setLoadError(null);
    setRows(result.events as EventRow[]);
    setLoading(false);
  }, [onSignedOut]);

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

  // Filtros comuns (experiência + segmentações)
  const filtered = useMemo(() => {
    const q = lotSearch.trim().toLowerCase();
    return periodRows.filter((r) => {
      if (exp !== "all" && experienceOf(r) !== exp) return false;
      if (fSource && label(r.traffic_source, "Direto / Desconhecido") !== fSource) return false;
      if (fCampaign && label(r.utm_campaign, "Sem campanha identificada") !== fCampaign)
        return false;
      if (fTerm && label(r.utm_term, "Sem conjunto identificado") !== fTerm) return false;
      if (fContent && label(r.utm_content, "Sem criativo identificado") !== fContent) return false;
      if (fDevice && label(r.device_type, "Unknown") !== fDevice) return false;
      if (fEvent && r.event_type !== fEvent) return false;
      if (fLot && lotIdentity(r) !== fLot) return false;
      if (q) {
        const hay = `${r.lot_number ?? ""} ${r.horse_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [periodRows, exp, fSource, fCampaign, fTerm, fContent, fDevice, fEvent, fLot, lotSearch]);

  useEffect(() => {
    setPage(0);
  }, [filtered]);

  const showCatalog = exp !== "squeeze";
  const showSqueeze = exp !== "catalog";

  const catalogRows = useMemo(
    () => filtered.filter((r) => experienceOf(r) === "catalog"),
    [filtered],
  );
  const squeezeRows = useMemo(
    () => filtered.filter((r) => experienceOf(r) === "squeeze"),
    [filtered],
  );

  // ---- Cards gerais ----
  const totals = useMemo(() => {
    const views = filtered.filter((r) => VIEW_EVENTS.has(r.event_type));
    const clicks = filtered.filter((r) => CLICK_EVENTS.has(r.event_type));
    const viewSessions = new Set(views.map(sid));
    const clickSessions = new Set(clicks.map(sid));
    return {
      views: views.length,
      uniques: viewSessions.size,
      clicks: clicks.length,
      clickSessions: clickSessions.size,
      rate: viewSessions.size ? (clickSessions.size / viewSessions.size) * 100 : 0,
    };
  }, [filtered]);

  const squeezeTotals = useMemo(() => {
    const views = squeezeRows.filter((r) => r.event_type === "page_view");
    const clicks = squeezeRows.filter((r) => r.event_type === "whatsapp_click");
    const vs = new Set(views.map(sid));
    const cs = new Set(clicks.map(sid));
    return {
      views: views.length,
      uniques: vs.size,
      clicks: clicks.length,
      clickSessions: cs.size,
      rate: vs.size ? (cs.size / vs.size) * 100 : 0,
    };
  }, [squeezeRows]);

  // ---- Catálogo ----
  const catalogTotals = useMemo(() => {
    const views = catalogRows.filter((r) => r.event_type === "catalog_view");
    const sessions = new Set(views.map(sid));
    const lotViewRows = catalogRows.filter((r) => r.event_type === "lot_view");
    const lotViewUnique = new Set(
      lotViewRows.filter((r) => r.lot_number).map((r) => `${sid(r)}:${lotIdentity(r)}`),
    );
    const lotViewSessions = new Set(lotViewRows.map(sid));
    const lotClicks = catalogRows.filter((r) => r.event_type === "lot_whatsapp_click");
    const lotInterestUnique = new Set(
      lotClicks.filter((r) => r.lot_number).map((r) => `${sid(r)}:${lotIdentity(r)}`),
    );
    const interestSessions = new Set(lotClicks.map(sid));
    const globalClicks = catalogRows.filter((r) => r.event_type === "catalog_whatsapp_click");
    const videos = catalogRows.filter((r) => r.event_type === "catalog_video_click");
    const videoSessions = new Set(videos.map(sid));
    const pdfs = catalogRows.filter((r) => r.event_type === "pdf_download");
    const waSessions = new Set([...lotClicks, ...globalClicks].map(sid));
    return {
      views: views.length,
      sessions: sessions.size,
      lotViewsUnique: lotViewUnique.size,
      lotViewsTotal: lotViewRows.length,
      lotViewSessions: lotViewSessions.size,
      lotInterestUnique: lotInterestUnique.size,
      interestSessions: interestSessions.size,
      waClicks: lotClicks.length + globalClicks.length,
      waSessions: waSessions.size,
      videos: videos.length,
      videoSessions: videoSessions.size,
      pdfs: pdfs.length,
      interestRate: lotViewSessions.size ? (interestSessions.size / lotViewSessions.size) * 100 : 0,
      advanceRate: sessions.size ? (waSessions.size / sessions.size) * 100 : 0,
    };
  }, [catalogRows]);

  const lotStats = useMemo<LotStats[]>(() => {
    type Acc = {
      key: string;
      catalogName: string;
      lot: string;
      horse: string;
      viewSessions: Set<string>;
      totalViews: number;
      videoClicks: number;
      videoSessions: Set<string>;
      waClicks: number;
      interestSessions: Set<string>;
      sources: Map<string, number>;
      campaigns: Map<string, { views: number; interested: number; clicks: number }>;
      contents: Map<string, { views: number; interested: number; clicks: number }>;
      devices: Map<string, number>;
      videoUrl: string | null;
    };
    const map = new Map<string, Acc>();
    const bump = (m: Map<string, number>, key: string) => m.set(key, (m.get(key) ?? 0) + 1);
    const bump3 = (
      m: Map<string, { views: number; interested: number; clicks: number }>,
      key: string,
      field: "views" | "interested" | "clicks",
    ) => {
      const entry = m.get(key) ?? { views: 0, interested: 0, clicks: 0 };
      entry[field] += 1;
      m.set(key, entry);
    };

    for (const row of catalogRows) {
      if (!row.lot_number) continue;
      let acc = map.get(lotIdentity(row));
      if (!acc) {
        acc = {
          key: lotIdentity(row),
          catalogName: catalogName(row),
          lot: row.lot_number,
          horse: row.horse_name ?? "—",
          viewSessions: new Set(),
          totalViews: 0,
          videoClicks: 0,
          videoSessions: new Set(),
          waClicks: 0,
          interestSessions: new Set(),
          sources: new Map(),
          campaigns: new Map(),
          contents: new Map(),
          devices: new Map(),
          videoUrl: null,
        };
        map.set(lotIdentity(row), acc);
      }
      if (row.horse_name) acc.horse = row.horse_name;
      if (row.video_url) acc.videoUrl = row.video_url;
      const session = sid(row);
      const source = label(row.traffic_source, "Direto / Desconhecido");
      const campaign = label(row.utm_campaign, "Sem campanha identificada");
      const content = label(row.utm_content, "Sem criativo identificado");

      if (row.event_type === "lot_view") {
        acc.totalViews += 1;
        acc.viewSessions.add(session);
        bump(acc.sources, source);
        bump(acc.devices, label(row.device_type, "Unknown"));
        bump3(acc.campaigns, campaign, "views");
        bump3(acc.contents, content, "views");
      } else if (row.event_type === "lot_whatsapp_click") {
        acc.waClicks += 1;
        acc.interestSessions.add(session);
        bump3(acc.campaigns, campaign, "clicks");
        bump3(acc.contents, content, "clicks");
      } else if (row.event_type === "catalog_video_click") {
        acc.videoClicks += 1;
        acc.videoSessions.add(session);
      }
    }

    // interessados únicos por campanha/criativo (sessão distinta)
    const seenCampaign = new Set<string>();
    const seenContent = new Set<string>();
    for (const row of catalogRows) {
      if (row.event_type !== "lot_whatsapp_click" || !row.lot_number) continue;
      const acc = map.get(lotIdentity(row));
      if (!acc) continue;
      const session = sid(row);
      const campaign = label(row.utm_campaign, "Sem campanha identificada");
      const content = label(row.utm_content, "Sem criativo identificado");
      const ck = `${lotIdentity(row)}:${campaign}:${session}`;
      if (!seenCampaign.has(ck)) {
        seenCampaign.add(ck);
        bump3(acc.campaigns, campaign, "interested");
      }
      const tk = `${lotIdentity(row)}:${content}:${session}`;
      if (!seenContent.has(tk)) {
        seenContent.add(tk);
        bump3(acc.contents, content, "interested");
      }
    }

    return [...map.values()].map((acc) => {
      let videoThenWa = 0;
      for (const session of acc.videoSessions) {
        if (acc.interestSessions.has(session)) videoThenWa += 1;
      }
      const topSource = [...acc.sources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        key: acc.key,
        catalogName: acc.catalogName,
        lot: acc.lot,
        horse: acc.horse,
        uniqueViews: acc.viewSessions.size,
        totalViews: acc.totalViews,
        videoClicks: acc.videoClicks,
        videoSessions: acc.videoSessions.size,
        waClicks: acc.waClicks,
        interested: acc.interestSessions.size,
        videoThenWa,
        rate: acc.viewSessions.size ? (acc.interestSessions.size / acc.viewSessions.size) * 100 : 0,
        topSource,
        sources: acc.sources,
        campaigns: acc.campaigns,
        contents: acc.contents,
        devices: acc.devices,
        videoUrl: acc.videoUrl,
      };
    });
  }, [catalogRows]);

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

  const catalogFunnel = useMemo(() => {
    const visitors = new Set(catalogRows.filter((r) => r.event_type === "catalog_view").map(sid));
    const viewedLot = new Set(catalogRows.filter((r) => r.event_type === "lot_view").map(sid));
    const video = new Set(
      catalogRows.filter((r) => r.event_type === "catalog_video_click").map(sid),
    );
    const interest = new Set(
      catalogRows.filter((r) => r.event_type === "lot_whatsapp_click").map(sid),
    );
    const whatsapp = new Set(
      catalogRows
        .filter(
          (r) => r.event_type === "lot_whatsapp_click" || r.event_type === "catalog_whatsapp_click",
        )
        .map(sid),
    );
    return {
      visitors: visitors.size,
      viewedLot: viewedLot.size,
      video: video.size,
      interest: interest.size,
      whatsapp: whatsapp.size,
    };
  }, [catalogRows]);

  const catalogDaily = useMemo(() => {
    const map = new Map<
      string,
      {
        day: string;
        ts: number;
        visitantes: Set<string>;
        lotes: Set<string>;
        interesses: Set<string>;
        whatsapp: number;
      }
    >();
    for (const row of catalogRows) {
      const key = dayKey(row.created_at);
      const ts = new Date(row.created_at).getTime();
      let entry = map.get(key);
      if (!entry) {
        entry = {
          day: key,
          ts,
          visitantes: new Set(),
          lotes: new Set(),
          interesses: new Set(),
          whatsapp: 0,
        };
        map.set(key, entry);
      }
      entry.ts = Math.min(entry.ts, ts);
      const session = sid(row);
      if (row.event_type === "catalog_view") entry.visitantes.add(session);
      if (row.event_type === "lot_view" && row.lot_number) {
        entry.lotes.add(`${session}:${lotIdentity(row)}`);
      }
      if (row.event_type === "lot_whatsapp_click" && row.lot_number) {
        entry.interesses.add(`${session}:${lotIdentity(row)}`);
      }
      if (CLICK_EVENTS.has(row.event_type)) entry.whatsapp += 1;
    }
    return [...map.values()]
      .sort((a, b) => a.ts - b.ts)
      .map((e) => ({
        day: e.day,
        visitantes: e.visitantes.size,
        lotes: e.lotes.size,
        interesses: e.interesses.size,
        whatsapp: e.whatsapp,
      }));
  }, [catalogRows]);

  // ---- Agrupamentos gerais ----
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
  const catalogBySource = useMemo(
    () => groupCatalogBy(catalogRows, (r) => label(r.traffic_source, "Direto / Desconhecido")),
    [catalogRows],
  );
  const catalogByCampaign = useMemo(
    () => groupCatalogBy(catalogRows, (r) => label(r.utm_campaign, "Sem campanha identificada")),
    [catalogRows],
  );

  const daily = useMemo(() => {
    const map = new Map<string, { day: string; ts: number; acessos: number; cliques: number }>();
    for (const row of filtered) {
      const key = dayKey(row.created_at);
      const ts = new Date(row.created_at).getTime();
      let entry = map.get(key);
      if (!entry) {
        entry = { day: key, ts, acessos: 0, cliques: 0 };
        map.set(key, entry);
      }
      entry.ts = Math.min(entry.ts, ts);
      if (VIEW_EVENTS.has(row.event_type)) entry.acessos += 1;
      else if (CLICK_EVENTS.has(row.event_type)) entry.cliques += 1;
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

  const options = useCallback(
    (pick: (r: EventRow) => string) => [...new Set((rows ?? []).map(pick))].sort(),
    [rows],
  );
  const sourceOptions = useMemo(
    () => options((r) => label(r.traffic_source, "Direto / Desconhecido")),
    [options],
  );
  const campaignOptions = useMemo(
    () => options((r) => label(r.utm_campaign, "Sem campanha identificada")),
    [options],
  );
  const termOptions = useMemo(
    () => options((r) => label(r.utm_term, "Sem conjunto identificado")),
    [options],
  );
  const contentOptions = useMemo(
    () => options((r) => label(r.utm_content, "Sem criativo identificado")),
    [options],
  );
  const deviceOptions = useMemo(() => options((r) => label(r.device_type, "Unknown")), [options]);
  const lotOptions = useMemo(
    () =>
      [...new Set((rows ?? []).filter((r) => r.lot_number).map(lotIdentity))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );

  const matchesSearch = useCallback(
    (value: string) => !search.trim() || value.toLowerCase().includes(search.trim().toLowerCase()),
    [search],
  );

  const lotDetail = useMemo(
    () => (openLot ? (lotStats.find((l) => l.key === openLot) ?? null) : null),
    [openLot, lotStats],
  );

  const timelineRows = useMemo(() => {
    if (!timelineSession) return [];
    return periodRows
      .filter((r) => sid(r) === timelineSession)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [timelineSession, periodRows]);

  async function signOut() {
    await panelLogout();
    onSignedOut();
  }

  function exportCsv() {
    const cols = [
      "created_at",
      "event_type",
      "experience_type",
      "landing_path",
      "catalog_name",
      "catalog_key",
      "lot_number",
      "horse_name",
      "video_url",
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
      "session_id",
    ] as const;
    const escape = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [cols.join(",")];
    for (const row of filtered) {
      lines.push(
        cols
          .map((c) =>
            escape(c === "experience_type" ? experienceOf(row) : (row[c] as string | null)),
          )
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `martendal-${exp}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const empty = filtered.length === 0;
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);

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
                <FunnelStep value={catalogFunnel.interest} text="demonstraram interesse em lote" />
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
                <p className="text-sm text-white/55">Nenhum interesse registrado neste período.</p>
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
                          <td className="py-2 pr-3 font-semibold whitespace-nowrap">{row.key}</td>
                          <td className="py-2 pr-3">{row.horse}</td>
                          <td className="py-2 pr-3">{row.videoClicks}</td>
                          <td className="py-2 pr-3">{row.videoSessions}</td>
                          <td className="py-2 font-semibold text-[#3ddc84]">{row.videoThenWa}</td>
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
          <StatsTable rows={byContent.filter((r) => matchesSearch(r.key))} firstColumn="Criativo" />
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
        <Panel title="Eventos recentes">
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
          {filtered.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">Nenhum dado neste período.</p>
          ) : (
            <div className="mt-3 flex items-center justify-between text-sm text-white/60">
              <span>
                {filtered.length} eventos · página {page + 1} de {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-white/15 px-3 py-1 font-semibold disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
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
          <ul className="space-y-2 text-sm">
            {timelineRows.map((row) => (
              <li key={row.id} className="flex gap-3 text-white/75">
                <span className="w-12 shrink-0 text-white/45">
                  {timeFmt.format(new Date(row.created_at))}
                </span>
                <span>
                  {EVENT_LABELS[row.event_type] ?? row.event_type}
                  {row.lot_number
                    ? ` · ${lotIdentity(row)}${row.horse_name ? ` — ${row.horse_name}` : ""}`
                    : ""}
                </span>
              </li>
            ))}
            {timelineRows.length === 0 ? (
              <li className="text-white/55">Nenhum evento nesta sessão.</li>
            ) : null}
          </ul>
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
