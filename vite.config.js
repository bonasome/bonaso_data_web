import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
        '/api': 'http://localhost:8000',
        },
    },
    
    test: {
        globals: true, 
        environment: 'jsdom',
        setupFiles: './vitest.setup.js',
        coverage: {
            provider: 'v8', // or 'istanbul' if you prefer
            reporter: ['text', 'lcov', 'html'], // optional, you can customize
            all: true, // include files even if they weren't tested
            reportsDirectory: './coverage',
        },
    },
    resolve: {
        lias: {
            react: path.resolve('./node_modules/react'),
            'react-dom': path.resolve('./node_modules/react-dom'),
            globals: true,
        },
    },
});
