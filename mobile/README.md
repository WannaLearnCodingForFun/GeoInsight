## Landroid (Hackathon Prototype)

This is a **mobile-first prototype** aligned to the `Landroid_Hackathon_SRS.pdf` requirements.

### What’s implemented now

- **Two roles**: Land Consultant vs Landowner (demo sign-in)
- **Access control**: unauthenticated users are redirected to auth; role-specific UI text/actions
- **Parcel list + detail**
- **2 AI modules (with confidence scores)**
  - **Land Health Dashboard** (composite score 0–100)
  - **Plant Health Zone Map** (NDVI zone classification + percentages)

### Run (Web)

```bash
cd mobile
CI=1 npm run web -- --port 8082
```

Then open `http://localhost:8082` in a browser.

### Run (Android)

You’ll need Android Studio + emulator (or a real device):

```bash
cd mobile
npm run android
```

### Where to plug real data (Birdscale + Open APIs)

- **NDVI/Orthomosaic/DEM/Boundary files**: replace demo values in `src/data/demo-parcels.ts`
- **Land Health inputs**:
  - NDVI historical + current (Planetary Computer Sentinel-2 + Birdscale NDVI raster)
  - Rainfall (CHIRPS), temperature (ERA5), soil (ISRIC SoilGrids)
- **GIS viewer**: add MapLibre + layer toggles and render the zone map as an overlay

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

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
