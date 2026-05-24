// OAuth step 1 — kick off the GitHub authorize flow.
//
// Decap CMS at /admin/ opens this URL in a popup window:
//   /api/auth?provider=github
// We redirect to GitHub's authorize endpoint with our app's Client ID and
// the scopes Decap needs to read/write the repo.
export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end("OAUTH_GITHUB_CLIENT_ID is not set in Vercel environment variables.");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${host}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    // A random state string would normally protect against CSRF; for a single
    // editor scenario on a private OAuth app this is acceptable to omit.
  });

  res.statusCode = 302;
  res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
  res.end();
}
