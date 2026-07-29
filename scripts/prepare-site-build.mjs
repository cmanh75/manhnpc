import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve('frontend/dist')
const destination = resolve('dist')

if (!existsSync(source)) {
  throw new Error(`Frontend build output not found: ${source}`)
}

rmSync(destination, { recursive: true, force: true })
mkdirSync(destination, { recursive: true })
cpSync(source, destination, { recursive: true })

console.log(`Prepared static site in ${destination}`)
