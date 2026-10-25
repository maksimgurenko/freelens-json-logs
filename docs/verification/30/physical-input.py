"""Observe only a named physical mouse's Back/Forward events, without grabbing it.

This never injects input. A zero-event capture is missing evidence, not a pass.
Do not use virtual uinput devices to claim the physical gate.
"""
import argparse
import fcntl
import json
import os
from pathlib import Path
import select
import struct
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", required=True)
    parser.add_argument("--seconds", type=float, default=5)
    parser.add_argument("--output", required=True)
    parser.add_argument("--stop-after-release", action="store_true")
    args = parser.parse_args()
    if not 0 < args.seconds <= 60:
        parser.error("Capture must be between 0 and 60 seconds")
    device = Path(args.device).resolve()
    sysfs = Path("/sys/class/input") / device.name / "device"
    # The mouse's HID parent must be physical USB, not a virtual uinput node.
    if "/virtual/" in str(sysfs.resolve()) or "/usb" not in str(sysfs.resolve()):
        parser.error("Expected a physical USB input device")
    name = (sysfs / "name").read_text().strip()
    keys = {158: "KEY_BACK", 159: "KEY_FORWARD", 275: "BTN_SIDE", 276: "BTN_EXTRA", 277: "BTN_FORWARD", 278: "BTN_BACK"}
    descriptor = os.open(device, os.O_RDONLY | os.O_NONBLOCK)
    result = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "device": str(device),
              "name": name, "physicalUsb": True, "grabs": False, "injection": False,
              "durationSeconds": args.seconds, "events": []}
    try:
        bits = bytearray(128)
        # EVIOCGBIT(EV_KEY, 128), from linux/input.h. This queries capabilities only.
        fcntl.ioctl(descriptor, (2 << 30) | (len(bits) << 16) | (ord('E') << 8) | 0x21, bits)
        result["backForwardCapabilities"] = [label for code, label in keys.items() if bits[code // 8] & (1 << (code % 8))]
        if not result["backForwardCapabilities"]:
            raise RuntimeError("Device advertises no Back/Forward keys")
        end = time.monotonic() + args.seconds
        event_struct = struct.Struct("llHHi")
        pressed = set()
        complete = False
        while (remaining := end - time.monotonic()) > 0:
            if not select.select([descriptor], [], [], remaining)[0]:
                break
            data = os.read(descriptor, event_struct.size * 64)
            for sec, usec, kind, code, value in event_struct.iter_unpack(data):
                if kind == 1 and code in keys:
                    result["events"].append({"seconds": sec, "microseconds": usec, "code": code, "name": keys[code], "value": value})
                    if value == 1:
                        pressed.add(code)
                    elif value == 0 and code in pressed:
                        complete = True
            if args.stop_after_release and complete:
                break
        result["physicalGestureObserved"] = bool(result["events"])
        result["completePressRelease"] = complete
        result["acceptance"] = "unverified: correlate complete press/release with packaged-host trace"
    finally:
        os.close(descriptor)
        Path(args.output).write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"events": len(result["events"]), "output": args.output}))


if __name__ == "__main__":
    main()
