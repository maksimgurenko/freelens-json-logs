# Lens log extension ecosystem

Checked 2026-10-22. Public-source research only; no extension was installed or executed.

## Finding

No comparable **current Lens marketplace extension** was found in the inspected public catalogue snapshot. This does not prove that none exists. The nearest functional match found is the **legacy** `@hazem-ben-khalfallah/lens-log-viewer`: it reads JSON timestamp/level/message fields through a shell formatter, but declares Lens 6's extension API and opens a terminal. Its published implementation does not establish an integrated all-field inspector, exact raw-copy workflow, or user-editable named formatting profiles with automatic Kubernetes metadata matching. [Published package metadata](https://registry.npmjs.org/%40hazem-ben-khalfallah%2Flens-log-viewer), [formatter source](https://github.com/Hazem-Ben-Khalfallah/lens-log-viewer/blob/master/log-viewer.sh), [terminal integration source](https://github.com/Hazem-Ben-Khalfallah/lens-log-viewer/blob/master/src/pod-logs.tsx).

The project comparison baseline supplied for this research was Freelens JSON Logs 0.1.20: readable time/level/message, complete fields and exact original-text copy, named configurable field-path/timestamp/severity profiles, and automatic namespace/Pod-label/container matching over bounded single-Pod/container log snapshots. This research did not independently re-audit that local implementation.

## Search scope and reproducibility

Lens's marketplace documentation, dated **2026-09-30**, says both the app and website read npm packages carrying `lens-extension`; the app separately offers an **Installable** filter. The 2026.10 release announcement, displayed **2026-09-29**, introduces the new marketplace. Thus an old GitHub list or a package published recently is insufficient evidence of the new API. [Marketplace documentation](https://docs.lenshq.io/k8slens/extensions/marketplace/), [2026.10 announcement](https://lenshq.io/blog/lens-release-2026-10/).

The website's HTML was readable via HTTP even though the web reader could not open it. Its live JavaScript uses the following npm query and applies a public blacklist. On **2026-10-22**, the query response reported `total: 26` and returned 26 entries; the blacklist was empty. These are observations of one response snapshot, not an exhaustive count of every Lens-related npm package. [Marketplace](https://lenshq.io/extensions), [catalogue implementation asset](https://lenshq.io/_next/static/chunks/7863-8e601166cabb0e64.js), [reproducible npm search](https://registry.npmjs.org/-/v1/search?text=keywords%3Alens-extension&size=250), [blacklist](https://lenshq.io/extensions/blacklist.json).

All 26 returned packages' latest published manifests and registry READMEs were checked. Additional leads came from the older [Lens-owned extension list](https://github.com/lensapp/lens-extensions/blob/main/README.md), primary author repositories, and GitHub repository searches for [Lens log extensions](https://api.github.com/search/repositories?q=lens%20log%20extension&per_page=50), [Lens JSON logs](https://api.github.com/search/repositories?q=lens%20json%20logs&per_page=50), and [the exact “logs aggregator” phrase with Lens](https://api.github.com/search/repositories?q=%22logs%20aggregator%22%20lens&per_page=50). Generic npm searches were noisy and did not provide a completeness guarantee.

## Current catalogue candidates relevant to logs

