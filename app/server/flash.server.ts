import { redirect } from "react-router";

export type FlashMessage = {
  type: "success" | "error" | "info";
  message: string;
};

const FLASH_COOKIE_NAME = "flash-message";

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (cookies, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
      return cookies;
    },
    {} as Record<string, string>,
  );
}

/**
 * Serialize flash message to cookie
 */
function serializeFlash(flash: FlashMessage): string {
  const value = encodeURIComponent(JSON.stringify(flash));
  // Cookie expires in 60 seconds (enough time for redirect + load)
  return `${FLASH_COOKIE_NAME}=${value}; Path=/; Max-Age=60; HttpOnly; SameSite=Lax`;
}

/**
 * Create a redirect response with flash message
 */
export function redirectWithFlash(url: string, flash: FlashMessage): Response {
  return redirect(url, {
    headers: {
      "Set-Cookie": serializeFlash(flash),
    },
  });
}

/**
 * Get flash message from request and return headers to clear it
 */
export function getFlash(request: Request): {
  flash: FlashMessage | null;
  headers: HeadersInit;
} {
  const cookieHeader = request.headers.get("Cookie");
  const cookies = parseCookies(cookieHeader);

  const flashCookie = cookies[FLASH_COOKIE_NAME];
  let flash: FlashMessage | null = null;

  if (flashCookie) {
    try {
      flash = JSON.parse(flashCookie);
    } catch {
      // Invalid flash cookie, ignore
    }
  }

  // Return headers to clear the flash cookie
  const clearCookie = `${FLASH_COOKIE_NAME}=; Path=/; Max-Age=0`;

  return {
    flash,
    headers: {
      "Set-Cookie": clearCookie,
    },
  };
}
