import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],optimizeDeps:{include:['react-dom/client','lucide-react','pdfjs-dist','tesseract.js']},server:{host:'127.0.0.1',port:4174,strictPort:true}});
