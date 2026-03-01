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

### Development Verification Loop (recommended)

Use this short loop while building features:

1. Fast logic checks before coding and after each change:
```bash
npm test
npm run mobile:test
```
2. Full mobile preflight before manual QA:
```bash
npm run mobile:verify
```
3. Interactive mobile dev loop:
```bash
npm run mobile:start
```
4. Automated UI flow + screenshots (for regression checks and design review):
```bash
npm run ios:maestro:test
```
5. Review generated screenshots:
- `mobile/.derived-data/maestro/core/artifacts/screenshots`
- `mobile/.derived-data/maestro/features/artifacts/screenshots`

If the simulator shows `No script URL provided`, restart Metro and relaunch from Expo:
```bash
npm run mobile:start
```

### Feature UI Tests (Reusable Maestro Harness)

Use one reusable feature runner that always does:

1. `ios:maestro:prepare`
2. Run one Maestro feature flow
3. `ios:maestro:teardown` (always, even on failure)

For full E2E (`npm run e2e:maestro`), setup/build happens once and the suite runs all flows in one pass via `mobile/.maestro/config.yaml`:

1. `adaptive-checkin-load-map.yaml`
2. `features/**/*.yaml`

This avoids rebuilding/rebooting simulator per feature flow.

Run the joint load visualization feature test:

```bash
npm run ios:maestro:test:joint-load
```

Joint-load flow path (stable, no scroll dependency):

1. Open `Load Map`
2. Tap `Add session`
3. Open `Visualization`
4. Assert chart + risk legend IDs

Run any feature flow with the same setup/teardown:

```bash
npm run ios:maestro:test:feature -- mobile/.maestro/features/<feature-name>.yaml
```

Feature artifacts are written to:

- `mobile/.derived-data/maestro/features/<feature-name>/`

For new feature UI flows, prefer:

1. Dedicated view/screen for the feature being tested
2. Stable `testID` selectors instead of text/position selectors
3. Flow assertions scoped to that feature view only
4. Shared Maestro fixtures with `runFlow` (for example `fixtures/session-start.yaml`)

### iOS Simulator E2E with Maestro

Prerequisites:

1. Xcode selected as active developer directory:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```
2. iOS simulator runtime available (`xcrun simctl list devices` should work).
3. Java 17+ available (`java -version`).
   If your shell cannot find Java 17 by default, add this once to `~/.zshrc` or `~/.bashrc`:
```bash
# Maestro/Android tooling requires Java 17 on PATH
if [ -d "/opt/homebrew/opt/openjdk@17/bin" ]; then
  export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
elif [ -d "/usr/local/opt/openjdk@17/bin" ]; then
  export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
fi

export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
```
   Then restart your shell (or run `source ~/.zshrc` / `source ~/.bashrc`) and re-check with `java -version`.
4. Maestro CLI installed:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Run flow:

```bash
npm run e2e:maestro
```

This command now runs `prepare -> test -> teardown`, so the simulator app session is closed when the run finishes.

Current flow file:

- `mobile/.maestro/adaptive-checkin-load-map.yaml`
- `mobile/.maestro/features/joint-load-visualization.yaml`
- `mobile/.maestro/fixtures/session-start.yaml`
- `mobile/.maestro/fixtures/load-map-add-session.yaml`

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
- `npm run ios:maestro:prepare`: install pods, build Release simulator app, install + launch app
- `npm run ios:maestro:test`: run Maestro `core` + `features` suites and write artifacts to `mobile/.derived-data/maestro/{core,features}`
- `npm run ios:maestro:test:feature`: reusable feature runner (`prepare -> feature flow -> teardown`)
- `npm run ios:maestro:test:joint-load`: joint-load visualization feature UI test
- `npm run ios:maestro:teardown`: terminate app + shutdown simulator + close Simulator app
- `npm run e2e:maestro`: run `ios:maestro:prepare`, `ios:maestro:test`, and always `ios:maestro:teardown`

## Initial architecture

- `src/adaptivePlan.js`: plan adaptation logic based on pain/readiness data
- `src/index.js`: entrypoint sample usage
- `test/adaptivePlan.test.js`: tests for adaptation behavior
- `mobile/App.js`: iOS-ready Expo app entrypoint
- `mobile/src/adaptivePlan.mjs`: mobile adaptation logic
- `mobile/test/adaptivePlan.test.mjs`: mobile logic test
- `mobile/test/projectConfig.test.mjs`: mobile Expo compatibility test
- `.github/workflows/ci.yml`: CI running lint + tests
