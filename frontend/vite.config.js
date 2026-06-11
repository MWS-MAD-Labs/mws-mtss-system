import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// MTSS is served under the /mtss/ path by the "one app" gateway.
// Every asset, SPA route, and PWA scope must be prefixed with this base.
// Override with VITE_BASE_PATH (e.g. '/' for standalone dev).
const BASE_PATH = process.env.VITE_BASE_PATH || '/mtss/'

export default defineConfig({
    base: BASE_PATH,
    plugins: [
        react(),
        VitePWA({
            strategies: 'generateSW',
            registerType: 'autoUpdate',
            filename: 'mws-sw.js',
            includeAssets: ['vite.svg', 'Millennia.webp'],
            manifest: {
                name: 'MWS IntegraLearn - Premium Education Platform',
                short_name: 'MWS IntegraLearn',
                description: 'Your gateway to world-class integrated education. Join Millennia World School\'s premium learning experience.',
                theme_color: '#1e40af',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: BASE_PATH,
                start_url: BASE_PATH,
                icons: [
                    {
                        src: 'Millennia.webp',
                        sizes: '192x192',
                        type: 'image/webp',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'Millennia.webp',
                        sizes: '512x512',
                        type: 'image/webp',
                        purpose: 'any maskable'
                    }
                ],
                categories: ['education', 'productivity'],
                lang: 'id-ID'
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
                // Keep very heavy AI/vision chunks out of install-time precache.
                // They should download only when users enter face-scan / AI flows.
                globIgnores: [
                    '**/assets/vendor-tfjs-*.js',
                    '**/assets/vendor-mediapipe-*.js'
                ],
                runtimeCaching: [
                    {
                        urlPattern: ({ request, url }) =>
                            request.destination === 'script' &&
                            /\/assets\/vendor-(tfjs|mediapipe)-.*\.js$/.test(url.pathname),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'ai-vision-vendors',
                            expiration: {
                                maxEntries: 8,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/unpkg\.com\/leaflet@1\.9\.4\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'leaflet-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/mtss/api/'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            networkTimeoutSeconds: 10
                        }
                    }
                ],
                navigateFallback: '/mtss/index.html',
                navigateFallbackDenylist: [/^\/mtss\/api\//, /^\/mtss\/auth\//, /^\/mtss\/socket\.io\//],
                // Disable auto service worker registration since we handle it manually
                skipWaiting: true,
                clientsClaim: true
            },
            devOptions: {
                enabled: false,
                type: 'module'
            }
        })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return null

                    if (
                        id.includes('/react/') ||
                        id.includes('react-dom') ||
                        id.includes('scheduler') ||
                        id.includes('use-sync-external-store')
                    ) {
                        return 'vendor-react'
                    }

                    if (
                        id.includes('@reduxjs') ||
                        id.includes('redux') ||
                        id.includes('immer') ||
                        id.includes('reselect')
                    ) {
                        return 'vendor-state'
                    }

                    if (id.includes('framer-motion')) {
                        return 'vendor-motion'
                    }

                    if (id.includes('lucide-react')) {
                        return 'vendor-icons'
                    }

                    if (id.includes('@radix-ui')) {
                        return 'vendor-radix'
                    }

                    if (
                        id.includes('class-variance-authority') ||
                        id.includes('tailwind-merge') ||
                        id.includes('/clsx/')
                    ) {
                        return 'vendor-ui-utils'
                    }

                    if (
                        id.includes('@tensorflow/') ||
                        id.includes('tfjs')
                    ) {
                        return 'vendor-tfjs'
                    }

                    if (
                        id.includes('@mediapipe/')
                    ) {
                        return 'vendor-mediapipe'
                    }

                    if (
                        id.includes('recharts') ||
                        id.includes('victory') ||
                        id.includes('/d3-')
                    ) {
                        return 'vendor-charts'
                    }

                    if (
                        id.includes('react-markdown') ||
                        id.includes('/remark') ||
                        id.includes('/rehype') ||
                        id.includes('/unified') ||
                        id.includes('/micromark') ||
                        id.includes('/mdast') ||
                        id.includes('/hast')
                    ) {
                        return 'vendor-markdown'
                    }

                    if (
                        id.includes('face_mesh')
                    ) {
                        return 'vendor-vision'
                    }

                    if (
                        id.includes('axios') ||
                        id.includes('socket.io-client')
                    ) {
                        return 'vendor-network'
                    }

                    return undefined
                }
            }
        }
    },
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://localhost:3004',
                changeOrigin: true,
                secure: false
            },
            '/auth': {
                target: 'http://localhost:3004',
                changeOrigin: true,
                secure: false
            },
            '/socket.io': {
                target: 'http://localhost:3004',
                changeOrigin: true,
                secure: false,
                ws: true
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
