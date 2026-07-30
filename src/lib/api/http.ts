import { backend, type BackendSelectOptions } from "./backend";

export async function getCurrentUser() {
  return backend.currentUser();
}

export async function getCurrentUserId() {
  return backend.currentUserId();
}

export async function signIn(email: string, password: string) {
  return backend.signIn(email, password);
}

export async function signUp(email: string, password: string, meta?: Record<string, unknown>) {
  return backend.signUp(email, password, meta);
}

export async function signOut() {
  return backend.signOut();
}

export async function requestPasswordReset(email: string) {
  return backend.requestPasswordReset(email);
}

export async function updatePassword(password: string) {
  return backend.updatePassword(password);
}

export async function select<T>(table: string, options?: BackendSelectOptions) {
  return backend.select<T>(table, options);
}

export async function maybeSingle<T>(table: string, options?: BackendSelectOptions) {
  return backend.maybeSingle<T>(table, options);
}

export async function insert<T>(table: string, payload: Record<string, unknown>) {
  return backend.insert<T>(table, payload);
}

export async function update<T>(
  table: string,
  payload: Record<string, unknown>,
  options?: BackendSelectOptions,
) {
  return backend.update<T>(table, payload, options);
}

export async function remove(table: string, options?: BackendSelectOptions) {
  return backend.delete(table, options);
}
