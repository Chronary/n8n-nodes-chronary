# Changelog

All notable changes to `@chronary/n8n-nodes-chronary` are documented in this file, starting with 0.1.8.

## 0.1.8 — unreleased

- **IDs are encoded in request URLs (#2519).** Agent, Calendar and Event IDs now go into the URL as one encoded path segment instead of being interpolated raw, so a value such as `../agents/agt_1`, `cal_1#` or `evt_1?x=1` can no longer turn Event → Cancel or Get into a call on another resource. An empty, `.` or `..` ID is refused before any request is sent. Real Chronary IDs are unaffected; saved workflows keep their parameters.
