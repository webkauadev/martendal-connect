type LoginPayload = {
  ok?: boolean;
  error?: string;
};

type SessionPayload = {
  authenticated?: boolean;
  error?: string;
};

export type DashboardFilters = Partial<
  Record<
    | "start_at"
    | "end_at"
    | "experience"
    | "catalog_key"
    | "source"
    | "campaign"
    | "term"
    | "content"
    | "event"
    | "device"
    | "lot"
    | "search"
    | "session_id",
    string
  >
>;
export type Breakdown = {
  key: string;
  views: number;
  uniques: number;
  clicks: number;
  clickSessions: number;
  rate: number;
};
export type Summary = {
  total_events: number;
  accesses: number;
  uniques: number;
  clicks: number;
  click_sessions: number;
  sq_accesses: number;
  sq_uniques: number;
  sq_clicks: number;
  sq_click_sessions: number;
  cat_accesses: number;
  cat_uniques: number;
  lot_views: number;
  lot_sessions: number;
  unique_lot_views: number;
  video_clicks: number;
  video_sessions: number;
  cat_wa_clicks: number;
  cat_wa_sessions: number;
  interest_clicks: number;
  interested_sessions: number;
  interested_lots: number;
  pdfs: number;
};
export type Dashboard = {
  summary: Summary;
  timeseries: { day: string; acessos: number; cliques: number }[];
  breakdowns: { source?: Breakdown[]; [key: string]: Breakdown[] | undefined };
  lots: Lot[];
  catalog_timeseries: {
    day: string;
    visitantes: number;
    lotes: number;
    interesses: number;
    whatsapp: number;
  }[];
  catalog_breakdowns: { source: CatalogBreakdown[]; campaign: CatalogBreakdown[] };
  filter_options: {
    sources: string[];
    campaigns: string[];
    terms: string[];
    contents: string[];
    devices: string[];
    lots: string[];
  };
};
export type CatalogBreakdown = {
  key: string;
  sessions: number;
  lotViews: number;
  interested: number;
  clicks: number;
  rate: number;
};
export type Lot = {
  key: string;
  catalogKey: string;
  lot: string;
  horse: string | null;
  videoUrl: string | null;
  uniqueViews: number;
  totalViews: number;
  videoClicks: number;
  videoSessions: number;
  waClicks: number;
  interested: number;
  rate: number;
  videoThenWa: number;
  topSource: string;
  sources: Record<string, number>;
  devices: Record<string, number>;
  campaigns: Record<string, { views: number; interested: number; clicks: number }>;
  contents: Record<string, { views: number; interested: number; clicks: number }>;
};
export type TrackingEvent = {
  id: string;
  created_at: string;
  event_type: string;
  traffic_source: string | null;
  experience_type: string | null;
  lot_number: string | null;
  horse_name: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  catalog_key: string | null;
  catalog_name: string | null;
  video_url: string | null;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  landing_path: string | null;
  referrer: string | null;
};
export type EventPage = {
  events: TrackingEvent[];
  hasMore: boolean;
  nextCursor: { created_at: string; id: string } | null;
};
type EventsPayload = {
  ok?: boolean;
  events?: unknown[];
  error?: string;
};
type DashboardPayload = { ok?: boolean; dashboard?: Dashboard; error?: string };

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function panelLogin(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/panel/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    const payload = await readJson<LoginPayload>(response);

    if (response.ok && payload?.ok === true) {
      return { ok: true };
    }

    return {
      ok: false,
      error: payload?.error ?? "Chave inválida, expirada ou já utilizada.",
    };
  } catch {
    return {
      ok: false,
      error: "Serviço de autenticação temporariamente indisponível.",
    };
  }
}

export async function panelSessionValid(): Promise<boolean> {
  try {
    const response = await fetch("/api/panel/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await readJson<SessionPayload>(response);

    return payload?.authenticated === true;
  } catch {
    return false;
  }
}

function query(filters: DashboardFilters, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ ...filters, ...extra });
  return p.toString() ? `?${p}` : "";
}
export async function panelGetDashboard(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<{ ok: boolean; dashboard?: Dashboard; unauthorized?: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/panel/dashboard${query(filters)}`, {
      signal: signal ?? null,
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = await readJson<DashboardPayload>(response);
    if (response.status === 401) return { ok: false, unauthorized: true };
    return response.ok && payload?.ok && payload.dashboard
      ? { ok: true, dashboard: payload.dashboard }
      : { ok: false, error: payload?.error ?? "Não foi possível carregar o painel." };
  } catch {
    return { ok: false, error: "Não foi possível carregar o painel." };
  }
}
export async function panelGetTrackingEventsPage(
  cursor: EventPage["nextCursor"],
  filters: DashboardFilters = {},
  signal?: AbortSignal,
): Promise<{ ok: boolean; page?: EventPage; unauthorized?: boolean; error?: string }> {
  try {
    const extra: Record<string, string> = { page_size: "100" };
    if (cursor) {
      extra["cursor_created_at"] = cursor.created_at;
      extra["cursor_id"] = cursor.id;
    }
    const response = await fetch(`/api/panel/events${query(filters, extra)}`, {
      signal: signal ?? null,
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = await readJson<EventsPayload & Partial<EventPage>>(response);
    if (response.status === 401) return { ok: false, unauthorized: true };
    if (response.ok && payload?.ok && Array.isArray(payload.events) && payload.events.length <= 100)
      return {
        ok: true,
        page: {
          events: payload.events as TrackingEvent[],
          hasMore: payload.hasMore === true,
          nextCursor: payload.nextCursor ?? null,
        },
      };
    return { ok: false, error: payload?.error ?? "Não foi possível carregar eventos." };
  } catch {
    return { ok: false, error: "Não foi possível carregar eventos." };
  }
}

export function panelExportUrl(filters: DashboardFilters): string {
  return `/api/panel/events${query(filters, { format: "csv" })}`;
}

export async function panelLogout(): Promise<void> {
  try {
    await fetch("/api/panel/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    });
  } catch {
    // A sessão também expirará server-side.
  }
}
