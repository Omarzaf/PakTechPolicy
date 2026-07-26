# Public deployment

The public artifact is `dist/`, produced by `pnpm build`. Repository source,
research files, contributor instructions, and local dependencies must never be
served.

GitHub Pages is configured through `.github/workflows/pages.yml`. The workflow:

1. checks out the repository;
2. uses Node.js 24 and the pinned pnpm version;
3. runs tests and offline release verification;
4. builds `dist/`;
5. uploads only `dist/`; and
6. deploys through the protected `github-pages` environment.

Pull requests into the repository's default branch
`feat/pak-tech-policy-v1` run the test, release-contract, and build steps without
receiving Pages permissions or uploading a deployment artifact. The Pages steps
run only after changes reach the default branch or when a maintainer dispatches
the workflow manually. GitHub Pages must use **GitHub Actions** as its publishing
source before the first deployment.

Production deployment remains a human-reviewed action. Before merging or
dispatching:

```bash
pnpm test
pnpm verify
pnpm build
pnpm check:sources
pnpm check:official-sources
```

Then serve `dist/` on an isolated localhost port and run `pnpm verify:site`
against that exact preview. Complete desktop, mobile, keyboard, and screenshot
review before publishing.
