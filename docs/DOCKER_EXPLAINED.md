# 🐳 Docker Explained — FinSense

A plain-English guide to how Docker works in this project, what every command does, and whether we still need docker-compose.

---

## 🤔 What Problem Does Docker Solve?

Without Docker, to run FinSense on a new server you'd need to:
- Install Node.js (exact version)
- Install npm dependencies
- Set up environment variables
- Run the build
- Hope the server OS doesn't behave differently

With Docker, you **package the entire app + runtime into one portable unit** (an image). Any machine with Docker installed runs it identically.

---

## 🧱 Core Concepts

| Concept | Real-world analogy | In FinSense |
|---|---|---|
| **Dockerfile** | A recipe / build instructions | `Dockerfile` in the repo |
| **Image** | A frozen snapshot of the app | `finsense` (built image) |
| **Container** | A running instance of that image | `finsense-app` (running process) |
| **Layer** | A cached step in the build | Each `RUN`, `COPY` line in Dockerfile |
| **Volume** | External storage attached to a container | Not used here |
| **Network** | How containers/host communicate | `--network host` |

---

## 🗂️ How the Dockerfile Works (3-Stage Build)

```
Dockerfile
│
├── Stage 1: deps          ← Install npm dependencies
│   node:20-alpine
│   COPY package.json
│   RUN npm ci             ← Pure install, no code yet
│
├── Stage 2: builder       ← Build the Next.js app
│   COPY node_modules      ← From Stage 1 (cached)
│   COPY source code
│   RUN npm run build      ← Produces .next/standalone/
│
└── Stage 3: runner        ← Minimal production image
    COPY .next/standalone  ← Just the built output
    COPY .next/static      ← Static CSS/JS assets
    COPY public/           ← Public files
    CMD node server.js     ← Start the server
```

### Why 3 stages?
- Stage 1 caches `node_modules` separately — if you only change code (not `package.json`), stages 1 and 2's install step are **skipped from cache**, making builds faster.
- Stage 3 (the final image) does NOT contain `node_modules`, source code, or build tools — it's tiny and secure.

### What is `output: standalone`?
In `next.config.ts`:
```js
output: "standalone"
```
This tells Next.js to produce a **self-contained** `server.js` in `.next/standalone/` that includes only the node modules it actually needs — no `node_modules` folder in the final image. That's why the Dockerfile copies `.next/standalone/` directly.

---

## ⚙️ The Full Flow: From Code to Running App

```
Your Code
    │
    ▼
docker build -t finsense .
    │  Reads Dockerfile
    │  Stage 1: npm ci
    │  Stage 2: next build  →  .next/standalone/server.js
    │  Stage 3: copy output only
    │
    ▼
Docker Image: finsense:latest
(stored locally on the VM, ~200-300MB)
    │
    ▼
docker run --network host --env-file .env finsense
    │  Creates a container from the image
    │  Reads .env → injects as environment variables
    │  Starts: node server.js
    │  App listens on PORT from .env (must be 3001)
    │
    ▼
Container: finsense-app
(running process on the VM)
    │
    ▼
http://localhost:3001   ← app is here on the host
    │
    ▼
Nginx (reverse proxy)
    localhost:3001 → https://finsense.akt9802.in
    │
    ▼
Internet → https://finsense.akt9802.in ✅
```

---

## 🌐 Why `--network host`?

By default, Docker containers run in an **isolated network namespace** — they can't reach `localhost` on the host machine directly.

```
# Default Docker networking:
Host machine (localhost:3001)
    │  ← isolated wall
Container (has its own localhost)
```

With `--network host`, the container **shares the host's network**:
```
# --network host:
Host machine (localhost:3001)
    ║  ← shared network stack
Container (same localhost)
```

**Why this matters for FinSense:**
- Nginx runs on the host at `localhost:3001`
- Container also shares that same `localhost`
- Nginx can reach the app without port mapping tricks

**Side effect:** You do NOT use `-p 3001:3001` with `--network host`. The port is shared automatically.

