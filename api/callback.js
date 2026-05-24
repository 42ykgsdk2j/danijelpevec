// OAuth step 2 — GitHub redirects back here with a `code`. We exchange the
// code for an access token using our Client Secret, then post the token back
// to the parent window (Decap CMS) using window.opener.postMessage.
//
// This is the proxy that Netlify used to provide for free; we host an
// equivalent right next to the site as a Vercel serverless function so the
// secret never leaves the server.
export default async function handler(req, res) {
  const { code } = req.query;

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return reply(res, "error", { message: "OAuth env vars missing on the server." });
  }
  if (!code) {
    return reply(res, "error", { message: "Missing ?code parameter from GitHub." });
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await tokenRes.json();
    if (!data.access_token) {
      return reply(res, "error", data);
    }
    return reply(res, "success", { token: data.access_token, provider: "github" });
  } catch (err) {
    return reply(res, "error", { message: String(err) });
  }
}

function reply(res, status, content) {
  // Decap CMS expects a single string message of the form
  //   "authorization:github:<status>:<json payload>"
  // posted back to the opener via window.opener.postMessage.
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>OAuth ${status}</title></head>
<body>
<p>Authorization ${status}. You can close this window.</p>
<script>
  (function () {
    var sent = false;
    function send(target) {
      if (sent) return;
      sent = true;
      window.opener.postMessage(${JSON.stringify(message)}, target);
    }
    function receive(e) {
      if (e.data === "authorizing:github") {
        send(e.origin);
      }
    }
    window.addEventListener("message", receive, false);
    // Decap announces it's ready by posting "authorizing:github"; until then
    // we don't know the target origin. Still nudge in case Decap is faster.
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
</body>
</html>`;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}
