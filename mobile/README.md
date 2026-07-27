# Sunny Bakery — React Native (Expo SDK 54)

Mobile client for phones and tablets (Expo Go compatible). Uses the same backend as the web app.

## Features

- Product catalog with adaptive grid (2 / 3 / 4 columns by width)
- Cart, auth, order placement (orders appear in web `/admin/orders`)
- EN / RU localization
- Activity metrics logging (`platform=MOBILE`) to the shared MySQL metrics tables
- **No admin UI** — admin stays on the web client only

## Setup

```powershell
cd c:\bakery_shop\mobile
npm install
```

Point the API to your machine (physical device needs your LAN IP).
Expo Go usually auto-detects the PC IP from the Metro QR connection.
If products still fail with "Network request failed", set it explicitly:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.37:4000"
npm start
```

Replace `192.168.1.37` with your PC IPv4 (`ipconfig`).

Defaults (only for emulators/simulators):

- iOS simulator: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`

Your PC LAN IP example from this machine: `192.168.1.37`

Backend must be running and reachable on the LAN:

```powershell
cd c:\bakery_shop\server
npm start
```

Server binds to `0.0.0.0:4000`. Restart the backend after pull so the bind change applies. If the phone still cannot connect, allow inbound TCP 4000 in Windows Firewall.
