// Base client inspired by your cats-api-client pattern
interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}) {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new ApiError(
        `API request failed with status ${response.status}`,
        response.status
      );
    }

    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const apiClient = {
  get: async <T>(url: string, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(url, options);
    return response.json();
  },

  post: async <T>(
    url: string,
    data: unknown,
    options?: FetchOptions
  ): Promise<T> => {
    const response = await fetchWithTimeout(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
