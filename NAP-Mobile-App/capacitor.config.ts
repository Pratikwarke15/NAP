import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nap.pay',
  appName: 'NAP Pay',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
