# VM deployment (TrueNAS)

This documents how the app was deployed to its production home — an Ubuntu Server VM on TrueNAS — replacing the earlier Mac/OrbStack-only setup. It's the reference for redoing this from scratch (a new VM) or understanding why the deployment is shaped the way it is.

**Server**: Ubuntu Server 26.04 LTS, hostname `srvclaudedockerapps`, static LAN IP `192.168.1.1`, deploy user `deploy` (SSH key-only, via the 1Password SSH agent).

**Live at**: `https://jobapptracker.example.com` — LAN-only (no port-forwarding), backed by a real Let's Encrypt certificate.

## Why not a plain HTTP + IP address

Google's OAuth policy only exempts the literal hostname `localhost` from its HTTPS-only rule for redirect URIs — plain HTTP is rejected for any other hostname or private IP. So moving off the Mac's `http://localhost:3001` setup meant getting real HTTPS working first, not just changing a port.

## 1. Base OS setup

Docker Engine + Compose plugin, from Docker's official apt repo (not Ubuntu's `docker.io` package, to match the Compose v2 syntax this repo uses):

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker deploy   # log out/in (or new SSH session) for this to take effect
```

`dig`/`host`, for DNS debugging:

```bash
sudo apt-get install -y dnsutils   # resolves to bind9-dnsutils on this Ubuntu release
```

Firewall — default deny incoming, SSH open, Caddy's ports restricted to the LAN:

```bash
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow from 192.168.1.0/24 to any port 443 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 80 proto tcp
sudo ufw --force enable
```

Hostname (fixing a typo from initial VM setup):

```bash
sudo hostnamectl set-hostname srvclaudedockerapps
sudo sed -i "s/127.0.1.1 .*/127.0.1.1 srvclaudedockerapps/" /etc/hosts
```

## 2. Get the code

```bash
git clone https://github.com/MarkRWatts/jobAppTracker.git ~/jobAppTracker
```

Future deploys are just `git pull` + rebuild (see [Updating](#updating-the-deployment) below).

## 3. HTTPS: shared Caddy reverse proxy

**Update**: Caddy no longer runs inside this repo's own `docker-compose.prod.yml` — it moved to a small shared stack (`~/edge` on the server) once a second app (reFresh) needed to live on the same VM. Only one process can bind host ports 443/80, and Caddy is designed to serve many domains from one instance anyway (one Caddyfile, one site block per domain, SNI-based routing), so a single shared Caddy now fronts every app on this VM. This app's `docker-compose.prod.yml` just joins that Caddy's `edge` Docker network — see [Shared reverse proxy](#shared-reverse-proxy-edge) below for the actual Caddy setup.

The domain (`example.com`) is on Easyspace, which has no DNS API — so there's no direct Caddy DNS-01 plugin for it. The fix is **acme-dns delegation**: a one-time CNAME hands off just the ACME challenge subdomain to the free `auth.acme-dns.io` service, which Caddy's `caddy-dns/acmedns` plugin talks to for every cert issuance/renewal. The actual site's A record stays managed at Easyspace as normal.

One-time acme-dns registration (done once per app — each app gets its own acme-dns account, to avoid any renewal race between apps sharing one):

```bash
curl -X POST https://auth.acme-dns.io/register
```

This returns `username`, `password`, `subdomain`, and `fulldomain`. For this app:
- `username`: `edaa2bbc-591c-46aa-82bc-e0afc98bd31b`
- `subdomain`: `2f17c12b-b3e0-410c-a775-e083e1c03704`
- `password`: not recorded here — it's in `~/edge/.env` on the server only

Two DNS records added at Easyspace:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `_acme-challenge.jobapptracker` | `2f17c12b-b3e0-410c-a775-e083e1c03704.auth.acme-dns.io` |
| A | `jobapptracker` | `192.168.1.1` |

[`docker-compose.prod.yml`](docker-compose.prod.yml) — the VM-only overlay. Joins `app` to the external `edge` network under the alias `jobapptracker`, so the shared Caddy can reach it as `jobapptracker:3000`; publishes no host port. [`docker-compose.override.yml`](docker-compose.override.yml) keeps the Mac's local/dev setup (direct port publish, no proxy) working unchanged — auto-loaded only when no `-f` flags are given, so it never applies on the VM.

## 4. `.env.docker`

Created directly on the server (never committed — see `.env.docker.example` for the full variable list and shape). Differences from the Mac's version:
- `AUTH_URL=https://jobapptracker.example.com` (was `http://localhost:3001`)
- `POSTGRES_PASSWORD` and `AUTH_SECRET` rotated to fresh values (no need to match the Mac's, since Postgres starts from a fresh init and sessions don't carry over across a rotated `AUTH_SECRET` anyway)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` unchanged — same OAuth client as the Mac setup
- No `ACMEDNS_*` vars here — those live in `~/edge/.env` now (see [Shared reverse proxy](#shared-reverse-proxy-edge))

## 5. Google OAuth redirect URI

In Google Cloud Console → APIs & Services → Credentials → the existing OAuth Client, added as an **additional** authorized redirect URI (the `localhost` ones are still there too, for local dev):

```
https://jobapptracker.example.com/api/auth/callback/google
```

## 6. Data migration (Mac → VM)

Done once, before the VM's `app` container first started, so its boot-time `prisma migrate deploy` saw a fully-populated database rather than an empty one.

On the Mac:

```bash
docker exec jobapptracker-db-1 pg_dump -U jobapptracker -Fc jobapptracker > jobapptracker.dump
docker run --rm -v jobapptracker_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads.tar.gz -C /data .
scp jobapptracker.dump uploads.tar.gz deploy@192.168.1.1:~/
```

On the VM:

```bash
cd ~/jobAppTracker
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d db
docker exec -i jobapptracker-db-1 pg_restore -U jobapptracker -d jobapptracker --no-owner --no-privileges < ~/jobapptracker.dump

