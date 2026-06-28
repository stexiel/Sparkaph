# Static Assets Setup

This document explains how to set up automatic static assets deployment using GitHub Actions.

## Overview

Static assets (favicon, images, sounds, etc.) are automatically synced from the main repository to a dedicated assets repository via GitHub Actions. The backend serves these assets from a CDN (GitHub Pages) with local fallback.

## Setup Instructions

### 1. Create Assets Repository

Create a new GitHub repository named `sparkaph-assets` (or any name you prefer) to store static assets.

### 2. Configure GitHub Secrets

In your main Sparkaph repository, add the following secrets:

- `ASSETS_REPO_TOKEN`: A GitHub Personal Access Token with write access to the assets repository
  - Go to GitHub Settings → Developer Settings → Personal Access Tokens
  - Generate new token with `repo` scope
  - Add the token as a secret in your main repository

### 3. Enable GitHub Pages on Assets Repository

1. Go to the assets repository settings
2. Navigate to Pages
3. Enable GitHub Pages from the `main` branch
4. Note the URL (e.g., `https://yourusername.github.io/sparkaph-assets`)

### 4. Configure Backend Environment Variable

In your deployment environment (Render, VPS, etc.), set:

```
STATIC_ASSETS_URL=https://yourusername.github.io/sparkaph-assets
```

If not set, it defaults to `https://stexiel.github.io/sparkaph-assets`.

## How It Works

### Automatic Sync

When you push changes to `frontend/public/**` in the main repository:
1. The `sync-static-assets.yml` workflow triggers
2. It copies files from `frontend/public/` to the assets repository
3. Commits and pushes changes to the assets repository
4. Creates a GitHub release for version tracking

### CDN Serving

The backend serves static files as follows:
1. First tries to fetch from the CDN (GitHub Pages)
2. Falls back to local files if CDN is unavailable
3. Caches responses for 1 year for performance

### Frontend Usage

Use `/static/` prefix for all static assets:
```html
<link rel="icon" href="/static/favicon.png" />
<img src="/static/logo.png" alt="Logo" />
```

## Benefits

- **Instant Updates**: Changes to static files are deployed immediately via GitHub Actions
- **CDN Performance**: Assets served from GitHub Pages for faster loading
- **Version Control**: Each sync creates a GitHub release for rollback capability
- **Redundancy**: Local fallback ensures assets always available
- **Separation**: Static assets separated from application code for better organization

## Manual Deployment

To manually trigger the sync:
1. Go to Actions tab in GitHub
2. Select "Sync Static Assets" workflow
3. Click "Run workflow" button

## Troubleshooting

### Assets Not Updating
- Check the Actions tab to see if the workflow ran successfully
- Verify the `ASSETS_REPO_TOKEN` has correct permissions
- Ensure the assets repository has GitHub Pages enabled

### CDN Not Working
- Verify `STATIC_ASSETS_URL` environment variable is set correctly
- Check that GitHub Pages is enabled on the assets repository
- Test the CDN URL directly in a browser

### Local Fallback Not Working
- Ensure `frontend/public` folder exists in the backend directory
- Check file permissions on the public folder
