import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, it, expect, vi } from "vitest";
import worker, { signJWT, verifyJWT, parseCookies, detectLanguage } from "../index";
import { FormSchema } from "../types";

const mockSchema: FormSchema = {
  id: "lavatanssikurssit-syksy-2026",
  title: "Lavatanssikurssit ilmoittautuminen - 2026 Syksy",
  turnstileEnabled: false,
  pages: [
    {
      id: "page-1",
      title: "Tervetuloa",
      fields: [
        {
          id: "welcome",
          type: "welcome",
          label: "New Question",
          welcomeMarkdown: "# Lavatanssikurssit\n",
          buttonLabel: "Käynnistä"
        }
      ]
    }
  ]
};

const mockEnv = {
  DB: env.DB,
  FORM_SCHEMAS: env.FORM_SCHEMAS,
  FORM_ANALYTICS: {
    writeDataPoint: vi.fn()
  },
  JWT_SECRET: "test-jwt-secret-key-12345",
  ALLOWED_ADMIN_EMAILS: "admin@example.com,allowed@pouta.io",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  TURNSTILE_PUBLIC_KEY: "public-key",
  TURNSTILE_SECRET_KEY: "secret-key"
};

const mockCtx = {
  waitUntil: (p: Promise<any>) => p,
  passThroughOnException: () => {}
} as any;

const fetchMock = vi.fn();

