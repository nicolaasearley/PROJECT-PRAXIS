# Ops, Deployment, and Release Runbook

This document describes how to operate the Praxis mobile app in production using Expo, EAS, and the automation added in this repository.

## Local Development

- Install dependencies: `npm install`
- Start the Expo dev server: `npm start`
- iOS simulator: `npm run ios`
- Android emulator: `npm run android`

## Quality Gates

- Lint: `npm run lint`
- TypeScript: `npm run typecheck`
- Tests: `npm test`

These commands are wired into CI so pull requests must keep them green.

## Configuration & Environment

Environment variables are loaded via `app.config.ts` and exposed to the client as `extra` values. Create a `.env` file from `.env.example`:

```
cp .env.example .env
```

Key variables:

- `EXPO_APP_ENV`: development/staging/production flag used in analytics context
- `EXPO_PUBLIC_API_BASE_URL`: API base URL
- `EXPO_PUBLIC_SENTRY_DSN`: Sentry DSN (public key only)
- `EXPO_PUBLIC_ANALYTICS_KEY`: key for future analytics providers
- `EXPO_PUBLIC_EAS_PROJECT_ID`: Expo project UUID used by OTA updates
- `APP_VERSION`, `IOS_BUILD_NUMBER`, `ANDROID_VERSION_CODE`: native versioning knobs

Never commit real secrets; set them in your local `.env` and in CI secrets (`EXPO_TOKEN` for EAS builds, `EXPO_PUBLIC_*` vars for runtime config).

## Versioning

- App version follows `x.y.z` in `APP_VERSION`.
- iOS: bump `IOS_BUILD_NUMBER` for every App Store submission.
- Android: bump `ANDROID_VERSION_CODE` (integer) for every Play Store submission.
- Update `.env` (or CI variables) before triggering production builds.

## EAS Build Profiles

`eas.json` defines three profiles:

- **development**: internal dev client builds (`eas build --profile development --platform ios|android`)
- **preview**: internal/TestFlight/QA builds (`eas build --profile preview --platform ...`)
- **production**: App Store / Play Store releases (`eas build --profile production --platform ...`)

Channels map to update lanes: development → `development`, preview → `preview`, production → `production`.

## OTA Updates

Expo Updates is configured with runtime version policy `appVersion` and the EAS project ID. Recommended flows:

- Preview update: `eas update --channel preview`
- Production update: `eas update --channel production` (only after bumping versions)

## CI/CD

Two GitHub Actions workflows are provided:

- `.github/workflows/ci.yml`: runs on pushes/PRs to `main` and `develop`; installs deps, runs `typecheck`, `lint`, and `test`.
- `.github/workflows/eas-build.yml`: runs on tags (`v*.*.*`) or published releases; authenticates with EAS via `EXPO_TOKEN` and runs production builds for iOS and Android.

Set `EXPO_TOKEN` (and store credentials for submission) as GitHub repo secrets.

## Monitoring

Sentry is initialized in `src/monitoring/sentry.ts` and bootstrapped from `app/_layout.tsx`. Provide `EXPO_PUBLIC_SENTRY_DSN` to enable reporting.

## Analytics

A lightweight client lives in `src/core/analytics`. Key events are emitted for app open, onboarding steps, plan generation, and workout sessions. The backend is swappable via `setAnalyticsClient`; by default events are console-logged.

## Web Support

This project targets iOS and Android. Web builds are not validated; use Expo web at your own risk.

## Release Checklist

1. Update `.env` version fields.
2. Commit changes and tag `vX.Y.Z`.
3. Push tag to trigger EAS production builds.
4. (Optional) run `eas update --channel production` for OTA.
5. Submit binaries via EAS submit once store credentials are configured.
