// Samples the world land topojson into an even lat/lng grid of dots.
// Output: public/land-dots.json — flat array [lat0, lng0, lat1, lng1, ...]
// rounded to 2 decimals to keep the payload small.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoContains } from 'd3-geo'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const topo = JSON.parse(readFileSync(join(root, 'public', 'land-110m.json'), 'utf8'))
const land = feature(topo, topo.objects.land)

const STEP = 1.1
const dots = []
for (let lat = -60; lat <= 82; lat += STEP) {
  // shrink the lng step near the poles so dot density stays visually even
  const lngStep = STEP / Math.max(0.18, Math.cos((lat * Math.PI) / 180))
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (geoContains(land, [lng, lat])) {
      dots.push(Math.round(lat * 100) / 100, Math.round(lng * 100) / 100)
    }
  }
}

writeFileSync(join(root, 'public', 'land-dots.json'), JSON.stringify(dots))
console.log(`generated ${dots.length / 2} land dots`)
