import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteMockServe } from 'vite-plugin-mock';

import { internalIpV4 } from "internal-ip";
const mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM);

// import vitePluginRequire from "vite-plugin-require";
// import electron from 'vite-plugin-electron';
// import electronRender from 'vite-plugin-electron-renderer';
// https://vitejs.dev/config/
//target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
export default defineConfig(async (config) => ({
			clearScreen: false,
			server: {
				port: 1420,
				strictPort: true,
				host: mobile ? "0.0.0.0" : false,
				hmr: mobile
				  ? {
				      protocol: "ws",
				      host: await internalIpV4(),
				      port: 1421,
				    }
				  : undefined,
				watch: {
				  // 3. tell vite to ignore watching `src-tauri`
				  ignored: ["**/src-tauri/**"],
				},
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
				// vitePluginRequire(),
				viteMockServe({
					enable: true,
					localEnabled: config.command === 'serve',
					prodEnabled: config.command !== 'serve',
					injectCode: `
						import { setupProdMockServer } from './mockProdServer';
						setupProdMockServer();
					`,
					supportTs: false,
					logger: false,
					mockPath: "./mock/"
				}),
				// electron({
				// 	main: {
				// 		entry: './electron/index.js'
				// 	}
				// }),
				// electronRender()
			],
			resolve: {
					alias: {
							'@': fileURLToPath(new URL('./src', import.meta.url))
					}
			}
}));