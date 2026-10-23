# Existing log features in commercial Lens

Researched **2026-10-22**, against current first-party Lens documentation and release notes. Scope: **Mirantis Lens K8S IDE**, not OpenLens or Freelens. The old `k8slens.dev` documentation now redirects to `docs.lenshq.io`. The current documented stable release is **2026.10.51501-latest**; its page is stamped 2026-10-08. This is documentation research, not a hands-on validation of that build. [Current release notes](https://docs.lenshq.io/release-notes/lens-k8s-ide/lens-2026-10-51501/)

**Verdict:** Lens already overlaps with ordinary log viewing and has announced improved JSON formatting. The reviewed official material does **not establish a replacement for our configurable readable-record workflow**: extracted time/level/message, complete record inspection, exact original-text copy, named formatting profiles and automatic target matching. Those capabilities are unverified in Lens, rather than proven absent.

## Native Pod logs

The documented workflow opens a Pod's container output in a log tab, with Pod/container selectors and older data loaded when scrolling upward. No logging collector or external log backend is specified in that workflow. [View logs, page stamp 2026-02-09](https://docs.lenshq.io/k8slens/cluster/view-logs/)

The options include search with highlighting or filtering, timestamps, previous terminated container output, resource names, line wrapping, downloads, time/date navigation and returning to the latest event. [Log options, page stamp 2025-04-29](https://docs.lenshq.io/k8slens/using-lens/log-options/)

The strongest explicit JSON evidence is the **2025.1.161916** release, dated **2025-01-15**, which announced improved JSON formatting in logs. That statement does not specify pretty-print controls, recognized application fields, severity normalization, a field inspector, or custom parsing rules. It supports a limited formatting overlap, not equivalence to our profiles. [Official release notes](https://docs.lenshq.io/release-notes/lens-k8s-ide/lens-2025-1-161916/)

“Yes” below means explicitly documented. “Partial” means some overlap is documented. “Not documented” means no supporting contract was found in the reviewed sources, not that the feature cannot exist. “Unknown” is used where a claim exists but its behavior cannot be established.

| Capability | Native commercial Lens | Our extension 0.1.20 |
| --- | --- | --- |
| Open selected Pod/container logs through the connected cluster | **Yes**, including target selectors. [Guide](https://docs.lenshq.io/k8slens/cluster/view-logs/) | **Yes**; bounded current-instance snapshots, one identified Pod/container. |
| Search/find | **Yes**, highlight matches or filter output. [Options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**; literal Find with next/previous, without filtering. |
| Timestamps and wrapping | **Yes**. [Options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**. |
| Live follow | **Yes**; explicitly mentioned in current release history. [2026.3 notes](https://docs.lenshq.io/release-notes/lens-k8s-ide/lens-2026-3-251250/) | **Partial**; periodic complete snapshots and bottom following, not a streaming connection. |
| Explicit Pause that freezes retained records; Refresh once while paused | **Not documented**. Follow/scroll behavior does not establish this contract. [Options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**. |
| JSON formatting / pretty-printing | **Partial**; improved JSON formatting announced, precise presentation **Unknown**. [2025.1 notes](https://docs.lenshq.io/release-notes/lens-k8s-ide/lens-2025-1-161916/) | **Yes**; readable presentation plus pretty complete-object inspection. |
| Extract application time, canonical severity and message into compact rows | **Not documented** in the JSON announcement or log controls. [2025.1 notes](https://docs.lenshq.io/release-notes/lens-k8s-ide/lens-2025-1-161916/), [options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**. |
| All-fields inspector; inline/side/bottom placement | **Not documented**. [Log documentation](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**. |
| Separate exact application-text and transport-line copy | **Not documented**; download support does not establish per-record byte-preserving copy. [Options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | **Yes**; retained originals preserve spacing, escapes and timestamp precision. |
| Editable field paths, numeric timestamp units and severity mappings | **Not documented** in log or preferences documentation. [Options](https://docs.lenshq.io/k8slens/using-lens/log-options/), [Preferences, stamp 2026-10-05](https://docs.lenshq.io/k8slens/using-lens/preferences/) | **Yes**. |
| Saved named formatting profiles and manual/global-default selection | **Not documented**. [Preferences](https://docs.lenshq.io/k8slens/using-lens/preferences/) | **Yes**. |
| Automatically choose formatting by exact namespace, Pod labels and container | **Not documented**. Kubernetes target selection is a separate feature. [Guide](https://docs.lenshq.io/k8slens/cluster/view-logs/), [Preferences](https://docs.lenshq.io/k8slens/using-lens/preferences/) | **Yes**; manual override, then first enabled match in saved order, then global default. |
| Previous container, older-history loading, log download | **Yes**. [Guide](https://docs.lenshq.io/k8slens/cluster/view-logs/), [options](https://docs.lenshq.io/k8slens/using-lens/log-options/) | Outside the current bounded-current-instance scope. |

The local column was checked against [the installed-package version](../../package.json), [the host adapter](../../src/adapter/freelens.ts), [record formatting](../../src/core/records.ts), [profile rules and selection](../../src/core/profiles.ts), [the viewer and inspector](../../src/renderer/viewer.tsx), and [local behavior documentation](../local-development.md). It describes current implementation, not a fresh host test.

## Premium, cloud and extension features

Native real-time logs are included in the current **Personal** plan; **Lens Extensions** are included in **Plus, Pro and Enterprise**. Basic logs therefore should not be confused with an additional Pro-only JSON viewer. Eligibility restrictions for Personal still apply. [Current pricing comparison, undated, accessed 2026-10-22](https://lenshq.io/pricing/)

**Ask AI** can retrieve log lines, look for errors and summarize output through the user's selected external AI coding agent. It is a premium investigation workflow; its documentation does not promise deterministic field mappings, retained-original copying or saved formatting profiles. [Work with Ask AI, page stamp 2026-07-10](https://docs.lenshq.io/k8slens/how-to/work-with-ask-ai/). Cloud connectors and Teamwork provide cluster discovery/access; the reviewed premium-feature inventory does not document a separate **Lens Log Explorer** product or JSON profile facility. [Premium Features, page stamp 2026-10-06](https://docs.lenshq.io/k8slens/premium-features/)

The **2026.10** announcement visibly includes a **Logs Aggregator** navigator item in a screenshot, but does not describe its log semantics or link a released package for it. That establishes a pictured extension, not a documented JSON/profile replacement or a generally available hosted log service. [Lens announcement, published 2026-09-29](https://lenshq.io/blog/lens-release-2026-10/)

The marketplace is dynamic and community publishers can contribute. Its **By Lens** filter identifies team-published extensions; installing requires Plus, Pro, Enterprise or an active trial. The current documentation alone does not identify an official JSON-formatting/profile extension. Catalogue and legacy-extension findings are investigated separately; a name or old README is insufficient to establish current Lens compatibility. [Marketplace documentation, page stamp 2026-10-06](https://docs.lenshq.io/k8slens/extensions/marketplace/)

## Practical implications and remaining uncertainty

**Inference:** if the requirement is simply reading/searching Pod output, or modestly improving JSON formatting, Lens may already be sufficient. Our strongest distinct value is adapting heterogeneous application JSON into a consistent compact view while retaining complete records and exact originals, with saved per-workload rules. The available evidence does not justify abandoning that value as duplicated.

Before treating Lens as a replacement, a current-build check would need to establish its JSON controls and actual handling of nested fields, numeric levels/timestamps, exact raw copy, named profiles and target-based matching. Explicit Pause also remains unverified. The reviewed current log guide, options, preferences, IDE release notes and documentation search index contained no documented contract for those behaviors. Absence from documentation cannot settle their runtime availability. [Official documentation search index, live snapshot accessed 2026-10-22](https://docs.lenshq.io/search/search_index.json)

No installation, account/subscription change, cluster change or Lens launch was performed for this report.
