# Readable Container Logs

Language for reading container output while keeping the application's original content available.

## Language

**Transport line**:
One line received from a container's logs, including a Kubernetes timestamp when present.

**Application text**:
The content written by the application on a transport line, excluding the timestamp added by Kubernetes.

**Parsed record**:
A JSON object represented by application text, including all of its original fields.

**Application timestamp**:
A time value recorded by the application in a parsed record.

**Kubernetes timestamp**:
A time value attached by Kubernetes when exposing a container's logs.

**Log snapshot**:
The container output returned by one completed log request for a selected Pod and container.

**Recent log window**:
The bounded set of transport lines available in the viewer from its latest accepted log snapshot.

**Paused log view**:
A log view whose automatic updates are suspended while its current records remain available for inspection and reformatting.

**Log target**:
The cluster, identified Pod, and named container whose output is being viewed. A replacement Pod is a different target even when it has the same name.

**Container instance**:
One run of a named container within a Pod. Restarting the container creates a new instance within the same log target.

**Formatting profile**:
A named set of rules for extracting and presenting readable log records. Profiles can select fields, interpret numeric timestamps and severity values, and control which additional fields appear compactly without changing the original content.

**Global default profile**:
The formatting profile used when there is no manual selection or matching enabled profile.

**Built-in Default profile**:
The read-only formatting profile containing the agreed default record-reading rules, available as a starting point for independent named profiles and as the recovery fallback.

**Profile match condition**:
A requirement on a container's namespace, Pod labels, or container name used to select its formatting profile automatically.

**Automatic profile selection**:
Selection of the first enabled formatting profile whose configured match conditions all match, in the user's chosen order, falling back to the global default profile. Profiles without match conditions do not participate in matching.

**Manual profile selection**:
A formatting profile explicitly chosen for the current cluster, Pod, and container view, taking precedence over automatic profile selection.

**Inline field**:
An additional field chosen for display in a record's compact presentation.

**Hidden field**:
An additional field omitted from a record's compact presentation while remaining available in the complete record and original text. Hiding does not suppress the extracted message, time, or level.

**Severity mapping**:
An explicit interpretation of an original numeric or textual level value as one of the canonical levels TRACE, DEBUG, INFO, WARN, ERROR, or FATAL.
