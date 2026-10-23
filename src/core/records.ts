import { decodePath, defaultFormatting, LEVELS, type Formatting } from './profiles.ts';

/** Deterministic extraction; no host, clock, storage or navigation access. */
export type JsonObject = { [key: string]: unknown };
export type FieldPath = readonly string[];
export interface LogRecord {
  transportLine: string;
  applicationText: string;
  kubernetesTimestamp?: string;
  parsed?: JsonObject;
}
export interface ReadableRecord {
  message: string;
  level?: string;
  canonicalLevel?: string;
  timestamp?: string;
  timestampSource?: 'application' | 'kubernetes';
  selectedPaths: FieldPath[];
  additionalFields?: JsonObject;
  inlineFields?: { path: string; value: unknown }[];
}

/** RFC 3339, including fractional precision. Reject Date's calendar rollover. */
export function timestampMillis(value: unknown): number | undefined {
  if (typeof value !== 'string') return;
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?([Zz]|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return;
  const [, y, mo, d, h, mi, s, fraction, zone] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || Number(h) > 23 || Number(mi) > 59 || Number(s) > 60) return;
  let offset = 0;
  if (!/z/i.test(zone)) {
    const hours = Number(zone.slice(1, 3)), minutes = Number(zone.slice(4));
    if (hours > 23 || minutes > 59) return;
    offset = (hours * 60 + minutes) * (zone[0] === '+' ? 1 : -1);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(Number(h), Number(mi), Math.min(Number(s), 59), Number((fraction ?? '').padEnd(3, '0').slice(0, 3)));
  return date.getTime() - offset * 60_000 + (s === '60' ? 1000 : 0);
}

export function parseTransportLine(transportLine: string): LogRecord {
  const prefix = /^(\S+) ([\s\S]*)$/.exec(transportLine);
  const hasTimestamp = prefix && timestampMillis(prefix[1]) !== undefined;
  const applicationText = hasTimestamp ? prefix[2] : transportLine;
  let parsed: JsonObject | undefined;
  try {
    const value: unknown = JSON.parse(applicationText);
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) parsed = value as JsonObject;
  } catch { /* Non-object/malformed inputs remain exact application text. */ }
  return { transportLine, applicationText, kubernetesTimestamp: hasTimestamp ? prefix[1] : undefined, parsed };
}

function atPath(object: JsonObject, path: FieldPath): unknown {
  let value: unknown = object;
  for (const key of path) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return;
    if (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(key)) return;
    value = (value as JsonObject)[key];
  }
  return value;
}
function nonblank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function pick(object: JsonObject, paths: FieldPath[], usable: (v: unknown) => boolean) {
  for (const path of paths) {
    const value = atPath(object, path);
    if (usable(value)) return { path, value };
  }
}

export function formatDefault(record: LogRecord): ReadableRecord {
  return formatRecord(record, defaultFormatting());
}

function applicationTime(value: unknown, unit: Formatting['numericTimestamp']): string | undefined {
  if (typeof value === 'string') return timestampMillis(value) !== undefined ? value : undefined;
  if (typeof value !== 'number' || unit === 'unset' || !Number.isFinite(value)) return;
  const date = new Date(value * (unit === 'seconds' ? 1000 : 1));
  if (Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 0 && date.getUTCFullYear() <= 9999) return date.toISOString();
}
/** Compile once for a whole retained window, rather than decoding paths for each row. */
export function recordFormatter(format: Formatting): (record: LogRecord) => ReadableRecord {
  const messages = format.messagePaths.map(decodePath), times = format.timestampPaths.map(decodePath), levels = format.levelPaths.map(decodePath);
  const hidden = format.hiddenPaths.map(decodePath);
  const inline = format.inlinePaths.map(path => ({ path, segments: decodePath(path) }));
  return record => {
  const object = record.parsed;
  const message = object && pick(object, messages, nonblank);
  const time = object && pick(object, times, v => applicationTime(v, format.numericTimestamp) !== undefined);
  const level = object && pick(object, levels, v => nonblank(v) || typeof v === 'number');
  const originalLevel = level ? String(level.value) : undefined;
  const mapped = level && format.severityMappings.find(mapping => typeof mapping.source === typeof level.value &&
    (typeof mapping.source === 'string' ? mapping.source.toLowerCase() === String(level.value).toLowerCase() : mapping.source === level.value));
  const normalized = originalLevel?.toUpperCase();
  const canonical = mapped ? mapped.target : normalized === 'WARNING' ? 'WARN' : normalized && (LEVELS as readonly string[]).includes(normalized) ? normalized : undefined;
  const selectedPaths = [message?.path, time?.path, level?.path].filter((p): p is FieldPath => !!p);
  const timestamp = time ? applicationTime(time.value, format.numericTimestamp) : record.kubernetesTimestamp;
  const additional = object && additionalFields(object, [...selectedPaths, ...hidden]);
  const inlineFields: { path: string; value: unknown }[] = [];
  // Earlier entries win overlapping selections so compact fields do not repeat.
  let remaining = additional;
  for (const field of inline) {
    const value = remaining && atPath(remaining, field.segments);
    if (value !== undefined) {
      inlineFields.push({ path: field.path, value });
      remaining = additionalFields(remaining!, [field.segments]);
    }
  }
  return {
    message: message ? message.value as string : record.applicationText,
    timestamp, timestampSource: time ? 'application' : timestamp ? 'kubernetes' : undefined,
    level: canonical ?? originalLevel, canonicalLevel: canonical, selectedPaths,
    additionalFields: additional, inlineFields,
  };
  };
}
export function formatRecord(record: LogRecord, format: Formatting): ReadableRecord {
  return recordFormatter(format)(record);
}

/** Copy only containers on selected paths; never mutate original objects or siblings. */
function additionalFields(object: JsonObject, paths: FieldPath[]): JsonObject {
  const copy = (Array.isArray(object) ? [...object] : Object.assign(Object.create(null), object)) as JsonObject;
  for (const [head, ...rest] of paths) {
    if (!Object.hasOwn(copy, head)) continue;
    if (!rest.length) delete copy[head];
    else {
      const child = copy[head];
      if (child && typeof child === 'object') {
        const remaining = additionalFields(child as JsonObject, [rest]);
        if (!Object.keys(remaining).length) delete copy[head];
        else copy[head] = remaining;
      }
    }
  }
  return copy;
}

/** The local timezone is explicit at the presentation boundary; originals keep precision. */
export function displayTimestamp(value: string | undefined, timeZone?: string): string {
  const milliseconds = timestampMillis(value);
  if (milliseconds === undefined) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hourCycle: 'h23', timeZone,
  }).format(milliseconds);
}
