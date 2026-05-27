# CI/CD Design

**Date:** 2026-05-27  
**Scope:** Auto-deploy API wrapper to Oracle Cloud VM on push to main

## Goal

When code is pushed to `main`, the Oracle VM automatically pulls the latest code and rebuilds the `nocodb-api` Docker container — no manual SSH required.

## Approach

GitHub Actions SSHes into the Oracle VM and runs the deploy commands. No Docker registry needed; the image is built directly on the VM from the Dockerfile (same as the current manual workflow in `deploy.sh`).

## Components

### `.github/workflows/deploy.yml`

Trigger: `push` to `main`

Single job (`deploy`), runs on `ubuntu-latest`:
1. Uses `appleboy/ssh-action@v1` to SSH into the Oracle VM
2. Runs on the VM:
   ```
   cd /home/ubuntu/nocodb-faker
   git pull
   docker compose up -d --build nocodb-api
   ```

### GitHub Secrets (set once in repo settings)

| Secret | Value |
|--------|-------|
| `ORACLE_HOST` | Oracle VM public IP address |
| `ORACLE_SSH_KEY` | Full contents of `~/.ssh/oracle.key` |

SSH user is hardcoded as `ubuntu` (matches `deploy.sh`).

### Dockerfile fix

Change `COPY *.js ./` to `COPY api-wrapper.js ./` — after the repo reorganization only `api-wrapper.js` lives at the root, so be explicit rather than relying on glob behavior.

## Out of Scope

- PR checks / linting (no test suite exists)
- Docker registry (GHCR / Docker Hub)
- Rollback automation
- Deployment notifications (Slack, email)

## Prerequisites

The user must add the two GitHub secrets before the workflow will succeed:
1. Go to repo Settings → Secrets and variables → Actions → New repository secret
2. Add `ORACLE_HOST` (VM public IP)
3. Add `ORACLE_SSH_KEY` (paste contents of `~/.ssh/oracle.key`)

The Oracle VM must already have:
- The repo cloned at `/home/ubuntu/nocodb-faker`
- Docker and Docker Compose installed
- The `ubuntu` user's public key authorized (already the case since `deploy.sh` works manually)
