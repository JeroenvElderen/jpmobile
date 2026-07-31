# Welcome to your Expo app 👋

## Authentication configuration

Set these public build-time variables in local `.env` and in EAS (never use a Supabase service-role key):

```sh
EXPO_PUBLIC_API_BASE_URL=https://jeroenandpaws.com
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Add these Authentication redirect URLs to the Supabase project's allow-list:

- Production/dev build: `jeroenandpaws://auth/confirm`
- Expo Go development: the exact URL printed by `Linking.createURL('auth/confirm')` for the active Expo host (for example `exp://192.168.1.10:8081/--/auth/confirm`). Because the host changes, prefer a development build with the stable custom scheme for backend testing.

Invite links can use either `jeroenandpaws://register?invite=CODE` or the install-aware HTTPS form `https://jeroenandpaws.com/register?invite=CODE` (the `www` host is supported too). The app opens registration and pre-fills—but never submits—the invite. Rebuild native apps after changing linking configuration.

For HTTPS invite links to open an installed app, the website must serve valid platform association files:

- `https://jeroenandpaws.com/.well-known/apple-app-site-association` (and the `www` host) with app ID `TEAM_ID.com.jer0m3.jeroenandpawsmobile` and `/register*` allowed.
- `https://jeroenandpaws.com/.well-known/assetlinks.json` (and the `www` host) with Android package `com.jer0m3.jeroenandpawsmobile`, relation `delegate_permission/common.handle_all_urls`, and the production signing-certificate SHA-256 fingerprint.

These files must return HTTPS `200` responses without redirects and with JSON content types. If the app is not installed, the same HTTPS invite URL continues to the website. Email and SMS delivery require the website backend, Supabase redirect allow-list, and provider configuration and cannot be verified by local unit tests.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

### Building and running Android locally

`npx expo run:android` is a local native build, so it needs Android Studio's SDK, platform tools, and either a running emulator or a connected device. Before starting the build, verify that ADB can see a target:

```bash
adb devices
npx expo run:android --device
```

If the command appears to stop before Gradle begins, start an Android Virtual Device in Android Studio first (or enable USB debugging on a physical device), then retry. Ensure `ANDROID_HOME` points to the Android SDK and that `$ANDROID_HOME/platform-tools` is on `PATH`. To separate native-project generation from device selection, run `npx expo prebuild --platform android --no-install`; generated `android/` files are local build artifacts and are ignored by Git.

