import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bkimg-proxy': {
        target: 'https://bkimg.cdn.bcebos.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/bkimg-proxy/, ''),
        headers: {
          Referer: 'https://baike.baidu.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      },
    },
  },
})
