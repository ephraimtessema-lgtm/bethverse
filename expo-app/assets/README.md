Place Expo asset files here before building for stores:

- `icon.png` (1024×1024)
- `splash-icon.png`
- `adaptive-icon.png` (Android)

For local development, Expo Go often works without custom icons. If `expo start` complains about missing assets, run from the repo root:

```bash
npx expo-asset-generator expo-app/assets --icon-color "#9B6FE8"
```

Or copy default assets from a fresh `create-expo-app` project.
