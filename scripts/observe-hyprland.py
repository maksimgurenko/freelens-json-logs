#!/usr/bin/env python3
"""Read focus/workspace notifications from an explicitly selected Hyprland socket."""

import argparse
import json
import math
from pathlib import Path
import select
import socket
import sys
import time


EVENTS = frozenset(('activewindowv2', 'workspace', 'workspacev2', 'focusedmon'))
MAX_LINE_BYTES = 1024 * 1024


def positive_seconds(value):
    seconds = float(value)
    if not math.isfinite(seconds) or seconds <= 0:
        raise argparse.ArgumentTypeError('duration must be finite and greater than zero')
    return seconds


def observe(path, duration):
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
        connection.settimeout(5)
        connection.connect(str(path))
        connection.setblocking(False)
        started = time.monotonic()

        def emit(**record):
            print(json.dumps({'at': time.time(), 'elapsedSeconds': time.monotonic() - started,
                              **record}), flush=True)

        emit(kind='ready')
        buffer = b''
        count = 0
        while True:
            remaining = duration - (time.monotonic() - started)
            if remaining <= 0:
                if buffer:
                    raise ValueError('observation ended with an incomplete event line')
                emit(kind='complete', events=count)
                return
            if not select.select([connection], [], [], remaining)[0]:
                continue
            data = connection.recv(65536)
            if not data:
                raise ConnectionError('Hyprland event socket disconnected before observation completed')
            buffer += data
            while b'\n' in buffer:
                line, buffer = buffer.split(b'\n', 1)
                if len(line) > MAX_LINE_BYTES:
                    raise ValueError('Hyprland event line exceeded the size limit')
                event, separator, value = line.decode('utf-8').partition('>>')
                if separator and event in EVENTS:
                    emit(kind='event', event=event, value=value)
                    count += 1
            if len(buffer) > MAX_LINE_BYTES:
                raise ValueError('Hyprland event line exceeded the size limit')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--socket', type=Path, required=True,
                        help='explicit path to the intended instance .socket2.sock')
    parser.add_argument('--duration', type=positive_seconds, default=60,
                        help='seconds to observe after connecting (default: 60)')
    args = parser.parse_args()
    try:
        observe(args.socket, args.duration)
    except (OSError, ValueError) as error:
        print(f'observe-hyprland: {error}', file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print('observe-hyprland: interrupted; observation is incomplete', file=sys.stderr)
        return 130
    return 0


if __name__ == '__main__':
    sys.exit(main())
