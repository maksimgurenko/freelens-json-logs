# CI and GitHub releases

[CI](../.github/workflows/ci.yml) runs on branch pushes, pull requests to `main`,
version-tag pushes and manual dispatch. It uses Node from `.nvmrc` and npm
11.16.0, installs the lockfile without lifecycle scripts, checks TypeScript,
runs the tests, builds and inspects the actual `.tgz`, and compares two builds
byte for byte. Every successful run retains the tarball and `SHA256SUMS` as a
14-day Actions artifact.

CI does not launch Freelens or Kubernetes. Installed-host acceptance is recorded
separately in [the verification reports](verification/19/README.md).

## Publish a version

1. Update `package.json` and the lockfile version, including the versioned
   `main` and `renderer` entry paths. Keep the package and store names stable.
2. Update the packaged installation guide and add `docs/releases/v<VERSION>.md`.
   Record supported-host validation for runtime changes. If changing the build
   toolchain, update `.nvmrc`, `packageManager`, CI's npm selection and the guide.
3. Merge the release changes into `main` and wait for CI to pass.
4. Create and push an annotated tag matching `package.json`, for example:

   ```sh
   git switch main
   git pull --ff-only
   git tag -a v0.1.20 -m 'Readable logs 0.1.20'
   git push origin v0.1.20
   ```

The tag run checks the version, release notes and membership in `main`, then
repeats all validation. Only after it succeeds does a separate job with
`contents: write` publish the GitHub release, attaching the verified tarball
and checksum. It downloads the build job's assets instead of rebuilding them
in the publishing job. No npm token or other custom secret is needed.

Inspect the published release and download its assets to check `SHA256SUMS`.
The GitHub source archives are not installable extension packages. GitHub
release publishing does not publish to npm; the current manifest deliberately
retains `private: true`.
