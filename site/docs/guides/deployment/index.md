# Deployment

> Put a moonpeak server on the internet over HTTPS.

Hosts need a public HTTPS URL. The simplest setup is a VPS with Node and a reverse proxy.

## Node on a server

```bash
npm ci
npm run build
PORT=8000 npm start          # /mcp and /health
```

Keep it running with systemd, pm2 or a container. A minimal systemd unit:

```ini
[Service]
WorkingDirectory=/opt/my-app
ExecStart=/usr/bin/node node_modules/moonpeak/bin/moonpeak.mjs start --port 8000
Environment=NODE_ENV=production
Restart=always
```

## HTTPS with nginx

```nginx
location = /mcp {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_buffering off;          # responses are streamed (SSE)
    proxy_read_timeout 120s;
}
```

Get a certificate with `certbot --nginx -d your-domain`. Add `limit_req` on `/mcp` if the server is public.

## Serverless and edge

Mount `createHandler` from `moonpeak/server` (Fetch API) on Workers, Deno Deploy, Bun or a Next.js route; see [Production server](/docs/app-framework/production-server). The handler is stateless, so it scales horizontally without sticky sessions.

## After deploying

```bash
npx moonpeak test --server https://your-domain/mcp    # same checks, against production
```

Then add `https://your-domain/mcp` in Claude (Connectors) or ChatGPT (Developer mode → Create app). The moonpeak demo at `https://moonpeak-ai.com/mcp` is deployed exactly this way.