describe("Worker Router tests", () => {
  beforeAll(async () => {
    // Create submissions table if not exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('partial', 'completed')),
        answers TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_submissions_form_status ON submissions (form_id, status)
    `).run();

    vi.stubGlobal('fetch', fetchMock);
  });

  beforeEach(async () => {
    // Clear KV and D1
    await env.DB.prepare(`DELETE FROM submissions`).run();
    const keys = await env.FORM_SCHEMAS.list();
    for (const key of keys.keys) {
      await env.FORM_SCHEMAS.delete(key.name);
    }
    vi.clearAllMocks();

    // Default mock implementation
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: true }));
      }
      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "google-access-token" }));
      }
      if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
        return new Response(JSON.stringify({ email: "admin@example.com" }));
      }
      return new Response(JSON.stringify({ success: true }));
    });
  });

  describe("Public Routes", () => {
    it("should return 404 for non-existent form (JSON/HTML)", async () => {
      const reqJson = new Request("http://localhost/forms/not-found", {
        headers: { Accept: "application/json" }
      });
      const resJson = await worker.fetch(reqJson, mockEnv, mockCtx);
      expect(resJson.status).toBe(404);
      expect(await resJson.json()).toEqual({ error: "Form not found" });

      const reqHtml = new Request("http://localhost/forms/not-found", {
        headers: { Accept: "text/html" }
      });
      const resHtml = await worker.fetch(reqHtml, mockEnv, mockCtx);
      expect(resHtml.status).toBe(404);
      expect(await resHtml.text()).toContain("Form Not Found");
    });

    it("should return the form schema and player view", async () => {
      // Setup: Put schema in KV
      await env.FORM_SCHEMAS.put("test-form", JSON.stringify(mockSchema));

      // Get JSON
      const reqJson = new Request("http://localhost/forms/test-form", {
        headers: { Accept: "application/json" }
      });
      const resJson = await worker.fetch(reqJson, mockEnv, mockCtx);
      expect(resJson.status).toBe(200);
      expect(await resJson.json()).toEqual(mockSchema);

      // Get HTML
      const reqHtml = new Request("http://localhost/forms/test-form", {
        headers: { Accept: "text/html", "Accept-Language": "fi" }
      });
      const resHtml = await worker.fetch(reqHtml, mockEnv, mockCtx);
      expect(resHtml.status).toBe(200);
      expect(await resHtml.text()).toContain("<!DOCTYPE html>");
      expect(mockEnv.FORM_ANALYTICS.writeDataPoint).toHaveBeenCalled();
    });

    it("should handle partial and completed submissions", async () => {
      // Partial save
      const reqPartial = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-123",
          status: "partial",
          answers: { welcome: "started" }
        })
      });
      const resPartial = await worker.fetch(reqPartial, mockEnv, mockCtx);
      expect(resPartial.status).toBe(201);
      expect(await resPartial.json()).toEqual({ success: true });

      // Verify D1 has it
      const dbRow = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind("sub-123").first();
      expect(dbRow).toBeDefined();
      expect(dbRow?.status).toBe("partial");

      // Completed save (success)
      const reqComplete = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-123",
          status: "completed",
          answers: { welcome: "started" },
          turnstileToken: "dummy-token"
        })
      });
      const resComplete = await worker.fetch(reqComplete, mockEnv, mockCtx);
      expect(resComplete.status).toBe(200);

      const dbRowUpdated = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind("sub-123").first();
      expect(dbRowUpdated?.status).toBe("completed");
    });

    it("should enforce Turnstile spam check on completed submissions if enabled", async () => {
      const turnstileSchema = { ...mockSchema, turnstileEnabled: true };
      await env.FORM_SCHEMAS.put("test-form-turnstile", JSON.stringify(turnstileSchema));

      // No token -> 400
      const reqNoToken = new Request("http://localhost/forms/test-form-turnstile/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-456",
          status: "completed",
          answers: {}
        })
      });
      const resNoToken = await worker.fetch(reqNoToken, mockEnv, mockCtx);
      expect(resNoToken.status).toBe(400);

      // With token -> 201 (mock fetch returns success: true)
      const reqWithToken = new Request("http://localhost/forms/test-form-turnstile/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-456",
          status: "completed",
          answers: {},
          turnstileToken: "dummy-token"
        })
      });
      const resWithToken = await worker.fetch(reqWithToken, mockEnv, mockCtx);
      expect(resWithToken.status).toBe(201);
    });

    it("should serve brand assets correctly", async () => {
      const reqIco = new Request("http://localhost/favicon.ico");
      const resIco = await worker.fetch(reqIco, mockEnv, mockCtx);
      expect(resIco.status).toBe(200);
      expect(resIco.headers.get("Content-Type")).toBe("image/x-icon");

      const reqFavSvg = new Request("http://localhost/favicon.svg");
      const resFavSvg = await worker.fetch(reqFavSvg, mockEnv, mockCtx);
      expect(resFavSvg.status).toBe(200);
      expect(resFavSvg.headers.get("Content-Type")).toBe("image/svg+xml");

      const reqLogoSvg = new Request("http://localhost/logo.svg");
      const resLogoSvg = await worker.fetch(reqLogoSvg, mockEnv, mockCtx);
      expect(resLogoSvg.status).toBe(200);

      const reqLogoPng = new Request("http://localhost/logo.png");
      const resLogoPng = await worker.fetch(reqLogoPng, mockEnv, mockCtx);
      expect(resLogoPng.status).toBe(302); // Redirects to /logo.svg
    });

    it("should handle CORS options preflight", async () => {
      const reqOptions = new Request("http://localhost/forms/any", {
        method: "OPTIONS"
      });
      const resOptions = await worker.fetch(reqOptions, mockEnv, mockCtx);
      expect(resOptions.status).toBe(200);
      expect(resOptions.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("Admin Authorization & Routes", () => {
    it("should reject admin actions without session", async () => {
      const req = new Request("http://localhost/admin/forms");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized admin access" });

      const reqPreview = new Request("http://localhost/admin/preview", { method: "POST" });
      const resPreview = await worker.fetch(reqPreview, mockEnv, mockCtx);
      expect(resPreview.status).toBe(401);
      expect(await resPreview.json()).toEqual({ error: "Unauthorized admin access" });

      const reqVerify = new Request("http://localhost/admin/verify");
      const resVerify = await worker.fetch(reqVerify, mockEnv, mockCtx);
      expect(resVerify.status).toBe(401);
      expect(await resVerify.json()).toEqual({ authenticated: false, error: "Unauthorized session" });

      const reqPostForm = new Request("http://localhost/admin/forms/test-form", { method: "POST" });
      const resPostForm = await worker.fetch(reqPostForm, mockEnv, mockCtx);
      expect(resPostForm.status).toBe(401);
      expect(await resPostForm.json()).toEqual({ error: "Unauthorized admin access" });
    });

    it("should reject admin actions with invalid token", async () => {
      const req = new Request("http://localhost/admin/forms", {
        headers: { Authorization: "Bearer invalid-token-payload" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(401);
    });

    it("should reject admin session if email is not on allowed list", async () => {
      const token = await signJWT({ email: "spammer@hacker.io", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin/forms", {
        headers: { Cookie: `pouta_admin_session=${token}` }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(401);
    });

    it("should verify admin session and support form builder management", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const authHeader = { Authorization: `Bearer ${token}` };

      // 1. Verify endpoint
      const reqVerify = new Request("http://localhost/admin/verify", { headers: authHeader });
      const resVerify = await worker.fetch(reqVerify, mockEnv, mockCtx);
      expect(resVerify.status).toBe(200);
      expect(await resVerify.json()).toEqual({ authenticated: true, email: "admin@example.com" });

      // 2. Create/Save form schema
      const reqSave = new Request("http://localhost/admin/forms/test-id", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(mockSchema)
      });
      const resSave = await worker.fetch(reqSave, mockEnv, mockCtx);
      expect(resSave.status).toBe(200);

      // Verify in KV
      const stored = await env.FORM_SCHEMAS.get("test-id");
      expect(stored).toBeDefined();

      // 3. Get forms list
      const reqList = new Request("http://localhost/admin/forms", { headers: authHeader });
      const resList = await worker.fetch(reqList, mockEnv, mockCtx);
      expect(resList.status).toBe(200);
      const listData = await resList.json() as any;
      expect(listData.keys).toBeDefined();

      // 4. Delete form schema
      const reqDel = new Request("http://localhost/admin/forms/test-id", {
        method: "DELETE",
        headers: authHeader
      });
      const resDel = await worker.fetch(reqDel, mockEnv, mockCtx);
      expect(resDel.status).toBe(200);

      expect(await env.FORM_SCHEMAS.get("test-id")).toBeNull();
    });

    it("should manage submissions list", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const authHeader = { Authorization: `Bearer ${token}` };

      // Setup D1 submissions
      await env.DB.prepare(`
        INSERT INTO submissions (id, form_id, status, answers, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        "sub-99",
        "lavatanssikurssit-syksy-2026",
        "completed",
        JSON.stringify({ participant: { firstName: "Matti", lastName: "Esimerkki" } }),
        Date.now(),
        Date.now()
      ).run();

      // 1. Get submissions as JSON
      const reqJson = new Request("http://localhost/admin/submissions/lavatanssikurssit-syksy-2026", {
        headers: authHeader
      });
      const resJson = await worker.fetch(reqJson, mockEnv, mockCtx);
      expect(resJson.status).toBe(200);
      const data = await resJson.json() as any;
      expect(data.submissions.length).toBe(1);
      expect(data.submissions[0].answers).toEqual({ participant: { firstName: "Matti", lastName: "Esimerkki" } });
    });
  });

  describe("Utility Functions", () => {
    it("verifyJWT with malformed token", async () => {
      expect(await verifyJWT("malformed", mockEnv.JWT_SECRET)).toBeNull();
      expect(await verifyJWT("a.b", mockEnv.JWT_SECRET)).toBeNull();
      expect(await verifyJWT("a.b.c.d", mockEnv.JWT_SECRET)).toBeNull();
    });

    it("verifyJWT with expired token", async () => {
      const payload = { email: "admin@example.com", exp: Math.floor(Date.now() / 1000) - 10 };
      const token = await signJWT(payload, mockEnv.JWT_SECRET);
      expect(await verifyJWT(token, mockEnv.JWT_SECRET)).toBeNull();
    });

    it("verifyJWT with invalid signature", async () => {
      const payload = { email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 };
      const token = await signJWT(payload, "different-secret");
      expect(await verifyJWT(token, mockEnv.JWT_SECRET)).toBeNull();
    });

    it("verifyJWT with valid token having no exp claim", async () => {
      const payload = { email: "admin@example.com" };
      const token = await signJWT(payload, mockEnv.JWT_SECRET);
      expect(await verifyJWT(token, mockEnv.JWT_SECRET)).toEqual(payload);
    });

    it("verifyJWT handling of invalid json payload base64", async () => {
      const badPayloadB64 = "e3t9aW52YWxpZA"; // not valid json
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${badPayloadB64}.signature`;
      expect(await verifyJWT(token, mockEnv.JWT_SECRET)).toBeNull();
    });

    it("parseCookies with various inputs", () => {
      expect(parseCookies(null)).toEqual({});
      expect(parseCookies("")).toEqual({});
      expect(parseCookies("   ")).toEqual({});
      expect(parseCookies("foo=bar; baz=qux")).toEqual({ foo: "bar", baz: "qux" });
      expect(parseCookies("foo=bar=baz; empty=")).toEqual({ foo: "bar=baz", empty: "" });
      expect(parseCookies("; foo=bar;")).toEqual({ foo: "bar" });
    });

    it("detectLanguage with various requests", () => {
      const req1 = new Request("http://localhost/?lang=fi");
      expect(detectLanguage(req1)).toBe("fi");

      const req2 = new Request("http://localhost/?lang=EN");
      expect(detectLanguage(req2)).toBe("en");

      const req3 = new Request("http://localhost/?lang=invalid", {
        headers: { "Accept-Language": "fi-FI,fi;q=0.9" }
      });
      expect(detectLanguage(req3)).toBe("fi");

      const req4 = new Request("http://localhost/?lang=invalid", {
        headers: { "Accept-Language": "sv-SE,en;q=0.8" }
      });
      expect(detectLanguage(req4)).toBe("en");

      const req5 = new Request("http://localhost/");
      expect(detectLanguage(req5)).toBe("en");
    });
  });

  describe("Telemetry and Analytics Edge Cases", () => {
    it("should handle missing FORM_ANALYTICS binding gracefully", async () => {
      await env.FORM_SCHEMAS.put("test-form", JSON.stringify(mockSchema));
      const req = new Request("http://localhost/forms/test-form", {
        headers: { Accept: "text/html" }
      });
      const envWithoutAnalytics = { ...mockEnv, FORM_ANALYTICS: undefined as any };
      const res = await worker.fetch(req, envWithoutAnalytics, mockCtx);
      expect(res.status).toBe(200);
    });

    it("should handle FORM_ANALYTICS throwing error gracefully", async () => {
      await env.FORM_SCHEMAS.put("test-form", JSON.stringify(mockSchema));
      const req = new Request("http://localhost/forms/test-form", {
        headers: { Accept: "text/html" }
      });
      const envWithThrowingAnalytics = {
        ...mockEnv,
        FORM_ANALYTICS: {
          writeDataPoint: () => { throw new Error("Analytics failed"); }
        }
      };
      const res = await worker.fetch(req, envWithThrowingAnalytics, mockCtx);
      expect(res.status).toBe(200);
    });

    it("should include request.cf.country when present in telemetry", async () => {
      await env.FORM_SCHEMAS.put("test-form", JSON.stringify(mockSchema));
      const req = new Request("http://localhost/forms/test-form", {
        headers: { Accept: "text/html" }
      });
      Object.defineProperty(req, 'cf', {
        value: { country: 'FI' },
        writable: false
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
    });
  });

  describe("Submissions Endpoint Edge Cases", () => {
    it("should reject submissions with invalid JSON payload", async () => {
      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json"
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid JSON payload" });
    });

    it("should reject submissions with missing fields", async () => {
      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "sub-123" })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Missing required fields: id, status, answers" });
    });

    it("should reject submissions with invalid status", async () => {
      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "sub-123", status: "invalid-status", answers: {} })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid status. Must be 'partial' or 'completed'" });
    });

    it("should reject submissions to already completed ID (locked)", async () => {
      await env.DB.prepare(`
        INSERT INTO submissions (id, form_id, status, answers, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind("sub-locked", "test-form", "completed", "{}", Date.now(), Date.now()).run();

      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "sub-locked", status: "partial", answers: {} })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: "This submission has already been finalized and is locked." });
    });

    it("should handle failed Turnstile verification", async () => {
      fetchMock.mockImplementationOnce(async (url: string) => {
        if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
          return new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-turnstile-fail",
          status: "completed",
          answers: {},
          turnstileToken: "bad-token"
        })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ error: "Spam validation failed.", details: ["invalid-input-response"] });
    });

    it("should handle database failures during submission", async () => {
      const mockDbThrowing = {
        prepare: () => {
          throw new Error("D1 connection lost");
        }
      };
      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "sub-db-fail", status: "partial", answers: {} })
      });
      const res = await worker.fetch(req, { ...mockEnv, DB: mockDbThrowing as any }, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Database operation failed.", details: "D1 connection lost" });
    });
  });

  describe("OAuth Authentication Routes", () => {
    it("should redirect to Google OAuth login URL", async () => {
      const req = new Request("http://localhost/admin/login", {
        headers: { host: "localhost" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      const location = res.headers.get("Location");
      expect(location).toContain("accounts.google.com/o/oauth2/v2/auth");
      expect(location).toContain("client_id=client-id");
      expect(location).toContain("redirect_uri=http%3A%2F%2Flocalhost%2Fadmin%2Foauth%2Fcallback");
    });

    it("should redirect to Google OAuth login URL with HTTPS for non-localhost hosts", async () => {
      const req = new Request("http://pouta.io/admin/login", {
        headers: { host: "pouta.io" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      const location = res.headers.get("Location");
      expect(location).toContain("redirect_uri=https%3A%2F%2Fpouta.io%2Fadmin%2Foauth%2Fcallback");
    });

    it("should reject OAuth callback without code parameter", async () => {
      const req = new Request("http://localhost/admin/oauth/callback");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Missing code parameter" });
    });

    it("should handle failed Google OAuth code exchange", async () => {
      fetchMock.mockImplementationOnce(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ error: "invalid_grant" }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=bad-code");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "OAuth code exchange failed",
        details: { error: "invalid_grant" }
      });
    });

    it("should reject if userinfo does not contain email", async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "token" }));
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return new Response(JSON.stringify({ name: "No Email User" }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=some-code");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Could not fetch user email from Google" });
    });

    it("should deny access if email is not allowed", async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "token" }));
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return new Response(JSON.stringify({ email: "unauthorized@example.com" }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=some-code");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain("Access Denied");
      expect(text).toContain("unauthorized@example.com");
    });

    it("should escape special characters in unauthorized email error page", async () => {
      const badEmail = "admin&<>'\"@example.com";
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "token" }));
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return new Response(JSON.stringify({ email: badEmail }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=some-code");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain("admin&amp;&lt;&gt;&#039;&quot;@example.com");
    });

    it("should handle exceptions during OAuth process", async () => {
      fetchMock.mockImplementationOnce(() => {
        throw new Error("Network timeout");
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=some-code");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "OAuth process failed", details: "Network timeout" });
    });

    it("should set session cookie and redirect to admin on successful callback", async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "valid-token" }));
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return new Response(JSON.stringify({ email: "admin@example.com" }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://localhost/admin/oauth/callback?code=success-code", {
        headers: { host: "localhost" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("http://localhost/admin");
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toContain("pouta_admin_session=");
      expect(cookie).toContain("HttpOnly;");
      expect(cookie).toContain("SameSite=Lax;");
    });

    it("should set Secure session cookie on HTTPS host callback", async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "valid-token" }));
        }
        if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
          return new Response(JSON.stringify({ email: "admin@example.com" }));
        }
        return new Response(JSON.stringify({ success: true }));
      });

      const req = new Request("http://pouta.io/admin/oauth/callback?code=success-code", {
        headers: { host: "pouta.io" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://pouta.io/admin");
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toContain("pouta_admin_session=");
      expect(cookie).toContain("Secure;");
    });
  });

  describe("Admin Views & Preview", () => {
    it("GET /admin redirects to login if unauthenticated", async () => {
      const req = new Request("http://localhost/admin", {
        headers: { host: "localhost" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("http://localhost/admin/login");
    });

    it("GET /admin redirects to login if unauthenticated (https host)", async () => {
      const req = new Request("http://pouta.io/admin", {
        headers: { host: "pouta.io" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://pouta.io/admin/login");
    });

    it("GET /admin returns adminHtml if authenticated", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin", {
        headers: { Cookie: `pouta_admin_session=${token}` }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      expect(await res.text()).toContain("Pouta Forms - Admin Builder");
    });

    it("POST /admin/preview rejects invalid JSON body", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin/preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: "invalid-json"
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid JSON body preview schema" });
    });

    it("POST /admin/preview returns preview player HTML", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin/preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ schema: mockSchema, formId: "preview-id" })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("<!DOCTYPE html>");
    });

    it("GET /admin/forms handles KV list failures", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const mockKvThrowing = {
        list: () => {
          throw new Error("KV limit reached");
        }
      };
      const req = new Request("http://localhost/admin/forms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await worker.fetch(req, { ...mockEnv, FORM_SCHEMAS: mockKvThrowing as any }, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to list schemas from KV", details: "KV limit reached" });
    });

    it("POST /admin/forms/:formId rejects invalid JSON", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin/forms/some-form", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: "invalid-json"
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid JSON body schema" });
    });

    it("DELETE /admin/forms/:formId rejects unauthenticated", async () => {
      const req = new Request("http://localhost/admin/forms/some-form", {
        method: "DELETE"
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized admin access" });
    });

    it("DELETE /admin/forms/:formId handles deletion failures", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const mockKvThrowing = {
        delete: () => {
          throw new Error("KV read-only");
        }
      };
      const req = new Request("http://localhost/admin/forms/some-form", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await worker.fetch(req, { ...mockEnv, FORM_SCHEMAS: mockKvThrowing as any }, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to delete form", details: "KV read-only" });
    });

    it("GET /admin/submissions/:formId rejects unauthenticated", async () => {
      const req = new Request("http://localhost/admin/submissions/some-form", {
        method: "GET"
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized admin access" });
    });

    it("GET /admin/submissions/:formId handles DB retrieval failures", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const mockDbThrowing = {
        prepare: () => {
          throw new Error("D1 query error");
        }
      };
      const req = new Request("http://localhost/admin/submissions/some-form", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await worker.fetch(req, { ...mockEnv, DB: mockDbThrowing as any }, mockCtx);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to retrieve submissions", details: "D1 query error" });
    });
  });

  describe("Fallback and Default Route", () => {
    it("should return Default Fallback landing page for GET /", async () => {
      const req = new Request("http://localhost/");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      expect(await res.text()).toContain("Pouta Forms");
    });
  });

  describe("Branch Coverage Fallbacks", () => {
    it("should return the form schema as JSON when no Accept header is provided", async () => {
      await env.FORM_SCHEMAS.put("test-form", JSON.stringify(mockSchema));
      const req = new Request("http://localhost/forms/test-form");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockSchema);
    });

    it("should handle partial submission with answers as a string", async () => {
      const req = new Request("http://localhost/forms/test-form/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "sub-str-answers",
          status: "partial",
          answers: '{"welcome":"started-str"}'
        })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(201);

      const dbRow = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind("sub-str-answers").first();
      expect(dbRow?.answers).toBe('{"welcome":"started-str"}');
    });

    it("should redirect to Google OAuth login URL when Host header is missing", async () => {
      const req = new Request("http://localhost/admin/login");
      req.headers.delete("host");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      const location = res.headers.get("Location");
      expect(location).toContain("redirect_uri=https%3A%2F%2F%2Fadmin%2Foauth%2Fcallback");
    });

    it("POST /admin/preview defaults formId to preview", async () => {
      const token = await signJWT({ email: "admin@example.com", exp: Math.floor(Date.now() / 1000) + 120 }, mockEnv.JWT_SECRET);
      const req = new Request("http://localhost/admin/preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ schema: mockSchema })
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("<!DOCTYPE html>");
    });

    it("GET /admin redirects to login if unauthenticated and host is missing", async () => {
      const req = new Request("http://localhost/admin");
      req.headers.delete("host");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://admin/login");
    });
  });

  describe("Static Assets and Admin Logout Routes", () => {
    it("should serve /player.css", async () => {
      const req = new Request("http://localhost/player.css");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/css");
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    });

    it("should serve /player.js", async () => {
      const req = new Request("http://localhost/player.js");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/javascript");
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    });

    it("should serve /admin.css", async () => {
      const req = new Request("http://localhost/admin.css");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/css");
      expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    });

    it("should serve /admin.js", async () => {
      const req = new Request("http://localhost/admin.js");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/javascript");
      expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    });

    it("should serve /admin-module.js", async () => {
      const req = new Request("http://localhost/admin-module.js");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/javascript");
      expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    });

    it("should handle /admin/logout for localhost (http)", async () => {
      const req = new Request("http://localhost/admin/logout", {
        headers: { "Host": "localhost" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("http://localhost/");
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toContain("pouta_admin_session=");
      expect(cookie).not.toContain("Secure;");
    });

    it("should handle /admin/logout for external host (https)", async () => {
      const req = new Request("https://forms.pouta.io/admin/logout", {
        headers: { "Host": "forms.pouta.io" }
      });
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://forms.pouta.io/");
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toContain("pouta_admin_session=");
      expect(cookie).toContain("Secure;");
    });

    it("should handle /admin/logout when Host header is missing", async () => {
      const req = new Request("http://localhost/admin/logout");
      req.headers.delete("host");
      const res = await worker.fetch(req, mockEnv, mockCtx);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https:///");
    });
  });
});

