# Developing on Android via USB

Before running the app on a physical device, the developer MUST execute:
`adb reverse tcp:3000 tcp:3000`

This command maps the physical device's port 3000 to your laptop's port 3000, allowing the app to successfully communicate with the locally running backend via `http://localhost:3000`.

**Note:** This command must be re-run after reconnecting the device.