This project targets Expo SDK 57. Use the [versioned Expo 57 documentation](https://docs.expo.dev/versions/v57.0.0/) rather than unversioned setup instructions.

Push registration also requires the checked-in Supabase migration and Edge Function to be deployed:

```bash
supabase db push
supabase functions deploy push-notifications
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```
jeroenandpaws-mobile
├─ .claude
│  └─ settings.json
├─ .env
├─ AGENTS.md
├─ app.json
├─ assets
│  ├─ expo.icon
│  │  ├─ Assets
│  │  │  ├─ expo-symbol 2.svg
│  │  │  └─ grid.png
│  │  └─ icon.json
│  └─ images
│     ├─ expo-badge-white.png
│     ├─ expo-badge.png
│     ├─ expo-logo.png
│     ├─ favicon.png
│     ├─ icon.png
│     ├─ logo-glow.png
│     ├─ react-logo.png
│     ├─ react-logo@2x.png
│     ├─ react-logo@3x.png
│     ├─ splash-icon.png
│     ├─ tabIcons
│     │  ├─ explore.png
│     │  ├─ explore@2x.png
│     │  ├─ explore@3x.png
│     │  ├─ home.png
│     │  ├─ home@2x.png
│     │  └─ home@3x.png
│     └─ tutorial-web.png
├─ CLAUDE.md
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  └─ reset-project.js
├─ src
│  ├─ app
│  │  ├─ (auth)
│  │  ├─ (tabs)
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ components
│  │  ├─ bookings
│  │  ├─ cards
│  │  ├─ dashboard
│  │  ├─ forms
│  │  ├─ navigation
│  │  ├─ profile
│  │  └─ ui
│  │     ├─ Button.tsx
│  │     ├─ Card.ts
│  │     ├─ Divider.tsx
│  │     ├─ index.ts
│  │     ├─ Input.tsx
│  │     ├─ Loading.tsx
│  │     ├─ Logo.tsx
│  │     ├─ Screen.tsx
│  │     └─ Typography.tsx
│  ├─ contexts
│  │  └─ AuthContext.ts
│  ├─ hooks
│  │  └─ useAuth.ts
│  ├─ lib
│  │  ├─ constants.ts
│  │  ├─ supabase.ts
│  │  └─ theme.ts
│  ├─ providers
│  │  ├─ AuthProvider.tsx
│  │  ├─ QueryProvider.tsx
│  │  └─ ThemeProvider.tsx
│  ├─ services
│  ├─ store
│  ├─ types
│  └─ utils
└─ tsconfig.json

```
```
jeroenandpaws-mobile
├─ .claude
│  └─ settings.json
├─ AGENTS.md
├─ app.json
├─ assets
│  ├─ expo.icon
│  │  ├─ Assets
│  │  │  ├─ expo-symbol 2.svg
│  │  │  └─ grid.png
│  │  └─ icon.json
│  └─ images
│     ├─ expo-badge-white.png
│     ├─ expo-badge.png
│     ├─ expo-logo.png
│     ├─ favicon.png
│     ├─ icon.png
│     ├─ logo-glow.png
│     ├─ react-logo.png
│     ├─ react-logo@2x.png
│     ├─ react-logo@3x.png
│     ├─ splash-icon.png
│     ├─ tabIcons
│     │  ├─ explore.png
│     │  ├─ explore@2x.png
│     │  ├─ explore@3x.png
│     │  ├─ home.png
│     │  ├─ home@2x.png
│     │  └─ home@3x.png
│     └─ tutorial-web.png
├─ CLAUDE.md
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  └─ reset-project.js
├─ src
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ login.tsx
│  │  │  └─ register.tsx
│  │  ├─ (tabs)
│  │  ├─ admin.tsx
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ components
│  │  ├─ bookings
│  │  ├─ cards
│  │  ├─ dashboard
│  │  ├─ forms
│  │  ├─ navigation
│  │  ├─ profile
│  │  └─ ui
│  │     ├─ Button.tsx
│  │     ├─ Card.tsx
│  │     ├─ Divider.tsx
│  │     ├─ index.ts
│  │     ├─ Input.tsx
│  │     ├─ Loading.tsx
│  │     ├─ Screen.tsx
│  │     └─ Typography.tsx
│  ├─ contexts
│  │  └─ AuthContext.ts
│  ├─ hooks
│  │  └─ useAuth.ts
│  ├─ lib
│  │  ├─ constants.ts
│  │  ├─ supabase.ts
│  │  └─ theme.ts
│  ├─ providers
│  │  ├─ AuthProvider.tsx
│  │  ├─ QueryProvider.tsx
│  │  └─ ThemeProvider.tsx
│  ├─ services
│  ├─ store
│  ├─ types
│  └─ utils
└─ tsconfig.json

```
```
jeroenandpaws-mobile
├─ .claude
│  └─ settings.json
├─ AGENTS.md
├─ app.json
├─ assets
│  ├─ expo.icon
│  │  ├─ Assets
│  │  │  ├─ expo-symbol 2.svg
│  │  │  └─ grid.png
│  │  └─ icon.json
│  └─ images
│     ├─ expo-badge-white.png
│     ├─ expo-badge.png
│     ├─ expo-logo.png
│     ├─ favicon.png
│     ├─ icon.png
│     ├─ logo-glow.png
│     ├─ logo4.svg
│     ├─ react-logo.png
│     ├─ react-logo@2x.png
│     ├─ react-logo@3x.png
│     ├─ splash-icon.png
│     ├─ tabIcons
│     │  ├─ explore.png
│     │  ├─ explore@2x.png
│     │  ├─ explore@3x.png
│     │  ├─ home.png
│     │  ├─ home@2x.png
│     │  └─ home@3x.png
│     └─ tutorial-web.png
├─ CLAUDE.md
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  └─ reset-project.js
├─ src
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ login.tsx
│  │  │  └─ register.tsx
│  │  ├─ (tabs)
│  │  ├─ admin
│  │  │  ├─ bookings.tsx
│  │  │  ├─ clients.tsx
│  │  │  ├─ dogs.tsx
│  │  │  └─ galleries.tsx
│  │  ├─ admin.tsx
│  │  ├─ client
│  │  │  ├─ bookings.tsx
│  │  │  ├─ dogs.tsx
│  │  │  ├─ galleries.tsx
│  │  │  └─ profile.tsx
│  │  ├─ client.tsx
│  │  ├─ complete-account.tsx
│  │  ├─ index.tsx
│  │  └─ _layout.tsx
│  ├─ components
│  │  ├─ bookings
│  │  │  ├─ AdminBookingListScreen.tsx
│  │  │  ├─ BookingCalendar.tsx
│  │  │  ├─ BookingFilters.tsx
│  │  │  ├─ BookingList.tsx
│  │  │  ├─ BookingPagination.tsx
│  │  │  ├─ BookingsHeader.tsx
│  │  │  ├─ BookingsScreen.tsx
│  │  │  └─ BookingStatsGrid.tsx
│  │  ├─ BrandLogo.tsx
│  │  ├─ cards
│  │  ├─ client-bookings
│  │  │  ├─ BookingFilters.tsx
│  │  │  ├─ BookingList.tsx
│  │  │  ├─ BookingPagination.tsx
│  │  │  ├─ BookingsHeader.tsx
│  │  │  ├─ BookingStatsGrid.tsx
│  │  │  ├─ ClientBookingListScreen.tsx
│  │  │  └─ ClientBookingsScreen.tsx
│  │  ├─ client-dashboard
│  │  │  ├─ ClientDashboardHeader.tsx
│  │  │  ├─ ClientDashboardScreen.tsx
│  │  │  ├─ ClientFloatingTabBar.tsx
│  │  │  ├─ ClientRecentActivityList.tsx
│  │  │  ├─ ClientSectionCard.tsx
│  │  │  ├─ MyPetsList.tsx
│  │  │  └─ UpcomingBookingsList.tsx
│  │  ├─ client-dogs
│  │  │  ├─ ClientDogList.tsx
│  │  │  ├─ ClientDogsHeader.tsx
│  │  │  └─ ClientDogsScreen.tsx
│  │  ├─ client-galleries
│  │  │  ├─ GalleriesHeader.tsx
│  │  │  ├─ GalleriesScreen.tsx
│  │  │  ├─ GalleryFilters.tsx
│  │  │  ├─ GalleryList.tsx
│  │  │  └─ GalleryStatsGrid.tsx
│  │  ├─ client-profile
│  │  │  └─ ClientProfileScreen.tsx
│  │  ├─ clients
│  │  │  ├─ ClientFilters.tsx
│  │  │  ├─ ClientList.tsx
│  │  │  ├─ ClientsHeader.tsx
│  │  │  ├─ ClientsScreen.tsx
│  │  │  └─ ClientStatsGrid.tsx
│  │  ├─ dashboard
│  │  │  ├─ ActivityItem.tsx
│  │  │  ├─ ChartCard.tsx
│  │  │  ├─ DashBoardHeader.tsx
│  │  │  ├─ DashboardStats.tsx
│  │  │  ├─ FloatingTabBar.tsx
│  │  │  ├─ LineChart.tsx
│  │  │  ├─ PerformanceCard.tsx
│  │  │  ├─ QuickAction.tsx
│  │  │  ├─ QuickActionForms.tsx
│  │  │  ├─ QuickActions.tsx
│  │  │  ├─ RecentActivity.tsx
│  │  │  ├─ ScheduleCard.tsx
│  │  │  ├─ ScheduleItem.tsx
│  │  │  └─ StatCard.tsx
│  │  ├─ dogs
│  │  │  ├─ DogFilters.tsx
│  │  │  ├─ DogList.tsx
│  │  │  ├─ DogsHeader.tsx
│  │  │  ├─ DogsScreen.tsx
│  │  │  └─ DogStatsGrid.tsx
│  │  ├─ forms
│  │  ├─ galleries
│  │  │  ├─ GalleriesHeader.tsx
│  │  │  ├─ GalleriesScreen.tsx
│  │  │  ├─ GalleryCreateModal.tsx
│  │  │  ├─ GalleryFilters.tsx
│  │  │  ├─ GalleryList.tsx
│  │  │  └─ GalleryStatsGrid.tsx
│  │  ├─ navigation
│  │  ├─ profile
│  │  └─ ui
│  │     ├─ Button.tsx
│  │     ├─ Card.tsx
│  │     ├─ Divider.tsx
│  │     ├─ index.ts
│  │     ├─ Input.tsx
│  │     ├─ Loading.tsx
│  │     ├─ Screen.tsx
│  │     └─ Typography.tsx
│  ├─ contexts
│  │  └─ AuthContext.ts
│  ├─ hooks
│  │  └─ useAuth.ts
│  ├─ lib
│  │  ├─ accountSetup.ts
│  │  ├─ adminDashboardData.ts
│  │  ├─ bookingData.ts
│  │  ├─ clientDashboardData.ts
│  │  ├─ clientProfileData.ts
│  │  ├─ clientsData.ts
│  │  ├─ constants.ts
│  │  ├─ dashboardData.ts
│  │  ├─ dogsData.ts
│  │  ├─ galleriesData.ts
│  │  ├─ notifications.ts
│  │  ├─ supabase.ts
│  │  └─ theme.ts
│  ├─ providers
│  │  ├─ AuthProvider.tsx
│  │  ├─ PushNotificationsProvider.tsx
│  │  ├─ QueryProvider.tsx
│  │  └─ ThemeProvider.tsx
│  ├─ services
│  ├─ store
│  ├─ types
│  │  ├─ expo-document-picker.d.ts
│  │  ├─ expo-image-manipulator.d.ts
│  │  └─ expo-image-picker.d.ts
│  └─ utils
├─ supabase
│  ├─ .temp
│  │  ├─ gotrue-version
│  │  ├─ linked-project.json
│  │  ├─ pooler-url
│  │  ├─ postgres-version
│  │  ├─ project-ref
│  │  ├─ rest-version
│  │  ├─ storage-migration
│  │  └─ storage-version
│  └─ functions
│     ├─ admin-dashboard
│     │  └─ index.ts
│     ├─ dogs-avatar-upload
│     │  └─ index.ts
│     └─ gallery-upload
│        └─ index.ts
├─ Supabase tables.md
└─ tsconfig.json

```
