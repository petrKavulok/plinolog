import type {
  ActionType,
  ActionTypeInput,
  CareSession,
  SessionInput,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    // TODO(offline): tady bude fronta zápisů do localStorage a sync na pozadí.
    throw new ApiError(0, "Nejsi online — zkus to za chvíli.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? "Něco se pokazilo.");
  }
  return (await res.json()) as T;
}

const body = (data: unknown) => JSON.stringify(data);

export const api = {
  me: () => request<{ user: User | null }>("/auth/me"),

  login: (username: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: body({ username, password }),
    }),

  register: (input: {
    username: string;
    displayName: string;
    password: string;
    inviteCode: string;
  }) => request<{ user: User }>("/auth/register", { method: "POST", body: body(input) }),

  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),

  listActionTypes: () => request<{ actionTypes: ActionType[] }>("/action-types"),

  createActionType: (input: ActionTypeInput) =>
    request<{ actionType: ActionType }>("/action-types", {
      method: "POST",
      body: body(input),
    }),

  updateActionType: (id: string, input: Partial<ActionTypeInput>) =>
    request<{ actionType: ActionType }>(`/action-types?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: body(input),
    }),

  deleteActionType: (id: string) =>
    request<{ ok: true }>(`/action-types?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  listSessions: (days = 30) =>
    request<{ sessions: CareSession[] }>(`/sessions?days=${days}`),

  createSession: (input: SessionInput) =>
    request<{ id: string }>("/sessions", { method: "POST", body: body(input) }),

  updateSession: (id: string, input: Partial<SessionInput>) =>
    request<{ ok: true }>(`/sessions?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: body(input),
    }),

  deleteSession: (id: string) =>
    request<{ ok: true }>(`/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
