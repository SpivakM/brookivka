# ADR-0004: Vision Camera as the active camera implementation

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

The mobile app needs camera frames and a future frame processor for recognition. The repository
still contains a legacy `react-native-camera-kit` dependency.

## Decision

Use `react-native-vision-camera` and Worklets for the active AR camera path. Remove the legacy
dependency only after confirming no remaining runtime or native references require it.

## Consequences

Future detector integration should target the Vision Camera frame-processor boundary. Current
frame processing is telemetry-only and does not perform recognition.
