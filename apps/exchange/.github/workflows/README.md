# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the DCC Wallet React application.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Test & Lint
- TypeScript type checking
- Biome code quality checks
- Run tests (if configured)

#### Build
- Builds for multiple environments (development, staging, production)
- Matrix strategy for parallel builds
- Uploads build artifacts

#### Docker
- Builds and pushes Docker image to GitHub Container Registry
- Only runs on push to `main`
- Uses Docker layer caching for faster builds

#### Deploy to AWS
- Deploys to AWS S3 + CloudFront
- Smart cache control (1 year for assets, no-cache for HTML)
- CloudFront cache invalidation
- Requires secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `S3_BUCKET`
  - `CLOUDFRONT_DISTRIBUTION_ID` (optional)

#### Deploy to Vercel (Alternative)
- Deploys to Vercel platform
- Requires secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

#### Deploy to Netlify (Alternative)
- Deploys to Netlify platform
- Requires secrets:
  - `NETLIFY_AUTH_TOKEN`
  - `NETLIFY_SITE_ID`

#### Notification
- Sends Slack notification on deployment completion
- Requires secret: `SLACK_WEBHOOK_URL` (optional)

### 2. Pull Request Quality Check (`pr-check.yml`)

**Triggers:**
- Pull request events (opened, synchronize, reopened)

**Features:**
- Code quality checks
- TypeScript type checking
- Biome validation
- Bundle size reporting
- Security audit
- Dependency outdated check
- Preview build generation
- Automated PR comments

### 3. Dependency Update Check (`dependency-update.yml`)

**Triggers:**
- Scheduled: Every Monday at 9 AM UTC
- Manual: `workflow_dispatch`

**Features:**
- Checks for outdated npm packages
- Runs security vulnerability audit
- Creates GitHub issue with update report
- Automatic labels: `dependencies`, `maintenance`

## Required Secrets

Configure these secrets in GitHub repository settings (Settings > Secrets and variables > Actions):

### AWS Deployment
```
AWS_ACCESS_KEY_ID          - AWS access key
AWS_SECRET_ACCESS_KEY      - AWS secret key
S3_BUCKET                  - S3 bucket name
CLOUDFRONT_DISTRIBUTION_ID - CloudFront distribution (optional)
```

### Vercel Deployment
```
VERCEL_TOKEN      - Vercel authentication token
VERCEL_ORG_ID     - Vercel organization ID
VERCEL_PROJECT_ID - Vercel project ID
```

### Netlify Deployment
```
NETLIFY_AUTH_TOKEN - Netlify authentication token
NETLIFY_SITE_ID    - Netlify site ID
```

### Notifications
```
SLACK_WEBHOOK_URL - Slack incoming webhook URL (optional)
```

## Environment Variables

Build-time environment variables are injected based on the target environment:

- `VITE_APP_ENV`: `development` | `staging` | `production`
- `VITE_NETWORK`: `testnet` | `mainnet`
- `VITE_NODE_URL`: DCC node URL
- Additional variables from `.env.production`

## Deployment Strategies

### Strategy 1: AWS S3 + CloudFront
**Best for:** Production deployment with CDN

1. Build artifacts uploaded to S3
2. CloudFront serves with global CDN
3. Smart caching:
   - Assets (JS/CSS): 1 year cache
   - HTML: No cache (always latest)
4. Automatic cache invalidation

### Strategy 2: Docker + Container Registry
**Best for:** Containerized deployments (Kubernetes, ECS, etc.)

1. Multi-stage Docker build
2. Push to GitHub Container Registry
3. Deploy to any container orchestration platform
4. Version tags for rollback capability

### Strategy 3: Vercel
**Best for:** Quick deployments with preview environments

1. Zero-configuration deployment
2. Automatic preview URLs for PRs
3. Built-in CDN and SSL
4. Serverless functions support

### Strategy 4: Netlify
**Best for:** JAMstack deployments with forms/functions

1. Continuous deployment
2. Automatic HTTPS
3. Split testing support
4. Form handling and serverless functions

## Manual Workflow Triggers

Run workflows manually from GitHub Actions tab:

1. Go to **Actions** tab in repository
2. Select workflow (e.g., "Dependency Update Check")
3. Click **Run workflow**
4. Select branch and click **Run workflow** button

## Monitoring & Debugging

### View Workflow Runs
- Navigate to **Actions** tab
- Select workflow to see run history
- Click on a run to see job details and logs

### Failed Builds
1. Check job logs for errors
2. Review changed files in commit
3. Run build locally: `npm run build`
4. Fix issues and push again

### Artifact Downloads
- Workflow artifacts available for 7 days (build) or 3 days (preview)
- Download from workflow run page
- Useful for debugging build issues

## Performance Optimization

### Caching
- npm dependencies cached with `setup-node@v4`
- Docker layers cached with GitHub Actions cache
- Reduces build time by 50-70%

### Matrix Builds
- Parallel builds for different environments
- Faster overall pipeline execution

### Conditional Jobs
- Docker and deploy jobs only run on `main` branch
- Saves CI/CD minutes on feature branches

## Security Best Practices

1. **Secrets Management**: Never commit secrets to repository
2. **Branch Protection**: Require PR reviews before merging
3. **Security Audits**: Automatic npm audit on every PR
4. **Dependency Updates**: Weekly automated checks
5. **Access Control**: Limit AWS/deployment credentials to specific resources

## Troubleshooting

### "npm audit" Failures
- Review vulnerabilities in workflow logs
- Update dependencies: `npm update`
- Check for breaking changes before updating

### Docker Build Failures
- Check Dockerfile syntax
- Verify `npm ci --legacy-peer-deps` succeeds locally
- Review build logs for specific errors

### Deployment Failures
- Verify secrets are correctly configured
- Check AWS/Vercel/Netlify credentials are valid
- Review deployment provider status pages

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from GitHub releases

# Run workflow
act push

# Run specific job
act -j build

# Use secrets file
act --secret-file .secrets
```

## Contributing

When adding new workflows:

1. Test locally with `act` if possible
2. Use meaningful job and step names
3. Add error handling and fallbacks
4. Document required secrets
5. Update this README

## Support

For issues with CI/CD pipelines:
- Check workflow logs in Actions tab
- Review GitHub Actions documentation
- Open issue with workflow run link