---

## 🔑 How `--env-file .env` Works

```bash
docker run --env-file .env finsense
```

This reads every line from `.env` and injects them as **environment variables inside the container**.

### ⚠️ Critical Rule: `--env-file` OVERRIDES Dockerfile `ENV`

```dockerfile
# Dockerfile sets default:
ENV PORT=3001
```

```bash
# But .env on the VM had:
PORT=5000  ← this one WINS
```

The container started on port 5000 because `.env` overrode the Dockerfile default. **The .env file always wins at runtime.**

This is actually good design — the image stays generic, and the host machine controls configuration via `.env`.

**Always verify before deploying:**
```bash
grep -E "^PORT|^NODE_ENV" .env
# PORT=3001
# NODE_ENV=production
```

---

## 📦 Do We Still Need `docker-compose.yml`?

**Short answer: No, not for FinSense right now.**

### What docker-compose does
`docker-compose` is a tool that reads a `docker-compose.yml` file and manages **multiple containers together**.

```yaml
# docker-compose.yml example (multi-service)
services:
  app:
    build: .
    ports:
      - "3001:3001"
  redis:
    image: redis:alpine
  mongodb:
    image: mongo:7
  nginx:
    image: nginx:alpine
```

With one command `docker compose up`, it starts **all 4 services** in the right order with the right networking.

### Why FinSense doesn't need it
FinSense uses:
- **MongoDB Atlas** (cloud-hosted, not a local container)
- **Nginx** (installed directly on the host, not in Docker)
- **No Redis** currently

So there's only **1 container** to manage — the Next.js app. For a single container, `docker run` is simpler and more transparent.

### When would you add docker-compose back?
If you ever add:
- A **Redis container** (for session storage)
- A **self-hosted MongoDB** container
- A **worker/background job** container

Then docker-compose becomes useful again. Until then, `docker build` + `docker run` is cleaner.

---

## 🔄 What Happens When You Redeploy

```
git pull origin main           ← get new code on VM
    │
docker stop finsense-app       ← send SIGTERM to running process
docker rm finsense-app         ← delete the stopped container
    │                             (image still exists)
docker build -t finsense .    ← rebuild image with new code
    │  Docker re-uses cached layers where nothing changed
    │  Only the changed layers are rebuilt
    │
docker run ... finsense        ← new container from new image
    │
Old image still exists locally (unlabeled)
Run `docker image prune` to clean up old images
```

### Layer caching explained
If you only changed a TypeScript file (not `package.json`):
```
✅ CACHED  Stage 1 — npm ci        (package.json unchanged)
✅ CACHED  Stage 2 — node_modules  (same)
❌ REBUILT Stage 2 — COPY . .      (source changed)
❌ REBUILT Stage 2 — next build    (must rebuild)
❌ REBUILT Stage 3 — COPY output   (new build output)
```

If you change `package.json` (added a package):
```
❌ REBUILT Stage 1 — npm ci        (package.json changed)
❌ REBUILT everything after it
```

---

## 🧹 Useful Cleanup Commands

```bash
# See all images (including old ones)
docker images

# Remove old/unused images
docker image prune -f

# Remove everything unused (images, containers, networks)
docker system prune -f

# See all running containers
docker ps

# See all containers (including stopped)
docker ps -a

# Live logs from the container
docker logs -f finsense-app

# Open a shell inside the running container (debug)
docker exec -it finsense-app sh
```

---

## 📊 Summary

```
Dockerfile     → instructions to BUILD an image
docker build   → creates the image (finsense:latest)
docker run     → creates + starts a container from that image
--network host → container shares host's network (no port mapping needed)
--env-file     → injects .env into container (overrides Dockerfile ENV)
--restart      → auto-restarts container if it crashes or VM reboots
docker stop    → gracefully stops the container
docker rm      → removes the container (image still exists)
docker rmi     → removes the image itself

docker-compose → tool to manage MULTIPLE containers (not needed for now)
```
