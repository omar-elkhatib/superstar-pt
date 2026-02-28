# Adaptive Coach App

Starter scaffold for an adaptive physiotherapy + personal training app.

## User instructions

### Run on your iPhone (Expo Go)

1. Install dependencies:
```bash
npm install
npm run mobile:install
```
2. Start the mobile app dev server:
```bash
npm run mobile:start
```
3. On your iPhone, install `Expo Go` from the App Store.
4. Scan the QR code shown in the terminal.
5. The app opens on your phone.

### Verify app locally before testing on phone

Run this from repo root:

```bash
npm run mobile:verify
```

This runs:

1. Mobile logic tests (`node --test`)
2. Mobile project config compatibility checks
3. Expo config validation (`expo config --json`)
4. iOS JS bundle export (`expo export --platform ios`)

If this command passes, your app is in a much safer state before scanning on a device.

### iOS Simulator UI feedback loop (Xcode)

1. Start Metro (required for interactive React Native UI in simulator):
```bash
npm run mobile:start
```
2. In another terminal, launch simulator app for manual interaction:
```bash
npm run ios:run
```
Expected success signal: terminal prints `Verified app launch: <bundle-id> (pid <number>)`.
3. Run automated UI interactions + screenshots:
```bash
npm run ios:test:ui
```
4. Open screenshot artifacts from the generated bundle:
`mobile/.derived-data/UIFeedback-release-<timestamp>.xcresult`

Note: `[libapp_launch_measurement.dylib] Failed to send CA Event...` lines are simulator telemetry warnings and are non-fatal if the app continues to bundle and render.

To print the latest artifact locations quickly:
```bash
npm run ios:test:artifacts
```

### iOS Simulator E2E with Maestro

Prerequisites:

1. Xcode selected as active developer directory:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```
2. iOS simulator runtime available (`xcrun simctl list devices` should work).
3. Maestro CLI installed:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Run flow:

```bash
npm run ios:run
npm run e2e:maestro
```

Current flow file:

- `mobile/.maestro/smoke.yaml`

### Build a downloadable iOS app (TestFlight/internal)

From the `mobile/` directory:

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

After the cloud build finishes, use the generated link/TestFlight install flow.

## Prerequisites

- Node.js 20+

## Local setup

```bash
npm install
npm run lint
npm test
npm start
```

## iOS app setup (Expo)

The `mobile/` folder contains a React Native Expo app you can run on iPhone.

```bash
npm run mobile:install
npm run mobile:start
```

Then:

1. Install `Expo Go` from the iOS App Store.
2. Scan the QR code shown by `expo start`.
3. The app opens on your phone.

If Expo Go shows an SDK mismatch, reinstall mobile dependencies and restart with cache clear:

```bash
rm -rf mobile/node_modules mobile/package-lock.json
npm run mobile:install
npm --prefix mobile run start -- --clear
```

## Build downloadable iOS app (TestFlight/internal)

From `mobile/`:

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

After build completes, install using the provided link/TestFlight.

## Scripts

- `npm start`: run app entrypoint
- `npm run dev`: run app in watch mode
- `npm test`: run tests
- `npm run test:watch`: run tests in watch mode
- `npm run lint`: syntax check source and tests
- `npm run mobile:install`: install mobile app dependencies
- `npm run mobile:start`: run Expo dev server for mobile app
- `npm run mobile:test`: run mobile logic + config tests
- `npm run mobile:verify`: run mobile tests + Expo config + iOS bundle export
- `npm run test:all`: run root tests and mobile tests together
- `npm run ios:run`: build and launch app in iOS simulator
- `npm run ios:test:ui`: run XCUITest UI flow and store screenshots in `.xcresult`
- `npm run e2e:maestro`: run Maestro E2E flows in `mobile/.maestro`

## Initial architecture

- `src/adaptivePlan.js`: plan adaptation logic based on pain/readiness data
- `src/index.js`: entrypoint sample usage
- `test/adaptivePlan.test.js`: tests for adaptation behavior
- `mobile/App.js`: iOS-ready Expo app entrypoint
- `mobile/src/adaptivePlan.mjs`: mobile adaptation logic
- `mobile/test/adaptivePlan.test.mjs`: mobile logic test
- `mobile/test/projectConfig.test.mjs`: mobile Expo compatibility test
- `.github/workflows/ci.yml`: CI running lint + tests
