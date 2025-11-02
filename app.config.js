// Expo app configuration. Central place for public runtime config.
export default {
  expo: {
    name: "MasalMatik",
    slug: "masalmatik",
    extra: {
      // Default to Render URL; can be overridden by EXPO_PUBLIC_API_URL env
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://masalmatik.onrender.com",
    },
  },
};

