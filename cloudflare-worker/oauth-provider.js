// GitHub OAuth provider for Decap CMS, implementing the handshake Decap's
// github backend expects (base_url + /auth, base_url + /callback).
//
// Required secrets (see README.md for how to set these):
//   GITHUB_CLIENT_ID     - from the GitHub OAuth App
//   GITHUB_CLIENT_SECRET - from the GitHub OAuth App
//
// This worker never stores anything: the CSRF `state` is round-tripped via
// an HttpOnly cookie, and the GitHub access token is handed straight to the
// browser popup, never persisted server-side.

const COOKIE_NAME = "decap_oauth_state";

function randomState() {
  return crypto.randomUUID();
}

function htmlResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function handleAuth(url, env) {
  if (!env.GITHUB_CLIENT_ID) {
    return htmlResponse(
      "Server misconfigured: GITHUB_CLIENT_ID secret is not set on this worker.",
      500
    );
  }

  const state = randomState();
  const redirectUri = new URL("/callback", url).toString();
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo,user");
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": `${COOKIE_NAME}=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
      "Cache-Control": "no-store",
    },
  });
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return match ? match[1] : null;
}

function errorPage(message) {
  return htmlResponse(
    `<!DOCTYPE html><html><body><script>
(function () {
  window.opener.postMessage(
    "authorization:github:error:" + JSON.stringify({ message: ${JSON.stringify(message)} }),
    "*"
  );
})();
</script><p>Authorization failed: ${message}. You can close this window.</p></body></html>`,
    400
  );
}

async function handleCallback(url, request, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return errorPage("server misconfigured: OAuth secrets are not set on this worker");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, COOKIE_NAME);

  if (!code || !state || !cookieState || state !== cookieState) {
    return errorPage("invalid or missing state");
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/callback", url).toString(),
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return errorPage(tokenData.error_description || "token exchange failed");
  }

  const payload = JSON.stringify({
    token: tokenData.access_token,
    provider: "github",
  });

  return htmlResponse(
    `<!DOCTYPE html><html><body><script>
(function () {
  function receiveMessage(e) {
    window.removeEventListener("message", receiveMessage, false);
    window.opener.postMessage(
      "authorization:github:success:" + ${JSON.stringify(payload)},
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script><p>Authorized. You can close this window.</p></body></html>`,
    200,
    { "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/` }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      return handleAuth(url, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(url, request, env);
    }
    return new Response("Not found", { status: 404 });
  },
};
