// Tierra Media: a hand-drawn map in sepia ink on parchment, for LIGHT windows. Nine small silhouettes walk in file
// from Rivendel down Acebeda, try the pass of Caradhras, turn back, cross Moria in the dark, rest their eyes on
// Lothlórien and follow the Anduin to Amon Hen; then the walk starts over.
// Pure string building, the same every time: no imports, so a script outside the engine can build and look at it.
const WIDTH = 1600
const HEIGHT = 1000
const INK = '#4a3521'
const PAPER = '#ecdcb4'
const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif'

type Point = readonly [number, number]

/** One decimal at most: the scene is counted in characters. */
function n(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** A seeded run of numbers from 0 to 1: the same map at every build. */
function seeded(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

type Peak = { x: number; y: number; size: number }

/** Peaks along a line, `rows` abreast, each a little off its place. */
function chain(points: readonly Point[], rows: number, size: number, random: () => number): Peak[] {
  const peaks: Peak[] = []

  for (let index = 0; index + 1 < points.length; index += 1) {
    const [ax, ay] = points[index] as Point
    const [bx, by] = points[index + 1] as Point
    const length = Math.hypot(bx - ax, by - ay)
    const steps = Math.max(1, Math.round(length / (size * 1.45)))

    for (let step = 0; step < steps; step += 1) {
      const along = step / steps

      for (let row = 0; row < rows; row += 1) {
        const across = (row - (rows - 1) / 2) * size * 1.5 + (random() - 0.5) * size * 0.9

        peaks.push({
          x: ax + (bx - ax) * along + (-(by - ay) / length) * across + (random() - 0.5) * size * 0.5,
          y: ay + (by - ay) * along + ((bx - ax) / length) * across + (random() - 0.5) * size * 0.5,
          size: size * (0.75 + random() * 0.55),
        })
      }
    }
  }

  return peaks
}

/** Peaks as the old maps draw them: an open tent with one shaded flank. The lower ones lie over the upper. */
function mountains(peaks: Peak[]): string {
  const outline: string[] = []
  const shade: string[] = []

  for (const { x, y, size } of [...peaks].sort((one, other) => one.y - other.y)) {
    outline.push(`<path d="M${n(x - size)} ${n(y)}L${n(x)} ${n(y - size * 1.5)}L${n(x + size)} ${n(y)}"/>`)
    shade.push(`M${n(x)} ${n(y - size * 1.5)}L${n(x + size * 0.3)} ${n(y - size * 0.6)}L${n(x + size * 0.12)} ${n(y)}`)
  }

  return (
    `<g fill="${PAPER}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round">${outline.join('')}</g>` +
    `<path d="${shade.join('')}" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.7"/>`
  )
}

/** A wood: small round trees on a loose grid inside an ellipse. */
function wood(cx: number, cy: number, rx: number, ry: number, gap: number, fill: string, random: () => number): string {
  const trees: string[] = []

  for (let y = cy - ry; y <= cy + ry; y += gap * 0.8) {
    for (let x = cx - rx; x <= cx + rx; x += gap) {
      const tx = x + (random() - 0.5) * gap * 0.9
      const ty = y + (random() - 0.5) * gap * 0.6
      const edge = ((tx - cx) / rx) ** 2 + ((ty - cy) / ry) ** 2

      if (edge < 0.82 + random() * 0.22) {
        trees.push(`M${n(tx)} ${n(ty)}v-3.5m-3.6 0a3.6 4 0 1 1 7.2 0z`)
      }
    }
  }

  return `<path d="${trees.join('')}" fill="${fill}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`
}

/** A place: a dot and its name beside it. */
function place(x: number, y: number, name: string, dx = 8, dy = 4, anchor = 'start'): string {
  return (
    `<circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>` +
    `<text class="tm-t" x="${x + dx}" y="${y + dy}" font-size="15" text-anchor="${anchor}">${name}</text>`
  )
}

/** A land's name: wide capitals, pale, turned where the land runs. */
function land(x: number, y: number, name: string, size = 26, turn = 0, opacity = 0.5): string {
  return (
    `<text class="tm-t" x="${x}" y="${y}" font-size="${size}" letter-spacing="${n(size * 0.3)}" text-anchor="middle" ` +
    `opacity="${opacity}"${turn === 0 ? '' : ` transform="rotate(${turn} ${x} ${y})"`}>${name}</text>`
  )
}

// The road of the Nine, in the map's own points.
const ROAD: readonly Point[] = [
  [1285, 190], // Rivendel
  [1290, 290],
  [1300, 380], // Acebeda
  [1318, 430],
  [1362, 446], // the pass of Caradhras
  [1320, 460], // and back down
  [1318, 500],
  [1340, 527], // the west door of Moria
  [1410, 532], // the east gate
  [1440, 556],
  [1470, 582], // Lothlórien
  [1500, 618], // the Anduin
  [1512, 690],
  [1528, 770],
  [1540, 850], // Amon Hen
]
const DOOR_IN = 7
const DOOR_OUT = 8
/** Map points a second. */
const PACE = 9
/** Seconds the last of them stands at Amon Hen before the walk starts over. */
const HOLD = 6
/** Seconds between one walker and the next. */
const GAP = 3.1

/** The walk as two sets of keyframes, where it is and how well it is seen, and the seconds one round takes. */
function walk(): { css: string; seconds: number } {
  const times = [0]

  for (let index = 1; index < ROAD.length; index += 1) {
    const [ax, ay] = ROAD[index - 1] as Point
    const [bx, by] = ROAD[index] as Point

    times.push((times[index - 1] ?? 0) + Math.hypot(bx - ax, by - ay) / PACE)
  }

  const end = times[times.length - 1] ?? 0
  const seconds = end + HOLD
  const at = (time: number): string => `${n((time / seconds) * 100)}%`
  const moves = ROAD.map(([x, y], index) => `${at(times[index] ?? 0)}{transform:translate(${x}px,${y}px)}`)
  const [lastX, lastY] = ROAD[ROAD.length - 1] as Point
  const doorIn = times[DOOR_IN] ?? 0
  const doorOut = times[DOOR_OUT] ?? 0
  // Unseen at the start, plain on the road, a shadow under the mountain, gone at the end.
  const seen = [
    '0%{opacity:0}',
    `${at(2)}{opacity:1}`,
    `${at(doorIn)}{opacity:1}`,
    `${at(doorIn + 1.5)}{opacity:.28}`,
    `${at(doorOut - 1.5)}{opacity:.28}`,
    `${at(doorOut)}{opacity:1}`,
    `${at(end + HOLD - 2)}{opacity:1}`,
    '100%{opacity:0}',
  ]

  return {
    css:
      `@keyframes tm-walk{${moves.join('')}100%{transform:translate(${lastX}px,${lastY}px)}}` +
      `@keyframes tm-seen{${seen.join('')}}`,
    seconds,
  }
}

/** A cloaked figure with its feet at 0,0: a head on a bell of cloth. */
function figure(height: number, width: number, fill: string, more = ''): string {
  const head = height * 0.15

  return (
    `<path d="M0 ${n(-height + head * 2)}C${n(width * 0.6)} ${n(-height * 0.55)} ${n(width * 0.6)} ${n(-height * 0.2)} ${n(width * 0.5)} 0` +
    `L${n(-width * 0.5)} 0C${n(-width * 0.6)} ${n(-height * 0.2)} ${n(-width * 0.6)} ${n(-height * 0.55)} 0 ${n(-height + head * 2)}Z" fill="${fill}"/>` +
    `<circle cx="0" cy="${n(-height + head)}" r="${n(head)}" fill="${fill}"/>${more}`
  )
}

const WOOD = '#4a3a28'
// The Nine in the order they walk. Told apart by height and by what each carries.
const NINE: readonly string[] = [
  // The wizard: grey, a pointed hat and a staff.
  figure(25, 11, '#6b6862', `<path d="M-7.5 -22.5L0 -35L7.5 -22.5Z" fill="#6b6862"/><path d="M8.5 0V-30" stroke="${WOOD}" stroke-width="1.5" fill="none"/>`),
  // The ranger: dark green, a sword at his side.
  figure(23, 10, '#3f4a36', `<path d="M-5.5 -10L-10.5 -1" stroke="#8a8a86" stroke-width="1.3" fill="none"/>`),
  // The ring-bearer: a hobbit with a speck of gold.
  figure(13, 7.5, '#5a4630', '<circle cx="0" cy="-6.5" r="1.3" fill="#e0a81c"/>'),
  // His gardener: a hobbit under a pack.
  figure(13, 8, '#6a5a2e', `<rect x="-7.5" y="-10.5" width="4.5" height="6.5" rx="1.6" fill="${WOOD}"/>`),
  figure(13.5, 7.5, '#8a742c'),
  figure(12.5, 7.5, '#4f5e46'),
  // The dwarf: broad, helmed, an axe on his shoulder.
  figure(16, 12, '#7a3b2a', `<path d="M-3.4 -13.4A3.4 3.6 0 0 1 3.4 -13.4Z" fill="#5c5a58"/><path d="M8 -2V-20" stroke="${WOOD}" stroke-width="1.4" fill="none"/><path d="M8 -20l5.5 2l-5.5 3.5z" fill="#8a8a86"/>`),
  // The elf: slim, a bow at his back.
  figure(23, 8, '#5d7a4a', `<path d="M-5.5 -21Q-12.5 -11 -5.5 -2" stroke="${WOOD}" stroke-width="1.2" fill="none"/>`),
  // The man of the south: a round shield.
  figure(23.5, 11, '#5a2f2a', '<circle cx="-6.5" cy="-10" r="4.6" fill="#8a6a3a" stroke="#4a3521" stroke-width="0.8"/>'),
]

function walkers(seconds: number): string {
  // Drawn last to first, so the one ahead stands over the one behind on the way south.
  // With motion off no keyframe places them: each stands where this says, in file down Acebeda.
  const [ax, ay] = ROAD[1] as Point
  const [bx, by] = ROAD[2] as Point

  return NINE.map((drawn, index) => {
    const along = 1 - index / (NINE.length - 1)
    const still = `translate(${n(ax + (bx - ax) * along)} ${n(ay + (by - ay) * along)})`

    return (
      `<g class="tm-w" transform="${still}" style="animation-delay:${n(index * GAP)}s">` +
      `<g class="tm-step" style="animation-delay:${n(-index * 0.17)}s">` +
      `<g transform="scale(1.3)" stroke="${PAPER}" stroke-width="0.7" paint-order="stroke">${drawn}</g></g></g>`
    )
  })
    .reverse()
    .join('')
}

/** A wind rose: a ring, four long points, four short, and the north named. */
function rose(x: number, y: number, r: number): string {
  const long = `M0 ${-r}L${n(r * 0.14)} 0L0 ${r}L${n(-r * 0.14)} 0Z M${-r} 0L0 ${n(r * 0.14)}L${r} 0L0 ${n(-r * 0.14)}Z`
  const short = r * 0.55

  return (
    `<g transform="translate(${x} ${y})" opacity="0.75">` +
    `<circle r="${n(r * 0.72)}" fill="none" stroke="${INK}" stroke-width="1"/>` +
    `<circle r="${n(r * 0.8)}" fill="none" stroke="${INK}" stroke-width="0.5"/>` +
    `<path d="M${n(-short)} ${n(-short)}L${n(short)} ${n(short)}M${n(short)} ${n(-short)}L${n(-short)} ${n(short)}" stroke="${INK}" stroke-width="1" fill="none"/>` +
    `<path d="${long}" fill="${INK}"/>` +
    `<text class="tm-t" y="${n(-r - 7)}" font-size="16" text-anchor="middle">N</text></g>`
  )
}

/** The map speaks two languages; the drawing is the same in both. */
export type Lang = 'en' | 'es'

type Names = {
  misty: string
  hollin: string
  dunland: string
  shire: string
  weathertop: string
  rivendell: string
  title: string
  subtitle: string
}

const NAMES: Readonly<Record<Lang, Names>> = {
  en: {
    misty: 'MISTY MOUNTAINS',
    hollin: 'Hollin',
    dunland: 'Dunland',
    shire: 'The Shire',
    weathertop: 'Weathertop',
    rivendell: 'Rivendell',
    title: 'MIDDLE-EARTH',
    subtitle: 'The road of the Nine, from Rivendell to Amon Hen',
  },
  es: {
    misty: 'MONTAÑAS NUBLADAS',
    hollin: 'Acebeda',
    dunland: 'Tierras Pardas',
    shire: 'La Comarca',
    weathertop: 'Cima de los Vientos',
    rivendell: 'Rivendel',
    title: 'TIERRA MEDIA',
    subtitle: 'El camino de los Nueve, de Rivendel a Amon Hen',
  },
}

// The river the last leg follows, at the right edge of the sheet.
const ANDUIN =
  'M1482 0C1452 120 1512 220 1482 330C1457 430 1502 520 1512 620C1520 700 1552 760 1562 850C1570 920 1590 960 1596 1000'

// THE SHEET IS LAID OUT FOR THE DESKTOP WINDOW: the session list hides the left fifth, the chat column the middle.
// So the west (the sea, the Shire, the title) stands in a strip from 220 to 600, the road of the Nine in a strip from
// 1250 to 1600, and between them lies open country with a road and a river: little ink behind the words.
export function tierraMediaSvg(lang: Lang = 'en'): string {
  const random = seeded(1954)
  const { css, seconds } = walk()
  const peaks = [
    // Montañas Nubladas
    ...chain([[1345, 40], [1338, 150], [1348, 250], [1362, 360], [1370, 440], [1378, 530], [1390, 640], [1400, 740]], 2, 13, random),
    // Montañas Blancas
    ...chain([[1262, 938], [1380, 926], [1490, 938]], 2, 11, random),
    // Montañas Azules
    ...chain([[318, 86], [308, 170], [300, 232]], 1, 11, random),
    // Emyn Muil and the Weather Hills: low
    ...chain([[1578, 790], [1594, 836]], 2, 7, random),
    ...chain([[540, 222], [548, 252]], 1, 8, random),
  ]
  const style =
    `.tm-t{font-family:${SERIF};font-style:italic;fill:${INK};paint-order:stroke;stroke:${PAPER};stroke-width:3.5px;stroke-linejoin:round}` +
    css +
    '@keyframes tm-step{from{transform:translateY(0)}to{transform:translateY(-1.6px)}}' +
    '@keyframes tm-flow{to{stroke-dashoffset:-64}}' +
    '@keyframes tm-crows{0%{transform:translate(1262px,700px);opacity:0}6%{opacity:.8}30%{transform:translate(1288px,330px);opacity:.8}36%,100%{transform:translate(1296px,250px);opacity:0}}' +
    `.tm-w{animation:tm-walk ${n(seconds)}s linear infinite backwards,tm-seen ${n(seconds)}s linear infinite backwards}` +
    '.tm-step{animation:tm-step .42s ease-in-out infinite alternate}' +
    '.tm-flow{animation:tm-flow 9s linear infinite}' +
    '.tm-crows{animation:tm-crows 70s linear infinite backwards;animation-delay:24s}' +
    '@media (prefers-reduced-motion:reduce){.tm-w,.tm-step,.tm-flow{animation:none}.tm-crows{display:none}}'
  const defs =
    '<radialGradient id="tm-paper" cx="50%" cy="45%" r="78%">' +
    '<stop offset="0" stop-color="#f6ecd0"/><stop offset="0.65" stop-color="#ead8ab"/><stop offset="1" stop-color="#cdae76"/>' +
    '</radialGradient>'
  // Old paper: a few pale stains, kept to the two strips.
  const stains = Array.from({ length: 8 }, (_, index) => {
    const x = index % 2 === 0 ? 230 + random() * 360 : 1260 + random() * 330
    const y = random() * HEIGHT

    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(50 + random() * 90)}" ry="${n(40 + random() * 90)}" fill="#a97f45" opacity="${n(0.03 + random() * 0.05)}"/>`
  }).join('')
  const sea =
    '<path d="M0 0H262C290 120 240 220 272 330C304 430 246 520 264 640C280 760 232 860 256 1000H0Z" fill="#bccdc4" opacity="0.6"/>' +
    `<path d="M262 0C290 120 240 220 272 330C304 430 246 520 264 640C280 760 232 860 256 1000" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
    `<path d="M222 150q7 -5 14 0t14 0M228 420q7 -5 14 0t14 0M220 610q7 -5 14 0t14 0M222 880q7 -5 14 0" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.5"/>`
  const rivers =
    '<g fill="none" stroke="#5f8496" stroke-linecap="round" opacity="0.85">' +
    `<path d="${ANDUIN}" stroke-width="3.4"/>` +
    // Bruinen, then Gwathló to the sea: pale where it runs behind the words
    '<path d="M1318 160C1290 175 1262 200 1220 260C1080 440 800 600 520 680C420 720 330 780 262 815" stroke-width="2" opacity="0.6"/>' +
    // Celebrant
    '<path d="M1412 536C1440 556 1470 590 1512 612" stroke-width="1.8"/>' +
    // Brandivino
    '<path d="M420 96C440 200 412 290 438 372C458 452 380 536 268 560" stroke-width="2"/>' +
    // Entaguas
    '<path d="M1440 770C1470 830 1520 890 1580 915" stroke-width="1.8"/>' +
    '</g>' +
    `<path class="tm-flow" d="${ANDUIN}" fill="none" stroke="#e9f1ee" stroke-width="1.1" stroke-dasharray="3 29" stroke-linecap="round" opacity="0.9"/>`
  const roadEast = `<path d="M385 290L490 276L548 264L800 246L1050 218L1281 192" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="6 6" opacity="0.45"/>`
  const woods =
    wood(1642, 300, 72, 215, 15, '#b9b77c', random) + // the eaves of Bosque Negro, at the sheet's edge
    wood(1442, 722, 40, 40, 12, '#b3b472', random) + // Fangorn
    wood(1470, 584, 32, 20, 11, '#dcc463', random) + // Lothlórien, golden
    wood(458, 322, 24, 15, 11, '#b9b77c', random) // Bosque Viejo
  const t = NAMES[lang]
  const names =
    land(432, 470, 'ERIADOR', 26) +
    land(1400, 884, 'ROHAN', 22) +
    land(1424, 300, t.misty, 12, 84, 0.8) +
    land(1272, 300, t.hollin, 13, -86, 0.8) +
    land(1536, 420, 'Anduin', 13, 80, 0.8) +
    land(470, 760, t.dunland, 14, 0, 0.6) +
    place(385, 290, t.shire, 0, -10, 'middle') +
    place(490, 276, 'Bree', 0, -10, 'middle') +
    place(548, 264, t.weathertop, 40, 27, 'end') +
    place(1285, 190, t.rivendell, 0, -11, 'middle') +
    place(1362, 446, 'Caradhras', 24, -4) +
    place(1340, 527, 'Moria', -9, 18, 'end') +
    place(1470, 566, 'Lothlórien', 0, -10, 'middle') +
    place(1540, 850, 'Amon Hen', -10, 6, 'end') +
    place(1392, 806, 'Isengard', -9, 5, 'end') +
    `<text class="tm-t" x="1442" y="784" font-size="15" text-anchor="middle">Fangorn</text>`
  const title =
    `<g transform="translate(416 880)">` +
    `<path d="M-166 -32H166M-166 28H166" stroke="${INK}" stroke-width="1" opacity="0.6"/>` +
    `<path d="M-166 -36H166M-166 32H166" stroke="${INK}" stroke-width="0.5" opacity="0.6"/>` +
    `<text class="tm-t" y="0" font-size="30" letter-spacing="7" text-anchor="middle" style="font-style:normal">${t.title}</text>` +
    `<text class="tm-t" y="20" font-size="12" text-anchor="middle" opacity="0.8">${t.subtitle}</text></g>`
  const crows = `<g class="tm-crows"><path d="M0 0l4 3l4 -3M14 8l4 3l4 -3M-10 12l4 3l4 -3M6 20l4 3l4 -3M24 -4l4 3l4 -3M-4 28l4 3l4 -3" fill="none" stroke="#2c2620" stroke-width="1.3" stroke-linecap="round"/></g>`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">` +
    `<style>${style}</style><defs>${defs}</defs>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#tm-paper)"/>` +
    stains +
    sea +
    rivers +
    roadEast +
    woods +
    mountains(peaks) +
    rose(452, 610, 42) +
    names +
    title +
    crows +
    walkers(seconds) +
    '</svg>'
  )
}
