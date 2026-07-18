import { ApiConfigurationError, getApiBaseUrl } from "@/lib/api-base-url";

export type AdminSessionPayload = {
  token: string;
  expires_at: string;
  email: string;
  role: string;
};

export type AdminProfilePayload = {
  email: string;
  role: string;
};

export type AdminAuthRepositoryErrorKind =
  "configuration" | "unavailable" | "response";

export class AdminAuthRepositoryError extends Error {
  readonly kind: AdminAuthRepositoryErrorKind;
  readonly status?: number;
  readonly code?: string;

  constructor(
    kind: AdminAuthRepositoryErrorKind,
    message: string,
    options: { status?: number; code?: string } = {},
  ) {
    super(message);
    this.name = "AdminAuthRepositoryError";
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
  }
}

async function rejectedResponseError(response: Response) {
  let code: string | undefined;
  let message = "Admin auth request was rejected.";

  try {
    const payload = (await response.json()) as {
      detail?: { code?: unknown; message?: unknown };
    };
    if (typeof payload.detail?.code === "string") {
      code = payload.detail.code;
    }
    if (typeof payload.detail?.message === "string") {
      message = payload.detail.message;
    }
  } catch {
    // Some upstream failures intentionally have no JSON response body.
  }

  return new AdminAuthRepositoryError("response", message, {
    status: response.status,
    code,
  });
}

export type AdminAuthRepository = {
  login(email: string, password: string): Promise<AdminSessionPayload>;
  getSession(token: string): Promise<AdminProfilePayload>;
  logout(token: string): Promise<void>;
};

export function createHttpAdminAuthRepository(
  resolveBaseUrl: () => string = getApiBaseUrl,
): AdminAuthRepository {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let apiBaseUrl: string;
    try {
      apiBaseUrl = resolveBaseUrl();
    } catch (error) {
      if (error instanceof ApiConfigurationError) {
        throw new AdminAuthRepositoryError("configuration", error.message);
      }
      throw error;
    }

    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
      });
    } catch {
      throw new AdminAuthRepositoryError(
        "unavailable",
        "Admin auth API request failed.",
      );
    }
    if (!response.ok) {
      throw await rejectedResponseError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  return {
    login(email, password) {
      return request<AdminSessionPayload>("/api/v1/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    getSession(token) {
      return request<AdminProfilePayload>("/api/v1/admin/auth/session", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    async logout(token) {
      await request<void>("/api/v1/admin/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  };
}

export const httpAdminAuthRepository = createHttpAdminAuthRepository();