| Package | Published version, publisher, date | Host evidence | What is established |
| --- | --- | --- | --- |
| [lens-docker](https://registry.npmjs.org/lens-docker) | 0.2.0; `nevalla` / Lauri Nevala; 2026-10-06 | `main: ./dist/index.js`; `@k8slens/feature-core ^7.5.2`; no legacy `renderer` entry | Local Docker/Compose management. Container and app logs open in a terminal. Its documented settings concern connection, refresh and cleanup; no JSON formatting profiles are described. [Author README](https://github.com/nevalla/lens-docker#readme), [Feature export](https://github.com/nevalla/lens-docker/blob/main/src/index.ts). |
| [@k8slens/datadog](https://registry.npmjs.org/%40k8slens%2Fdatadog) | 0.1.1; `iku-turso` / Iku-turso; 2026-10-07 | `main: ./dist/index.js`; `@k8slens/feature-core ^7.5.2`; no legacy `renderer` entry | Resource-scoped links open logs in the Datadog website; embedded views concern metrics, monitors and events. The author explicitly calls it a community extension, not made or endorsed by Datadog. This is an integration with an external observability service, not evidence of a local structured-container-log viewer. [Author README](https://github.com/Iku-turso/lens-datadog#readme), [Feature export](https://github.com/Iku-turso/lens-datadog/blob/main/src/index.ts). |

These markers establish use of the new Feature/contracts architecture, not verified loadability on a particular installed Lens build. Lens's compatibility documentation, dated **2026-09-30**, says it checks the extension's Lens-served dependency ranges against those supplied by the host; honest ranges still matter. No runtime compatibility check was performed here. [Compatibility matrix](https://docs.lenshq.io/k8slens/extensions/compatibility/).

## The “Logs Aggregator” lead

The 2026.10 announcement's screenshot/alternative text includes a navigator item named **Logs Aggregator**, beside Multi-Cluster View and Smart Notifications. It does **not** link that item to an npm package or describe its capabilities. The linked public examples elsewhere in the article also do not identify that package. [Announcement, displayed 2026-09-29](https://lenshq.io/blog/lens-release-2026-10/).

No matching name/description appeared in the 26-entry npm query snapshot, and the exact-phrase GitHub repository search returned zero results. Therefore the screenshot establishes a displayed extension label, while its publisher, public availability, source, host dependencies, JSON handling, field inspector and profile support remain **unknown**. It could be local or unpublished; that is a possibility, not a finding. The screenshot alone cannot support a feature-parity claim.

## Legacy formatters and adjacent extensions

Dates below come from the published npm version record, not a search engine crawl date. All four manifests declare `engines.lens: ^6.0.0`, split `main` and `renderer` entry points, and the old `@k8slens/extensions` SDK. They are **legacy API packages**, not established current-Lens 2026.10 marketplace competitors.

| Package | Latest published version, publisher, date | SDK marker | Proven behavior |
| --- | --- | --- | --- |
| [@hazem-ben-khalfallah/lens-log-viewer](https://registry.npmjs.org/%40hazem-ben-khalfallah%2Flens-log-viewer) | 0.0.5; `hazem-ben-khalfallah`; 2024-11-01 | `@k8slens/extensions ^6.1.9` | Pod menu launches `kubectl logs -f ... --tail=10` piped to an externally installed `log-viewer` shell script. The script uses `jq`, fixed `.timestamp` milliseconds, `.level`, `.message`, `.version`, `.mdc` and `.throwable`; it colors ERROR/WARN/INFO and formats throwable causes. [Integration](https://github.com/Hazem-Ben-Khalfallah/lens-log-viewer/blob/master/src/pod-logs.tsx), [formatter](https://github.com/Hazem-Ben-Khalfallah/lens-log-viewer/blob/master/log-viewer.sh). |
| [@jdinsel-xealth/bunyan-lens-ext](https://registry.npmjs.org/%40jdinsel-xealth%2Fbunyan-lens-ext) | 0.1.0; `jdinsel-xealth`; 2023-05-23 | `@k8slens/extensions ^6.1.9` | Pod menu opens a terminal running `kubectl logs -f ... --tail=300` piped to globally installed `bunyan -o short`. [Author README](https://github.com/jdinsel-xealth/bunyan-lens-ext#readme), [command source](https://github.com/jdinsel-xealth/bunyan-lens-ext/blob/master/src/pod-logs.tsx). |
| [@donvietnam/pino-pretty-lens-extension](https://registry.npmjs.org/%40donvietnam%2Fpino-pretty-lens-extension) | 1.0.0; `donvietnam` / DonVietnam; 2024-02-13 | `@k8slens/extensions ^6.5.2` | Pod-menu terminal wrapper for `pino-pretty`; README asks for the CLI globally. No integrated inspector or named automatic formatting-profile contract is documented. [Author README](https://github.com/DonVietnam/pino-pretty-lens-extension#readme), [manifest](https://github.com/DonVietnam/pino-pretty-lens-extension/blob/master/package.json). |
| [@andrea-falco/lens-multi-pod-logs](https://registry.npmjs.org/%40andrea-falco%2Flens-multi-pod-logs) | 1.0.1; `andrea-falco` / Andrea Falco; **2026-10-15** | `@k8slens/extensions ^6.1.9` | Workload action opens combined Pod/container logs in a terminal using externally installed `stern >=1.30.0`. Aggregation is the documented purpose; structured-record profiles are not established. Its recent publication date does not make it a new Feature API extension. [Author README](https://github.com/andrea-falco/lens-multi-pod-logs#readme). |

The hard-coded JSON shell formatter is the closest **formatting** comparator. Bunyan and pino-pretty are format-specific terminal alternatives; Multi Pod Logs addresses aggregation. None of these inspected artifacts establishes the full project baseline, and this research does not claim the legacy packages were tested on current Lens or Freelens.

## Catalogue snapshot examined

Each package link below is its primary npm registry record. The marker column is the latest version's `@k8slens/feature-core` dependency. Every listed manifest lacked the old `@k8slens/extensions` SDK and a `renderer` entry; all registry READMEs were scanned for log/JSON/profile features. Versions and dates can change after this access date.

| Package | Latest version | npm publisher | Version published (UTC date) | Feature core range |
| --- | --- | --- | --- | --- |
| [production-cluster-mark](https://registry.npmjs.org/production-cluster-mark) | 0.2.1 | yaltonmir | 2026-10-02 | `^7.5.2` |
| [lens-github-actions](https://registry.npmjs.org/lens-github-actions) | 0.3.0 | nevalla | 2026-10-05 | `^7.5.2` |
| [@k8slens/datadog](https://registry.npmjs.org/%40k8slens%2Fdatadog) | 0.1.1 | iku-turso | 2026-10-07 | `^7.5.2` |
| [@k8slens/cluster-groups](https://registry.npmjs.org/%40k8slens%2Fcluster-groups) | 0.2.3 | iku-turso | 2026-10-05 | `^7.5.2` |
| [@k8slens/colima](https://registry.npmjs.org/%40k8slens%2Fcolima) | 0.2.0 | jweak-mirantis | 2026-10-05 | `^7.5.2` |
| [lens-racks](https://registry.npmjs.org/lens-racks) | 0.1.3 | chenhunghan | 2026-10-08 | `^7.5.2` |
| [@k8slens/multi-cluster-view](https://registry.npmjs.org/%40k8slens%2Fmulti-cluster-view) | 0.2.0 | yaltonmir | 2026-10-01 | `^7.5.2` |
| [lens-glance](https://registry.npmjs.org/lens-glance) | 0.4.0 | skoncar | 2026-10-12 | `^7.5.2` |
| [lens-app-graph](https://registry.npmjs.org/lens-app-graph) | 0.2.1 | skoncar | 2026-10-12 | `^7.5.2` |
| [@k8slens/kubernetes-for-kids](https://registry.npmjs.org/%40k8slens%2Fkubernetes-for-kids) | 0.3.0 | iku-turso | 2026-10-04 | `^7.5.2` |
| [@k8slens/sticky-notes](https://registry.npmjs.org/%40k8slens%2Fsticky-notes) | 0.5.1 | iku-turso | 2026-10-05 | `^7.5.2` |
| [lens-extension-inspect](https://registry.npmjs.org/lens-extension-inspect) | 0.1.2 | nawitus | 2026-10-08 | `^7.5.2` |
| [lens-governance](https://registry.npmjs.org/lens-governance) | 0.1.0 | flaviuscdinu | 2026-10-01 | `^7.5.2` |
| [branding-lens](https://registry.npmjs.org/branding-lens) | 0.1.0 | yaltonmir | 2026-09-30 | `^7.4.0` |
| [k9s-lens](https://registry.npmjs.org/k9s-lens) | 0.1.0 | yaltonmir | 2026-10-01 | `^7.4.0` |
| [@skoncar/lens-pi-agent](https://registry.npmjs.org/%40skoncar%2Flens-pi-agent) | 0.1.0 | skoncar | 2026-10-01 | `^7.5.2` |
| [@jakolehm/lens-aurora](https://registry.npmjs.org/%40jakolehm%2Flens-aurora) | 0.1.1 | jakolehm | 2026-10-06 | `^7.5.2` |
| [@nevalla/kube-resource-map](https://registry.npmjs.org/%40nevalla%2Fkube-resource-map) | 2.0.0 | nevalla | 2026-10-06 | `^7.5.2` |
| [@k8slens/prom-queen](https://registry.npmjs.org/%40k8slens%2Fprom-queen) | 0.1.0 | iku-turso | 2026-09-30 | `^7.5.2` |
| [@k8slens/prom-king](https://registry.npmjs.org/%40k8slens%2Fprom-king) | 0.1.0 | iku-turso | 2026-09-30 | `^7.5.2` |
| [@k8slens/bookmarks](https://registry.npmjs.org/%40k8slens%2Fbookmarks) | 0.1.0 | iku-turso | 2026-09-30 | `^7.5.2` |
| [@k8slens/kube-documentation](https://registry.npmjs.org/%40k8slens%2Fkube-documentation) | 0.1.0 | jweak-mirantis | 2026-10-06 | `^7.5.2` |
| [lens-docker](https://registry.npmjs.org/lens-docker) | 0.2.0 | nevalla | 2026-10-06 | `^7.5.2` |
| [lens-gitlab](https://registry.npmjs.org/lens-gitlab) | 0.3.0 | r.panev | 2026-10-15 | `^7.5.2` |
| [aureliak8s-image-inventory](https://registry.npmjs.org/aureliak8s-image-inventory) | 0.1.1 | esrojasbg | 2026-10-13 | `^7.5.2` |
| [lens-image-explorer](https://registry.npmjs.org/lens-image-explorer) | 0.2.1 | obelisk121 | 2026-10-20 | `^7.5.2` |
