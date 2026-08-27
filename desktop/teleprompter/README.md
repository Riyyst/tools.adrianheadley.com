# Teleprompter Desktop

Windows desktop version of the teleprompter on tools.adrianheadley.com.

## Desktop features

- Transparent always-on-top teleprompter.
- Click-through mode so the application underneath can be controlled while the teleprompter remains visible.
- Global shortcut `Ctrl + Shift + T` to toggle click-through mode.
- `Control screen` automatically places the teleprompter at the top of the display and resizes the selected application into the remaining space.
- Previous and Next controls for presentation navigation.
- Camera picture-in-picture over a shared application.
- Local recording of the shared screen/window, microphone, and optional camera box. The teleprompter text is not included in the recording.

## Development

1. Install Node.js 22 or later.
2. Run `npm install`.
3. Run `npm start`.

## Build

Run `npm run dist` on Windows.

The GitHub Actions workflow builds `Teleprompter-Setup.exe` and publishes it to the `teleprompter-desktop` release when the desktop source changes on `main`.
