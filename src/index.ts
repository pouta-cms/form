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
    // Admin Route: GET /admin/logout
    // ------------------------------------------
    if (path === '/admin/logout' && method === 'GET') {
      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const secureFlag = protocol === 'https' ? ' Secure;' : '';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${protocol}://${host}/`,
          'Set-Cookie': `pouta_admin_session=; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pouta Forms</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-main: #0b0f19;
            --accent-color: #F59E0B;
            --accent-hover: #d97706;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.08);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-main);
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-image:
              radial-gradient(circle at 15% 30%, rgba(245, 158, 11, 0.06) 0%, transparent 45%),
              radial-gradient(circle at 85% 70%, rgba(239, 68, 68, 0.05) 0%, transparent 45%);
          }
          main {
            text-align: center;
            max-width: 480px;
            padding: 3rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
          }
          .logo-mark {
            width: 72px;
            height: 72px;
            margin-bottom: 0.5rem;
            opacity: 0.95;
          }
          h1 {
            font-size: 2.25rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          p {
            color: var(--text-secondary);
            font-size: 1rem;
            line-height: 1.65;
            max-width: 360px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
            color: #0b0f19;
            font-family: 'Outfit', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            padding: 0.8rem 2rem;
            border-radius: 10px;
            text-decoration: none;
            margin-top: 0.5rem;
            transition: opacity 0.2s, transform 0.2s;
            letter-spacing: 0.01em;
          }
          .btn:hover { opacity: 0.88; transform: translateY(-1px); }
          .divider {
            width: 40px;
            height: 2px;
            background: linear-gradient(135deg, #F59E0B, #EF4444);
            border-radius: 2px;
            opacity: 0.5;
            margin: 0.25rem auto;
          }
        </style>
      </head>
      <body>
        <main>
          <svg class="logo-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g stroke="#F59E0B" stroke-linecap="round">
              <line x1="50" y1="8" x2="50" y2="19" stroke-width="5.5"/>
              <line x1="50" y1="81" x2="50" y2="92" stroke-width="5.5"/>
              <line x1="8" y1="50" x2="19" y2="50" stroke-width="5.5"/>
              <line x1="81" y1="50" x2="92" y2="50" stroke-width="5.5"/>
              <line x1="21.7" y1="21.7" x2="29.4" y2="29.4" stroke-width="5"/>
              <line x1="70.6" y1="70.6" x2="78.3" y2="78.3" stroke-width="5"/>
              <line x1="78.3" y1="21.7" x2="70.6" y2="29.4" stroke-width="5"/>
              <line x1="29.4" y1="70.6" x2="21.7" y2="78.3" stroke-width="5"/>
              <line x1="13.4" y1="35.7" x2="20.2" y2="39.6" stroke-width="4.5"/>
              <line x1="79.8" y1="60.4" x2="86.6" y2="64.3" stroke-width="4.5"/>
              <line x1="35.7" y1="13.4" x2="39.6" y2="20.2" stroke-width="4.5"/>
              <line x1="60.4" y1="79.8" x2="64.3" y2="86.6" stroke-width="4.5"/>
              <line x1="64.3" y1="13.4" x2="60.4" y2="20.2" stroke-width="4.5"/>
              <line x1="39.6" y1="79.8" x2="35.7" y2="86.6" stroke-width="4.5"/>
              <line x1="86.6" y1="35.7" x2="79.8" y2="39.6" stroke-width="4.5"/>
              <line x1="20.2" y1="60.4" x2="13.4" y2="64.3" stroke-width="4.5"/>
            </g>
            <circle cx="50" cy="50" r="22" stroke="#F59E0B" stroke-width="3.5" fill="none"/>
            <circle cx="50" cy="50" r="15" stroke="#F59E0B" stroke-width="2.5" fill="none"/>
            <circle cx="50" cy="50" r="9" stroke="#F59E0B" stroke-width="2" fill="none"/>
            <circle cx="50" cy="50" r="4" fill="#F59E0B"/>
          </svg>
          <h1>Pouta Forms</h1>
          <div class="divider"></div>
          <p>High-performance edge forms. Admin access requires authorized Google Authentication.</p>
          <a href="/admin/login" class="btn" id="adminLoginBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            Admin Console Login
          </a>
        </main>
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
