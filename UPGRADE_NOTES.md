# Expo SDK 52 → SDK 53 Upgrade Notes

## Overview

This upgrade migrates the project from Expo SDK 52 to Expo SDK 53, removing all custom Folly coroutine workarounds and restoring the official Expo SDK 53 native configuration.

## Key Changes

### Dependency Version Updates

**Core Framework:**
- `expo`: `~54.0.27` → `~53.0.0`
- `react-native`: `0.81.5` → `0.79.6`
- `react-native-reanimated`: `~3.10.1` → `~3.17.4`
- `react-native-gesture-handler`: `~2.28.0` → `~2.20.0`

**Expo Packages:**
- `expo-application`: `~7.0.8` → `~6.1.5`
- `expo-constants`: `~18.0.11` → `~17.1.7`
- `expo-device`: `~8.0.10` → `~7.0.0`
- `expo-file-system`: `^19.0.20` → `~18.0.0`
- `expo-font`: `~14.0.10` → `~13.0.0`
- `expo-haptics`: `^15.0.8` → `~14.0.0`
- `expo-linear-gradient`: `^15.0.8` → `~14.0.0`
- `expo-linking`: `~8.0.10` → `~7.0.0`
- `expo-router`: `^6.0.17` → `~5.0.0`
- `expo-status-bar`: `~3.0.9` → `~2.0.0`
- `expo-updates`: `~29.0.15` → `~28.0.0`
- `expo-clipboard`: `^8.0.8` → `~7.0.0`

**Dev Dependencies:**
- `jest-expo`: `~54.0.2` → `~53.0.0`
- `eslint-config-expo`: `^10.0.0` → `~9.0.0`

### Removed Workarounds

**iOS Podfile (`ios/Podfile`):**
- ✅ Removed all custom Folly coroutine preprocessor definitions:
  - `FOLLY_HAS_COROUTINES=0`
  - `FOLLY_CFG_NO_COROUTINES=1`
  - `FOLLY_NO_CONFIG=1`
  - `FOLLY_MOBILE=1`
  - `FOLLY_USE_LIBCPP=1`
- ✅ Removed custom stub header creation for `folly/coro/Coroutine.h`
- ✅ Restored clean `post_install` hook matching Expo SDK 53 defaults

**Note:** The custom stub header file at `ios/Pods/Headers/Public/ReactNativeDependencies/folly/coro/Coroutine.h` will be automatically removed when you run `pod install` with the cleaned Podfile.

### Configuration Files

**`app.config.ts`:**
- No changes required (SDK version is inferred from `expo` package version)

**`babel.config.js`:**
- ✅ Already correctly configured with `react-native-reanimated/plugin` at the end of plugins array

**`metro.config.js`:**
- ✅ Already correctly configured with Expo default config

## Manual Steps Required

After pulling these changes, run the following commands in order:

### 1. Clean Install Dependencies

```bash
cd praxis-app
rm -rf node_modules package-lock.json
npm install
```

### 2. Clean Native Directories

```bash
rm -rf ios android
```

### 3. Regenerate Native Projects

```bash
npx expo prebuild --clean
```

This will regenerate the `ios/` and `android/` directories with Expo SDK 53 defaults.

### 4. Install iOS Pods

```bash
cd ios
pod install
cd ..
```

### 5. Rebuild iOS App

```bash
npx expo run:ios
```

## Verification

After the upgrade, verify:

1. ✅ App builds successfully for iOS
2. ✅ No Folly coroutine errors in build logs
3. ✅ React Native Reanimated animations work correctly
4. ✅ All Expo modules load without errors
5. ✅ No custom Folly headers exist in `ios/Pods/Headers/Public/ReactNativeDependencies/folly/coro/`

## Breaking Changes & Compatibility

- **React Native 0.79.6**: Some APIs may have changed from 0.81.5. Review React Native 0.79 release notes if you encounter issues.
- **Expo Router 5.x**: Check Expo Router 5.x migration guide if you use advanced routing features.
- **Reanimated 3.17.4**: Should be backward compatible, but verify any custom animation code.

## Troubleshooting

If you encounter build errors:

1. **Clean everything:**
   ```bash
   rm -rf ios android node_modules package-lock.json
   npm install
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

2. **Check for version mismatches:**
   ```bash
   npx expo-doctor
   ```

3. **Verify Podfile is clean:**
   - Ensure no custom Folly preprocessor definitions remain
   - Ensure no custom header creation code exists

## Files Modified

- `praxis-app/package.json` - Updated all dependencies to SDK 53 versions
- `praxis-app/ios/Podfile` - Removed all Folly workarounds, restored Expo SDK 53 defaults

## Files Unchanged (but verified)

- `praxis-app/app.config.ts` - No changes needed
- `praxis-app/babel.config.js` - Already correct for SDK 53
- `praxis-app/metro.config.js` - Already correct for SDK 53
