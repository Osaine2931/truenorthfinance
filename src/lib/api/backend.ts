import { supabase } from "@/integrations/supabase/client";

export type BackendError = { message: string };

export interface BackendSelectOptions {
  filters?: Array<{ column: string; operator: "eq" | "gt" | "gte" | "lt" | "lte"; value: unknown }>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  maybeSingle?: boolean;
  single?: boolean;
}

export interface BackendAdapter {
  currentUser(): Promise<{ id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null>;
  currentUserId(): Promise<string>;
  signIn(email: string, password: string): Promise<unknown>;
  signUp(email: string, password: string, meta?: Record<string, unknown>): Promise<unknown>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  select<T>(table: string, options?: BackendSelectOptions): Promise<{ data: T[] | null; error: BackendError | null }>;
  maybeSingle<T>(table: string, options?: BackendSelectOptions): Promise<{ data: T | null; error: BackendError | null }>;
  insert<T>(table: string, payload: Record<string, unknown>): Promise<{ data: T | null; error: BackendError | null }>;
  update<T>(table: string, payload: Record<string, unknown>, options?: BackendSelectOptions): Promise<{ data: T | null; error: BackendError | null }>;
  delete(table: string, options?: BackendSelectOptions): Promise<{ error: BackendError | null }>;
}

interface LooseBuilder extends PromiseLike<{ data: unknown; error: { message: string } | null }> {
  filter(column: string, operator: string, value: unknown): LooseBuilder;
  order(column: string, options: { ascending: boolean }): LooseBuilder;
  limit(count: number): LooseBuilder;
  select(columns?: string): LooseBuilder;
  single(): LooseBuilder;
  maybeSingle(): LooseBuilder;
}

const db = supabase as unknown as {
  from: (table: string) => {
    select: (columns: string) => LooseBuilder;
    insert: (payload: Record<string, unknown>) => LooseBuilder;
    update: (payload: Record<string, unknown>) => LooseBuilder;
    delete: () => LooseBuilder;
  };
};

class SupabaseBackendAdapter implements BackendAdapter {
  async currentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  }

  async currentUserId() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Not authenticated");
    return data.user.id;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }

  async signUp(email: string, password: string, meta?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: meta },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }

  async select<T>(table: string, options: BackendSelectOptions = {}) {
    let query = db.from(table).select("*");
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    const { data, error } = await query;
    return { data: data as T[] | null, error: error ? { message: error.message } : null };
  }

  async maybeSingle<T>(table: string, options: BackendSelectOptions = {}) {
    let query = db.from(table).select("*");
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }
    const { data, error } = await query.maybeSingle();
    return { data: data as T | null, error: error ? { message: error.message } : null };
  }

  async insert<T>(table: string, payload: Record<string, unknown>) {
    const { data, error } = await db.from(table).insert(payload).select().single();
    return { data: data as T | null, error: error ? { message: error.message } : null };
  }

  async update<T>(table: string, payload: Record<string, unknown>, options: BackendSelectOptions = {}) {
    let query = db.from(table).update(payload);
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }
    const { data, error } = await query.select().single();
    return { data: data as T | null, error: error ? { message: error.message } : null };
  }

  async delete(table: string, options: BackendSelectOptions = {}) {
    let query = db.from(table).delete();
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }
    const { error } = await query;
    return { error: error ? { message: error.message } : null };
  }
}

class HttpBackendAdapter implements BackendAdapter {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
      ...init,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message ?? "Backend request failed");
    }
    return payload as T;
  }

  async currentUser() {
    const payload = await this.request<{ user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null }>("/api/me");
    return payload.user ?? null;
  }

  async currentUserId() {
    const user = await this.currentUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async signIn(email: string, password: string) {
    return this.request("/api/auth/sign-in", { method: "POST", body: JSON.stringify({ email, password }) });
  }

  async signUp(email: string, password: string, meta?: Record<string, unknown>) {
    return this.request("/api/auth/sign-up", { method: "POST", body: JSON.stringify({ email, password, meta }) });
  }

  async signOut() {
    await this.request("/api/auth/sign-out", { method: "POST" });
  }

  async requestPasswordReset(email: string) {
    await this.request("/api/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) });
  }

  async updatePassword(password: string) {
    await this.request("/api/auth/update-password", { method: "POST", body: JSON.stringify({ password }) });
  }

  async select<T>(_table: string, _options: BackendSelectOptions = {}) {
    return { data: null as T[] | null, error: null };
  }

  async maybeSingle<T>(_table: string, _options: BackendSelectOptions = {}) {
    return { data: null as T | null, error: null };
  }

  async insert<T>(_table: string, _payload: Record<string, unknown>) {
    return { data: null as T | null, error: null };
  }

  async update<T>(_table: string, _payload: Record<string, unknown>, _options: BackendSelectOptions = {}) {
    return { data: null as T | null, error: null };
  }

  async delete(_table: string, _options: BackendSelectOptions = {}) {
    return { error: null };
  }
}

function getConfiguredBackendAdapter(): BackendAdapter {
  const mode = (import.meta.env.VITE_TRUENORTH_BACKEND_MODE ?? process.env.TRUENORTH_BACKEND_MODE ?? "supabase").toLowerCase();
  if (mode === "http") {
    const baseUrl = (import.meta.env.VITE_TRUENORTH_API_BASE_URL ?? process.env.TRUENORTH_API_BASE_URL ?? "").trim();
    if (baseUrl) return new HttpBackendAdapter(baseUrl);
  }
  return new SupabaseBackendAdapter();
}

export const backend = getConfiguredBackendAdapter();

export function isHttpBackendEnabled() {
  return (import.meta.env.VITE_TRUENORTH_BACKEND_MODE ?? process.env.TRUENORTH_BACKEND_MODE ?? "supabase").toLowerCase() === "http";
}
