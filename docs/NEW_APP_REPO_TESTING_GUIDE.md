# Testing Environment Setup Guide (Package + Tooling)

This guide is only about local package/environment setup required to make unit tests and iOS simulator tests run.

## 1) Install required tools

1. Node.js 20+
2. Xcode (with Command Line Tools)
3. CocoaPods

Check:

```bash
node -v
npm -v
xcodebuild -version
xcrun simctl list devices
pod --version
```

If Xcode path is wrong:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

## 2) Install project dependencies

From repo root:

```bash
npm install
npm run mobile:install
```

## 3) Prepare iOS native dependencies

```bash
cd mobile
npx expo prebuild -p ios
cd ios
pod install
```

## 4) Confirm simulator runtime is available

```bash
xcrun simctl list runtimes
xcrun simctl list devices
```

You need at least one available iOS simulator device (for example iPhone 17).

## 5) Run tests

From repo root:

```bash
npm test
npm run mobile:test
npm run mobile:verify
```

Run iOS XCTest directly:

```bash
cd mobile/ios
xcodebuild test -workspace SuperstarPT.xcworkspace -scheme SuperstarPT -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ../.derived-data
```

## 6) Common setup failures

- `Project is incompatible with this version of Expo Go`:
  project SDK is older than installed Expo Go. Upgrade Expo SDK in project.
- `pod: command not found`:
  CocoaPods not installed.
- `simctl` shows no usable iOS devices:
  install iOS runtime in Xcode and re-check `xcrun simctl list devices`.
- `pod install` fails fetching dependencies:
  environment/network issue; re-run after restoring connectivity/permissions.
