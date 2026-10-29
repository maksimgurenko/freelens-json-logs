# Rebuild the native driver dependencies

The retained native drivers expect five small Wayland helper binaries under
`.scratch/find/48-host/`. Their authored C sources remain in Git history; the
generated protocol bindings and old binaries are disposable. This recipe restores
the build inputs without preserving another copy of the historical archive.

Read the [Linux UI playbook](../../docs/agents/ui-verification.md) before preparing
a native check. Building these tools grants no input authorization. The C helpers
use `wl_display_connect(NULL)` and do not establish isolation themselves. Never
execute them directly against a desktop; the existing guarded native drivers
must prove the private session and supply its environment first.

Requirements: Git history containing the revision below, `cc`, `wayland-scanner`,
Wayland client headers/library and xkbcommon headers/library. The XML downloads
must match the recorded SHA-256 hashes. If upstream content changes, recover those
exact inputs from its history or a matching cache; do not bypass the checks.

From the repository root, retrieve sources into a new temporary directory:

```sh
native_build="$(mktemp -d /tmp/freelens-native-build.XXXXXX)"
native_revision=98c215e62c5f821cb7a2b2bac194b21c9f5ef3f1
git show "$native_revision":docs/verification/48/native-pointer.c > "$native_build/native-pointer.c"
git show "$native_revision":docs/verification/48/native-pointer-session.c > "$native_build/native-pointer-session.c"
git show "$native_revision":docs/verification/48/native-ime-transactions.c > "$native_build/native-ime-transactions.c"
git show "$native_revision":docs/verification/30/ime-driver.c > "$native_build/ime-driver.c"
git show "$native_revision":docs/verification/30/ime-registry.c > "$native_build/ime-registry.c"
```

Obtain and verify both protocol definitions before generating code:

```sh
curl --fail --location \
  https://raw.githubusercontent.com/swaywm/wlr-protocols/master/unstable/wlr-virtual-pointer-unstable-v1.xml \
  --output "$native_build/virtual-pointer.xml"
curl --fail --location \
  https://raw.githubusercontent.com/swaywm/wlroots/master/protocol/input-method-unstable-v2.xml \
  --output "$native_build/input-method.xml"
sha256sum --check <<EOF
3ff6d540be0bc5228195bf072bde42117ea17945a5c2061add5d3cf97d6bb524  $native_build/virtual-pointer.xml
99414dbad9458e71aa1fa01bc45f94ca6685787bfcb4d98948f72c1b45b60703  $native_build/input-method.xml
EOF
```

Proceed only after both hashes pass. Generate bindings and compile; these commands
do not execute the resulting binaries:

```sh
wayland-scanner client-header "$native_build/virtual-pointer.xml" "$native_build/virtual-pointer-client.h"
wayland-scanner private-code "$native_build/virtual-pointer.xml" "$native_build/virtual-pointer-code.c"
wayland-scanner client-header "$native_build/input-method.xml" "$native_build/input-method-client.h"
wayland-scanner private-code "$native_build/input-method.xml" "$native_build/input-method-code.c"
cc -Wall -Wextra -Werror -I"$native_build" "$native_build/native-pointer.c" \
  "$native_build/virtual-pointer-code.c" -o "$native_build/native-pointer" -lwayland-client
cc -Wall -Wextra -Werror -I"$native_build" "$native_build/native-pointer-session.c" \
  "$native_build/virtual-pointer-code.c" -o "$native_build/native-pointer-session" -lwayland-client
cc -Wall -Wextra -Werror -I"$native_build" "$native_build/native-ime-transactions.c" \
  "$native_build/input-method-code.c" -o "$native_build/native-ime-transactions" -lwayland-client -lxkbcommon
cc -Wall -Wextra -Werror -I"$native_build" "$native_build/ime-driver.c" \
  "$native_build/input-method-code.c" -o "$native_build/native-ime" -lwayland-client -lm
cc -Wall -Wextra -Werror "$native_build/ime-registry.c" \
  -o "$native_build/native-registry" -lwayland-client
```

When preparing an authorized private-session run, place only the five rebuilt
binaries at the driver's expected paths in the owned scratch host directory.
Remove the temporary build directory after use.

Preservation verification rebuilt all five tools in a temporary directory with
these flags and checksum-matched cached XML, with no warnings and no native
execution. Wayland client 1.26.0 and xkbcommon 1.13.2 were available. This pins the
Git source bytes; some historical tooling manifests contain different source
hashes, so it does not establish archived binary identity or repeat native
acceptance. Protocol downloading was not repeated. Windows/macOS remain
unverified and outside this increment.