docker volume create jobapptracker_uploads
docker run --rm -v jobapptracker_uploads:/data -v "$HOME":/backup alpine tar xzf /backup/uploads.tar.gz -C /data

rm -f ~/jobapptracker.dump ~/uploads.tar.gz   # clean up the transferred archives
```

## 7. Bring up the full stack

```bash
docker network create edge   # once — see Shared reverse proxy below; skip if it already exists
cd ~/jobAppTracker
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
cd ~/edge && docker compose up -d --build   # brings up the shared Caddy, obtains the cert
```

`app`'s boot-time `prisma migrate deploy` no-ops since the schema's already current from the restored dump.

## 8. Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -L https://jobapptracker.example.com/   # 200, redirects to /login when signed out
curl -sS -o /dev/null -w "%{http_code}\n" https://jobapptracker.example.com/api/attachments/nonexistent   # 401, confirms auth is enforced
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs app   # "No pending migrations to apply"
```

Then sign in with Google from a LAN device and confirm the applications/companies/attachments match what was on the Mac.

## 9. Cutover

Once verified, the Mac's containers were stopped (not removed, for an easy rollback):

```bash
docker stop jobapptracker-app-1 jobapptracker-db-1
```

`docker start jobapptracker-app-1 jobapptracker-db-1` brings the old Mac instance straight back if ever needed.

## Shared reverse proxy (`~/edge`)

A single Caddy instance on the VM fronts **every** app on it — currently this one and [reFresh](https://github.com/MarkRWatts/reFresh) (see its own `DEPLOYMENT.md`). It lives at `~/edge` on the server directly, not in either app's git repo, since it isn't owned by any one app:

- `docker network create edge` — one external Docker network both apps' `app` containers join (via each repo's own `docker-compose.prod.yml`).
- `Dockerfile.caddy` — builds Caddy with the `caddy-dns/acmedns` plugin (not in the stock image):
  ```dockerfile
  FROM caddy:builder AS builder
  RUN xcaddy build --with github.com/caddy-dns/acmedns

  FROM caddy:latest
  COPY --from=builder /usr/bin/caddy /usr/bin/caddy
  ```
- `Caddyfile` — one site block per app, each with its own acme-dns credentials (a separate acme-dns registration per app — see step 3 above for how those are obtained):
  ```
  jobapptracker.example.com {
      tls {
          dns acmedns {
              username {$JOBAPPTRACKER_ACMEDNS_USERNAME}
              password {$JOBAPPTRACKER_ACMEDNS_PASSWORD}
              subdomain {$JOBAPPTRACKER_ACMEDNS_SUBDOMAIN}
              server_url https://auth.acme-dns.io
          }
      }
      reverse_proxy jobapptracker:3000
  }

  refresh.example.com {
      tls {
          dns acmedns { ... }   # same shape, REFRESH_ACMEDNS_* vars
      }
      reverse_proxy refresh:3000
  }
  ```
  Note `{$VAR}` — reads an env var at Caddyfile-parse time. `{env.VAR}` is a different thing (a runtime request placeholder) and silently won't substitute here; this bit the very first version of this setup.
- `docker-compose.yml`: the `caddy` service — publishes `443`/`80`, mounts the `Caddyfile`, joins the external `edge` network, and pins its own DNS resolution to `1.1.1.1`/`9.9.9.9` (the LAN's local resolver had propagation-check trouble with the acme-dns hostname during the very first setup — pinning sidesteps it entirely for this one container).
- `.env` (not committed anywhere): `<APPNAME>_ACMEDNS_USERNAME`/`PASSWORD`/`SUBDOMAIN` per app.

Adding a third app later: register it its own acme-dns account, add its DNS records, add a site block to this `Caddyfile`, add its credentials to this `.env`, `docker compose up -d --build`, and have the new app's own `docker-compose.prod.yml` join the `edge` network under a clear alias — no changes needed to the other apps.

## Updating the deployment

```bash
ssh deploy@192.168.1.1
cd ~/jobAppTracker
git pull
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Known follow-ups

- `/etc/sudoers.d/90-deploy-nopasswd` grants `deploy` passwordless sudo, added temporarily to automate the base OS setup. Worth removing now that setup is done (`sudo rm /etc/sudoers.d/90-deploy-nopasswd`) — nothing past step 1 needs root, only the `docker` group.
- The LAN's local DNS server (Pi-hole, `192.168.1.53`) had a stale negative-cache entry for the acme-dns hostname during setup, unrelated to any blocklist — it self-clears on its own TTL, and doesn't affect the app (Caddy bypasses it, see step 3).
