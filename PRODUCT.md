# Readable logs prototype context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The maintainer troubleshooting one Pod and one container in Freelens 1.10.3 during daily work.

## Product Purpose

Make JSON container output readable while preserving all original application text, transport lines, and parsed fields. This branch is a disposable interaction experiment, not an extension implementation.

## Operating Context

Enter a separate Readable logs cluster page from a Pod action. Ordinary use should feel nearly indistinguishable from the built-in Logs viewer. The live agreements are recorded in the map and its resolved parsing, profiles, and refresh decisions.

## Capabilities and Constraints

One target at a time; bounded snapshot replacement; refresh/pause; saved formatting profiles; exact field selectors and matching. Previous-instance logs, streaming, and multi-Pod output are outside the first release. The maintainer chose all three inspection layouts as a global viewer preference saved across restarts, separate from formatting profiles; Side is the initial default. This browser prototype uses synthetic logs and memory-only formatting profiles, with its inspection preference stored in a clearly named prototype localStorage key. It cannot prove host integration, actual polling performance, or persistence across restart.

## Brand Commitments

Inherit the Freelens 1.10.3 Logs visual conventions. Readability, familiarity, speed, and smoothness take priority over novel visual treatments.

## Evidence on Hand

The live human decisions in the [map](https://github.com/maksimgurenko/freelens-json-logs/issues/1) and pinned official Freelens v1.10.3 source. The prototype verdict and real host observations remain open. No production stack is selected by this HTML experiment.
