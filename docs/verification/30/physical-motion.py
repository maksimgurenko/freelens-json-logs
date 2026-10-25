"""Observe USB relative motion during restoration only; no grabs/input injection."""
import os
from pathlib import Path
import struct


class PhysicalMotion:
    def __init__(self):
        self.devices = []
        for sysfs in Path('/sys/class/input').glob('event*/device'):
            resolved = str(sysfs.resolve())
            if '/virtual/' in resolved or '/usb' not in resolved:
                continue
            try:
                if not int((sysfs / 'capabilities/rel').read_text().strip().replace(' ', ''), 16):
                    continue
                fd = os.open('/dev/input/' + sysfs.parent.name, os.O_RDONLY | os.O_NONBLOCK)
                self.devices.append((fd, sysfs.parent.name, (sysfs / 'name').read_text().strip()))
            except (FileNotFoundError, PermissionError):
                continue
        # New evdev descriptors start with no previously queued motion.

    def finish(self):
        event = struct.Struct('llHHi')
        results = []
        try:
            for fd, device, name in self.devices:
                movements = []
                while True:
                    try:
                        data = os.read(fd, event.size * 64)
                    except BlockingIOError:
                        break
                    if not data:
                        break
                    for sec, usec, kind, code, value in event.iter_unpack(data):
                        if kind == 2 and code in [0, 1] and value:
                            movements.append({'seconds': sec, 'microseconds': usec,
                                              'axis': 'x' if code == 0 else 'y', 'delta': value})
                results.append({'device': device, 'name': name, 'relativeMotion': movements})
        finally:
            for fd, _, _ in self.devices:
                os.close(fd)
        return {'devices': results, 'observedPhysicalMotion': any(x['relativeMotion'] for x in results),
                'scope': 'Known readable physical USB relative devices during restoration only; absence is not proof about all input sources.'}
