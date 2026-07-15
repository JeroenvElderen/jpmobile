# Welcome to your Expo app 👋

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