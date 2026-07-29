import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve('frontend/dist')
const destination = resolve('dist')

if (!existsSync(source)) {
  throw new Error(`Frontend build output not found: ${source}`)
}

rmSync(destination, { recursive: true, force: true })
mkdirSync(destination, { recursive: true })
cpSync(source, destination, { recursive: true })
mkdirSync(resolve(destination, 'server'), { recursive: true })
mkdirSync(resolve(destination, '.openai'), { recursive: true })
cpSync(resolve('.openai/hosting.json'), resolve(destination, '.openai/hosting.json'))

writeFileSync(
  resolve(destination, 'server/index.js'),
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404 || request.method !== 'GET') return response

    const fallbackUrl = new URL('/index.html', request.url)
    return env.ASSETS.fetch(new Request(fallbackUrl, request))
  },
}
`,
)

console.log(`Prepared Sites bundle in ${destination}`)
