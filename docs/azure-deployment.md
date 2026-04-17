# Azure Deployment

## Service Choice: Azure Static Web Apps

Graph Editor is a pure client-side SPA with no backend — all state lives in `localStorage`. Azure Static Web Apps is the correct choice:

| Reason | Detail |
|--------|--------|
| Free tier | Sufficient for personal/small projects |
| Auto CI/CD | GitHub Actions workflow ships on every push to `main` |
| Global CDN | Assets served from edge nodes worldwide |
| SPA routing | Built-in fallback to `index.html` (configured in `staticwebapp.config.json`) |
| PR previews | Each pull request gets a staging URL automatically |

Alternatives considered and rejected:
- **Azure Blob Storage + CDN** — more manual setup, no PR previews
- **Azure App Service** — designed for servers, unnecessary overhead and cost
- **Azure Container Apps** — requires Dockerfile, overkill for static assets

---

## First-Time Deployment

### 1. Create the Azure resource

1. Go to [portal.azure.com](https://portal.azure.com)
2. Search **Static Web Apps** → **Create**
3. Fill in:
   - **Subscription** — your subscription
   - **Resource Group** — create new or use existing
   - **Name** — e.g. `graph-editor`
   - **Plan type** — Free
   - **Region** — closest to your users
4. **Deployment details** → Source: **GitHub**
5. Authorize Azure to access your GitHub account
6. Select:
   - **Organization** — your GitHub org/username
   - **Repository** — `graph-editor`
   - **Branch** — `main`
7. **Build Presets** — select **Vite**
   - App location: `/`
   - Api location: *(leave empty)*
   - Output location: `dist`
8. Click **Review + Create** → **Create**

Azure will automatically add the GitHub Actions workflow and the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your repository.

> **Note:** The workflow at `.github/workflows/azure-static-web-apps.yml` is already in the repo. Azure will use it on first push. If Azure generates a duplicate workflow, delete the auto-generated one and keep this one.

---

### 2. Get the deployment token (if setting up manually)

If you skip the portal wizard and need to connect later:

1. In Azure Portal → your Static Web App → **Manage deployment token**
2. Copy the token
3. In GitHub → repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: paste the token

---

### 3. Verify deployment

After the first push to `main`, go to **GitHub Actions** tab in your repo to watch the pipeline. On success:

1. In Azure Portal → your Static Web App → **Overview**
2. Click the **URL** (e.g. `https://random-name.azurestaticapps.net`)

---

## Ongoing Deployments

Every `git push` to `main` triggers the pipeline automatically:

```
git add .
git commit -m "your changes"
git push
```

Pipeline: `npm ci` → `npm run build` → deploy `dist/` to Azure CDN.

---

## Pull Request Previews

Opening a PR against `main` automatically creates a staging environment with its own URL. The URL is posted as a comment on the PR. The environment is torn down when the PR is closed.

---

## Custom Domain

1. Azure Portal → Static Web App → **Custom domains** → **Add**
2. Enter your domain (e.g. `graph-editor.yourdomain.com`)
3. Azure provides a CNAME record — add it to your DNS provider
4. Azure automatically provisions and renews a TLS certificate

---

## Environment Variables

This app has no environment variables — it is fully client-side with no API calls. If you add a backend in the future, set variables via:

- Azure Portal → Static Web App → **Configuration** → **Application settings**
- Variables are injected at build time as `VITE_*` prefixed vars

---

## Cost

The **Free tier** covers:
- 100 GB bandwidth/month
- Custom domains (up to 5)
- Staging environments (up to 3 PRs simultaneously)

For production with higher traffic, upgrade to **Standard** ($9/month) which adds more bandwidth, SLA, and private endpoints.
