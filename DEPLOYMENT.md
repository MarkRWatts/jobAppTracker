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

## 3. HTTPS: Caddy + acme-dns

The domain (`example.com`) is on Easyspace, which has no DNS API — so there's no direct Caddy DNS-01 plugin for it. The fix is **acme-dns delegation**: a one-time CNAME hands off just the ACME challenge subdomain to the free `auth.acme-dns.io` service, which Caddy's `caddy-dns/acmedns` plugin talks to for every cert issuance/renewal. The actual site's A record stays managed at Easyspace as normal.

One-time acme-dns registration:

```bash
curl -X POST https://auth.acme-dns.io/register
```

This returns `username`, `password`, `subdomain`, and `fulldomain`. For this deployment:
- `username`: `edaa2bbc-591c-46aa-82bc-e0afc98bd31b`
- `subdomain`: `2f17c12b-b3e0-410c-a775-e083e1c03704`
- `password`: not recorded here — it's in `.env.docker` on the server only (see [below](#4-envdocker))

Two DNS records added at Easyspace:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `_acme-challenge.jobapptracker` | `2f17c12b-b3e0-410c-a775-e083e1c03704.auth.acme-dns.io` |
| A | `jobapptracker` | `192.168.1.1` |

Caddy itself is defined in this repo, not hand-configured on the server:
- [`Dockerfile.caddy`](Dockerfile.caddy) — builds Caddy with the `caddy-dns/acmedns` plugin (not in the stock image).
- [`Caddyfile`](Caddyfile) — the site block. Note the `{$VAR}` syntax for reading env vars at Caddyfile-parse time (`{env.VAR}` is a different thing — a runtime request placeholder — and won't substitute here).
- [`docker-compose.prod.yml`](docker-compose.prod.yml) — the VM-only overlay that adds the `caddy` service and publishes 443/80. Also pins Caddy's own DNS resolution to `1.1.1.1`/`9.9.9.9`: the LAN's local DNS server had a stale cached negative (`NXDOMAIN`) response for the acme-dns hostname during initial setup, which broke the DNS-01 propagation check even though the record was correctly in place — pinning to a public resolver sidesteps the LAN's resolver entirely for this one container.
- [`docker-compose.override.yml`](docker-compose.override.yml) — keeps the Mac's local/dev setup (direct port publish, no proxy) working unchanged; auto-loaded only when no `-f` flags are given, so it never applies on the VM.

## 4. `.env.docker`

Created directly on the server (never committed — see `.env.docker.example` for the full variable list and shape). Differences from the Mac's version:
- `AUTH_URL=https://jobapptracker.example.com` (was `http://localhost:3001`)
- `ACMEDNS_USERNAME` / `ACMEDNS_PASSWORD` / `ACMEDNS_SUBDOMAIN` added, from the registration above
- `POSTGRES_PASSWORD` and `AUTH_SECRET` rotated to fresh values (no need to match the Mac's, since Postgres starts from a fresh init and sessions don't carry over across a rotated `AUTH_SECRET` anyway)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` unchanged — same OAuth client as the Mac setup

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
cd ~/jobAppTracker
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Starts `db`, `app`, and `caddy` together; `app`'s boot-time `prisma migrate deploy` no-ops since the schema's already current from the restored dump, and Caddy obtains its certificate automatically on first start.

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
