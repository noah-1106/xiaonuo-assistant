import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // 将/api请求代理到后端服务器
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    }
});
