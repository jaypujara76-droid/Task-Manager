const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  if (!API_URL) {
    throw new Error("API URL is not configured. Check apps/web/.env.local");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot connect to the backend. Make sure the API server is running.");
  }

  const responseText = await response.text();

  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error(
          "The backend returned an invalid response. Check that the API URL points to the backend server.",
        );
      }
    }
  } else if (response.ok && response.status !== 204) {
    throw new Error("The backend returned an empty response.");
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : null;

    throw new Error(message ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}
