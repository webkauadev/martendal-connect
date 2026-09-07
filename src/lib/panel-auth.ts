import { supabase } from "@/integrations/supabase/client";

export const PANEL_EMAIL = "beludokuka321@gmail.com";
const STORAGE_KEY = "martendal_panel_token";

export function getPanelToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setPanelToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sessionStorage indisponível */
  }
}

type LoginPayload = { token?: string; email?: string; expires_at?: string; error?: string };
type OkPayload = { ok?: boolean; error?: string };
type ValidPayload = { valid?: boolean; email?: string };

export async function panelLogin(secret: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("panel_login", {
    p_email: PANEL_EMAIL,
    p_secret: secret,
  });
  if (error) return { ok: false, error: "Não foi possível validar a chave. Tente novamente." };
  const payload = (data ?? {}) as LoginPayload;
  if (payload.error === "rate_limited") {
    return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  if (!payload.token) return { ok: false, error: "Chave inválida." };
  setPanelToken(payload.token);
  return { ok: true };
}

export async function panelSessionValid(): Promise<boolean> {
  const token = getPanelToken();
  if (!token) return false;
  const { data, error } = await supabase.rpc("panel_session_valid", { p_token: token });
  if (error) return false;
  const payload = (data ?? {}) as ValidPayload;
  if (!payload.valid) {
    setPanelToken(null);
    return false;
  }
  return true;
}

export async function panelLogout(): Promise<void> {
  const token = getPanelToken();
  setPanelToken(null);
  if (token) await supabase.rpc("panel_logout", { p_token: token });
}

export async function panelChangeSecret(
  current: string,
  next: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getPanelToken();
  if (!token) return { ok: false, error: "Sessão expirada." };
  const { data, error } = await supabase.rpc("panel_change_secret", {
    p_token: token,
    p_current: current,
    p_new: next,
  });
  if (error) return { ok: false, error: "Não foi possível alterar a chave." };
  const payload = (data ?? {}) as OkPayload;
  if (payload.ok) {
    setPanelToken(null);
    return { ok: true };
  }
  if (payload.error === "weak_secret")
    return { ok: false, error: "A nova chave precisa ter pelo menos 12 caracteres." };
  if (payload.error === "unauthorized") return { ok: false, error: "Sessão expirada." };
  return { ok: false, error: "Chave atual incorreta." };
}
