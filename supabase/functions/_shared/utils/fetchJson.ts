export async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Fetch failed: ${response.status} ${response.statusText} - ${text}`
    );
  }

  return JSON.parse(text);
}