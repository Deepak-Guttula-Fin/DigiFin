# Finance Orbit Android Studio Wrapper

This Android Studio project opens the existing Finance Orbit web app in a WebView.

## Run it

1. Start the local web server from the repository root:
   - `node server.js`
2. Open `android/FinanceOrbit` in Android Studio.
3. Wait for Gradle sync.
4. Run the app on an emulator.

The app loads `http://10.0.2.2:4173/`, which points the emulator back to your computer.
