export default {
  "expo": {
    "name": "AarogyaMitra",
    "slug": "AarogyaMitra",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./frontend-mobile/assets/images/icon.png",
    "scheme": "aarogyamitra",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Allow AarogyaMitra to show your live location, nearby hospitals, and pharmacy routes.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Allow AarogyaMitra to keep updating your route while navigating to a hospital or pharmacy."
      },
      "config": {
        "googleMapsApiKey": process.env.EXPO_PUBLIC_MAPS_API_KEY || "fallback_key"
      }
    },
    "android": {
      "package": "com.aarogyamitra.app",
      "versionCode": 1,
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_MAPS_API_KEY || "fallback_key"
        }
      },
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./frontend-mobile/assets/images/android-icon-foreground.png",
        "backgroundImage": "./frontend-mobile/assets/images/android-icon-background.png",
        "monochromeImage": "./frontend-mobile/assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./frontend-mobile/assets/images/favicon.png"
    },
    "extra": {
      "router": {
        "root": "frontend-mobile/app"
      },
      "eas": {
        "projectId": "bebd912f-adba-4d5a-9a22-cea17356df3e"
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./frontend-mobile/assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "owner": "lohit801"
  }
};
