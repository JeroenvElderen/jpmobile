# First private release and future updates

This app is configured for two private distribution paths:

- **Android:** an installable APK from an EAS internal-distribution link. Google Play is not involved.
- **iOS:** a store-signed build delivered only through Apple TestFlight.

It also uses EAS Update. Compatible JavaScript, styling, and bundled-asset changes are downloaded by the installed app from the `production` channel when it starts. The app waits up to three seconds for a new update and otherwise starts from its cached copy, so a bad connection does not prevent launch.

> EAS Update cannot replace native code. Adding/upgrading a native dependency, changing native configuration, permissions, icons, or the Expo SDK requires a new APK and TestFlight build. Apple does not permit this app to download and install an iOS binary itself; TestFlight handles iOS binary updates.

## 1. One-time accounts and tooling

You need access to the `jeroen-and-paws` Expo account and its existing EAS project, plus an Apple Developer/App Store Connect account for the iOS bundle ID `com.jer0m3.jeroenandpawsmobile`.

```sh
npm install
npx eas-cli@latest login
npx eas-cli@latest project:info
```

The final command should show project ID `e487e7cb-0301-445f-a211-4972dd5274a3`. Do not run `eas init` against a different project.

Configure the public runtime variables for both build profiles (the Supabase anon key is designed to be public; never put a service-role key in the app):

```sh
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://jeroenandpaws.com
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT.supabase.co
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_PUBLIC_ANON_KEY
```

If a variable already exists, update it in the Expo dashboard instead of creating a duplicate.

## 2. Make the first Android APK

```sh
npx eas-cli@latest build --platform android --profile android-apk
```

When EAS finishes, open the build page, copy its install URL, and send that URL only to intended users. On their Android device they open the link, download the APK, allow installation from that browser when Android asks, and install it. Keep the signing credentials managed by EAS: every later APK must use the same Android keystore or Android will reject it as an update.

This link is private distribution, not strong access control. Remove access to an obsolete build in the Expo dashboard if the link should no longer be used.

## 3. Make the first iOS TestFlight build

First create the app record in App Store Connect with bundle ID `com.jer0m3.jeroenandpawsmobile`, then run:

```sh
npx eas-cli@latest build --platform ios --profile ios-testflight
npx eas-cli@latest submit --platform ios --profile ios-testflight --latest
```

Follow EAS prompts for Apple credentials. In App Store Connect, wait for processing, complete any export-compliance questions, create an internal or external TestFlight group, and add testers. External testers may require Apple beta review. Testers install Apple's TestFlight app, accept the invitation, and install Jeroen & Paws there.

## 4. Publish an update that downloads inside the app

Use this only when the change does **not** alter native code or configuration:

```sh
npm test
npm run typecheck
npx eas-cli@latest update --channel production --environment production --message "Describe the change"
```

The next time a production build starts with internet access, it checks the `production` channel and downloads a compatible update. If the download does not finish during the three-second startup window, the cached version opens and the newly downloaded update is used on a later restart.

The runtime version follows the public app version (`1.0.0` in `app.json`). Do not change that version for an over-the-air update. Change it when publishing a new native binary so an update built for new native code cannot be loaded by an older binary.

## 5. Publish a change that needs a new binary

Increment `expo.version` in `app.json`, test, then build both platforms:

```sh
npx eas-cli@latest build --platform android --profile android-apk
npx eas-cli@latest build --platform ios --profile ios-testflight
npx eas-cli@latest submit --platform ios --profile ios-testflight --latest
```

- Send Android users the new EAS APK URL. Opening the APK installs it over the existing app while preserving data, provided the package ID and signing key remain unchanged.
- Enable the processed iOS build for the TestFlight group. TestFlight notifies testers and installs it according to their TestFlight update settings.

After those binaries are installed, future compatible `eas update --channel production` publications again download from inside the app.

## Recovery

If an over-the-air release is faulty, use the EAS dashboard to republish a known-good update to `production`, or publish a corrective commit immediately. Never delete the only known-good update while affected clients may still need it.

Before every release, verify the APK on a physical Android device and the processed build on a physical iPhone through TestFlight.
