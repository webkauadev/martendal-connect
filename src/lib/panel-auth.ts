type LoginPayload = {
  ok?: boolean;
  error?: string;
};

type SessionPayload = {
  authenticated?: boolean;
  error?: string;
};

type EventsPayload = {
  ok?: boolean;
  events?: unknown[];
  error?: string;
};

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

export async function panelGetTrackingEvents(): Promise<{
  ok: boolean;
  events: unknown[];
  unauthorized?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch("/api/panel/events", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    const payload = await readJson<EventsPayload>(response);

    if (response.status === 401) {
      return {
        ok: false,
        events: [],
        unauthorized: true,
        error: "Sessão expirada.",
      };
    }

    if (!response.ok || payload?.ok !== true) {
      return {
        ok: false,
        events: [],
        error: payload?.error ?? "Não foi possível carregar os dados do painel.",
      };
    }

    return {
      ok: true,
      events: Array.isArray(payload.events) ? payload.events : [],
    };
  } catch {
    return {
      ok: false,
      events: [],
      error: "Não foi possível carregar os dados do painel.",
    };
  }
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
