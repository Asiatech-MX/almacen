import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  plugins: {
    tailwindcss: {
      configPath: join(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
}