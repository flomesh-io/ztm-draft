import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteMockServe } from 'vite-plugin-mock';
import vitePluginRequire from "vite-plugin-require";
import electron from 'vite-plugin-electron';
import electronRender from 'vite-plugin-electron-renderer';
// https://vitejs.dev/config/
export default defineConfig(() => {
    return {
				server: {
					proxy: {
						'/client': {
							target: 'http://127.0.0.1:6060/',
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/client/, ''),
						},
						'/server': {
							target: 'http://127.0.0.1:8001/',
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/server/, ''),
						},
					}
				},
        plugins: [vue({
					reactivityTransform: true
					}),
					vitePluginRequire(),
					viteMockServe({
						enable: true,
						supportTs: false,
						logger: false,
						mockPath: "./mock/"
					}),
					electron({
						main: {
							entry: './electron/index.js'
						}
					}),
					electronRender()
				],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
    };
});
