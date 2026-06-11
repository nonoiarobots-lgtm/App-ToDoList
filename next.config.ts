import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts', // source du Service Worker
  swDest: 'public/sw.js', // fichier généré au build
  disable: process.env.NODE_ENV === 'development', // pas de SW en dev
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
