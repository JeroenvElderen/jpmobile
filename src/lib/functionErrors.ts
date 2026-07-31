type ResponseLike = {
  clone?: () => ResponseLike;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

export async function getFunctionErrorMessage(error: unknown, fallback: string, response?: unknown) {
  const context = typeof error === "object" && error !== null && "context" in error
    ? (error as { context?: unknown }).context
    : undefined;
  const errorResponse = isResponseLike(response) ? response : isResponseLike(context) ? context : undefined;

  if (errorResponse) {
    const message = await readErrorResponse(errorResponse);
    if (message) return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

function isResponseLike(value: unknown): value is ResponseLike {
  return typeof value === "object"
    && value !== null
    && "json" in value
    && typeof value.json === "function"
    && "text" in value
    && typeof value.text === "function";
}

async function readErrorResponse(response: ResponseLike) {
  const jsonResponse = response.clone?.() ?? response;

  try {
    const body = await jsonResponse.json() as { error?: unknown; message?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
    if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  } catch {
    const textResponse = response.clone?.() ?? response;
    const text = await textResponse.text().catch(() => "");
    if (text.trim()) return text.trim();
  }

  return null;
}