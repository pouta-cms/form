import { Env, Submission, SubmissionStatus } from './types';
import { adminHtml } from './admin';
import { renderPlayerHtml } from './player';
import { LOGO_SVG, FAVICON_ICO_B64 } from './assets';

// ==========================================
// Base64Url / Text Encoding Helpers
// ==========================================

export function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

// ==========================================
// JWT Web Crypto API Implementation
// ==========================================

export async function signJWT(payload: object, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = arrayBufferToBase64Url(stringToUint8Array(JSON.stringify(header)));
  const encodedPayload = arrayBufferToBase64Url(stringToUint8Array(JSON.stringify(payload)));
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToUint8Array(tokenInput)
  );
  
  const encodedSignature = arrayBufferToBase64Url(signature);
  return `${tokenInput}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      stringToUint8Array(secret),
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['verify']
    );
    
    const signatureBytes = base64UrlToUint8Array(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      stringToUint8Array(tokenInput)
    );
    
    if (!isValid) return null;
    
    const payloadStr = uint8ArrayToString(base64UrlToUint8Array(encodedPayload));
    const payload = JSON.parse(payloadStr);
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// ==========================================
// Cookie Parser Helper
// ==========================================

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    const trimmedKey = key.trim();
    if (trimmedKey) {
      cookies[trimmedKey] = decodeURIComponent(valueParts.join('=').trim() || '');
    }
  }
  return cookies;
}

export function detectLanguage(request: Request): string {
  const url = new URL(request.url);
  const langQuery = url.searchParams.get('lang');
  if (langQuery) {
    const l = langQuery.toLowerCase();
    if (l === 'fi' || l === 'en') return l;
  }
  
  const acceptLang = request.headers.get('Accept-Language') || '';
  if (acceptLang.toLowerCase().includes('fi')) {
    return 'fi';
  }
  
  return 'en';
}

// ==========================================
// Authentication Middleware
// ==========================================

async function getAdminUser(request: Request, env: Env): Promise<{ email: string } | null> {
  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // 2. Check Cookie fallback
  if (!token) {
    const cookies = parseCookies(request.headers.get('Cookie'));
    token = cookies['pouta_admin_session'] || null;
  }
  
  if (!token) return null;
  
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || !payload.email) return null;
  
  const allowedEmails = env.ALLOWED_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
  if (!allowedEmails.includes(payload.email.toLowerCase())) {
    return null;
  }
  
  return { email: payload.email };
}

// ==========================================
// Telemetry Helper
// ==========================================

function logTelemetry(
  env: Env,
  formId: string,
  eventType: 'viewed' | 'started',
  sessionId: string,
  request: Request
) {
  try {
    if (!env.FORM_ANALYTICS) {
      console.warn("FORM_ANALYTICS binding is not defined");
      return;
    }
    
    const country = (request as any).cf?.country || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || 'unknown';
    const timestamp = Date.now();

    env.FORM_ANALYTICS.writeDataPoint({
      indexes: [formId],
      blobs: [
        eventType,
        sessionId,
        country,
        userAgent,
        referrer
      ],
      doubles: [
        timestamp
      ]
    });
  } catch (err) {
    console.error("Telemetry logging failed:", err);
  }
}

// ==========================================
// Main Request Handler
// ==========================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
    const method = request.method;

    // ------------------------------------------
    // Public Routes: Branding Assets
    // ------------------------------------------
    if (path === '/favicon.ico' && method === 'GET') {
      const bytes = base64UrlToUint8Array(FAVICON_ICO_B64);
      return new Response(bytes, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders
        }
      });
    }

    if (path === '/favicon.svg' && method === 'GET') {
      return new Response(LOGO_SVG, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders
        }
      });
    }

    if (path === '/logo.svg' && method === 'GET') {
      return new Response(LOGO_SVG, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders
        }
      });
    }

    if (path === '/logo.png' && method === 'GET') {
      return Response.redirect(url.origin + '/logo.svg', 302);
    }

    // Route matching regex patterns
    const formRegex = /^\/forms\/([^/]+)$/;
    const submissionsRegex = /^\/forms\/([^/]+)\/submissions$/;
    const adminFormRegex = /^\/admin\/forms\/([^/]+)$/;
    const adminSubmissionsRegex = /^\/admin\/submissions\/([^/]+)$/;

    // ------------------------------------------
    // Public Route: GET /forms/:formId
    // ------------------------------------------
    const formMatch = path.match(formRegex);
    if (formMatch && method === 'GET') {
      const formId = formMatch[1];
      const schema = await env.FORM_SCHEMAS.get(formId);

      const acceptHeader = request.headers.get('Accept') || '';
      const wantsHtml = acceptHeader.includes('text/html');

      if (!schema) {
        if (wantsHtml) {
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
              <title>Form Not Found</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { text-align: center; max-width: 400px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(20,28,47,0.7); }
                h1 { color: #ef4444; margin-bottom: 1rem; font-size: 1.75rem; }
                p { color: #94a3b8; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Form Not Found</h1>
                <p>The form you are looking for does not exist or has been deleted from the edge.</p>
              </div>
            </body>
            </html>`,
            {
              status: 404,
              headers: { 'Content-Type': 'text/html', ...corsHeaders }
            }
          );
        }
        return new Response(JSON.stringify({ error: 'Form not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Log Viewed telemetry point (fire-and-forget, non-blocking)
      logTelemetry(env, formId, 'viewed', 'anonymous', request);

      if (wantsHtml) {
        const lang = detectLanguage(request);
        return new Response(renderPlayerHtml(schema, formId, false, env.TURNSTILE_PUBLIC_KEY, lang), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      }

      return new Response(schema, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ------------------------------------------
    // Public Route: POST /forms/:formId/submissions
    // ------------------------------------------
    const submissionsMatch = path.match(submissionsRegex);
    if (submissionsMatch && method === 'POST') {
      const formId = submissionsMatch[1];
      
      let body: any;
      try {
        body = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { id, status, answers, turnstileToken } = body;

      if (!id || !status || answers === undefined) {
        return new Response(JSON.stringify({ error: 'Missing required fields: id, status, answers' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (status !== 'partial' && status !== 'completed') {
        return new Response(JSON.stringify({ error: "Invalid status. Must be 'partial' or 'completed'" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Check for locking: exists in D1 database and is already completed?
      try {
        const existing: any = await env.DB.prepare(
          'SELECT status FROM submissions WHERE id = ?'
        ).bind(id).first();

        if (existing && existing.status === 'completed') {
          return new Response(
            JSON.stringify({ error: 'This submission has already been finalized and is locked.' }),
            {
              status: 409, // Conflict
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            }
          );
        }

        // Anti-spam Turnstile validation on final submission
        if (status === 'completed' && env.TURNSTILE_SECRET_KEY) {
          if (!turnstileToken) {
            return new Response(JSON.stringify({ error: 'Spam protection token (turnstileToken) is required for final submission.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const clientIp = request.headers.get('cf-connecting-ip') || '';
          const turnstileVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(clientIp)}`
          });

          const verifyJson: any = await turnstileVerify.json();
          if (!verifyJson.success) {
            return new Response(JSON.stringify({ error: 'Spam validation failed.', details: verifyJson['error-codes'] }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        const now = Date.now();
        const answersStr = typeof answers === 'string' ? answers : JSON.stringify(answers);

        // Perform Single-Table Upsert
        // We set created_at and updated_at to now. On conflict, we DO NOT modify created_at, leaving it intact.
        await env.DB.prepare(
          `INSERT INTO submissions (id, form_id, status, answers, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?5)
           ON CONFLICT(id) DO UPDATE SET
             status = excluded.status,
             answers = excluded.answers,
             updated_at = excluded.updated_at`
        ).bind(id, formId, status, answersStr, now).run();

        // If it did not exist before and this is a partial save, log 'started' event to telemetry
        if (!existing && status === 'partial') {
          logTelemetry(env, formId, 'started', id, request);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: existing ? 200 : 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (dbErr: any) {
        console.error("Database submission error:", dbErr);
        return new Response(JSON.stringify({ error: 'Database operation failed.', details: dbErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // ------------------------------------------
    // OAuth Route: GET /admin/login
    // ------------------------------------------
    if (path === '/admin/login' && method === 'GET') {
      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const redirectUri = `${protocol}://${host}/admin/oauth/callback`;
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile` +
        `&prompt=consent`;

      return Response.redirect(googleOAuthUrl, 302);
    }

    // ------------------------------------------
    // OAuth Route: GET /admin/oauth/callback
    // ------------------------------------------
    if (path === '/admin/oauth/callback' && method === 'GET') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const redirectUri = `${protocol}://${host}/admin/oauth/callback`;

      try {
        // Exchange code for Google Access Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `code=${encodeURIComponent(code)}` +
            `&client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}` +
            `&client_secret=${encodeURIComponent(env.GOOGLE_CLIENT_SECRET)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&grant_type=authorization_code`
        });

        const tokenData: any = await tokenResponse.json();
        if (tokenData.error) {
          return new Response(JSON.stringify({ error: 'OAuth code exchange failed', details: tokenData }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const accessToken = tokenData.access_token;

        // Fetch User Info using Access Token
        const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const userinfo: any = await userinfoResponse.json();
        if (!userinfo.email) {
          return new Response(JSON.stringify({ error: 'Could not fetch user email from Google' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const email = userinfo.email.toLowerCase();
        const allowedEmails = env.ALLOWED_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());

        if (!allowedEmails.includes(email)) {
          return new Response(
            `<html><body><h3>Access Denied</h3><p>Email ${escapeHtml(email)} is not authorized to access this administration page.</p></body></html>`,
            {
              status: 403,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }

        // Generate JWT Session Cookie (valid for 7 days)
        const expirationSeconds = 7 * 24 * 60 * 60;
        const payload = {
          email,
          exp: Math.floor(Date.now() / 1000) + expirationSeconds
        };

        const sessionJwt = await signJWT(payload, env.JWT_SECRET);
        
        const secureFlag = protocol === 'https' ? ' Secure;' : '';

        return new Response(null, {
          status: 302,
          headers: {
            'Location': `${protocol}://${host}/admin`,
            'Set-Cookie': `pouta_admin_session=${sessionJwt}; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=${expirationSeconds}`
          }
        });

      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'OAuth process failed', details: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ------------------------------------------
    // Admin Route: POST /admin/preview
    // ------------------------------------------
    if (path === '/admin/preview' && method === 'POST') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let body: any;
      try {
        body = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body preview schema' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { schema, formId } = body;
      const lang = detectLanguage(request);
      return new Response(renderPlayerHtml(schema, formId || 'preview', true, env.TURNSTILE_PUBLIC_KEY, lang), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // ------------------------------------------
    // Admin Route: GET /admin
    // ------------------------------------------
    if (path === '/admin' && method === 'GET') {
      const user = await getAdminUser(request, env);
      if (!user) {
        const host = request.headers.get('host') || '';
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        return Response.redirect(`${protocol}://${host}/admin/login`, 302);
      }

      return new Response(adminHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // ------------------------------------------
    // Admin Route: GET /admin/forms
    // ------------------------------------------
    if (path === '/admin/forms' && method === 'GET') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const list = await env.FORM_SCHEMAS.list();
        return new Response(JSON.stringify({ keys: list.keys }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Failed to list schemas from KV', details: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ------------------------------------------
    // Admin Route: GET /admin/verify
    // ------------------------------------------
    if (path === '/admin/verify' && method === 'GET') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ authenticated: false, error: 'Unauthorized session' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ authenticated: true, email: user.email }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ------------------------------------------
    // Admin Route: POST /admin/forms/:formId
    // ------------------------------------------
    const adminFormMatch = path.match(adminFormRegex);
    if (adminFormMatch && method === 'POST') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const formId = adminFormMatch[1];
      let schema: any;
      try {
        schema = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body schema' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Save schema into KV
      await env.FORM_SCHEMAS.put(formId, JSON.stringify(schema));

      return new Response(JSON.stringify({ success: true, formId }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ------------------------------------------
    // Admin Route: DELETE /admin/forms/:formId
    // ------------------------------------------
    if (adminFormMatch && method === 'DELETE') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const formId = adminFormMatch[1];

      try {
        await env.FORM_SCHEMAS.delete(formId);
        await env.DB.prepare('DELETE FROM submissions WHERE form_id = ?').bind(formId).run();

        return new Response(JSON.stringify({ success: true, deleted: formId }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Failed to delete form', details: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // ------------------------------------------
    // Admin Route: GET /admin/submissions/:formId
    // ------------------------------------------
    const adminSubmissionsMatch = path.match(adminSubmissionsRegex);
    if (adminSubmissionsMatch && method === 'GET') {
      const user = await getAdminUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const formId = adminSubmissionsMatch[1];

      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM submissions WHERE form_id = ? ORDER BY updated_at DESC'
        ).bind(formId).all();

        const submissions = results.map((r: any) => ({
          ...r,
          answers: JSON.parse(r.answers)
        }));

        return new Response(JSON.stringify({ formId, submissions }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (dbErr: any) {
        return new Response(JSON.stringify({ error: 'Failed to retrieve submissions', details: dbErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Default Fallback
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Pouta Forms</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { text-align: center; max-width: 600px; padding: 2rem; }
          h1 { color: #38bdf8; font-size: 2.5rem; margin-bottom: 1rem; }
          p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; }
          .btn { background: #0284c7; color: white; padding: 0.8rem 1.6rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #0369a1; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Pouta Forms</h1>
          <p>This edge worker powers high-performance dynamic forms. Admin access requires authorized Google Authentication.</p>
          <a href="/admin/login" class="btn">Admin Console Login</a>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
