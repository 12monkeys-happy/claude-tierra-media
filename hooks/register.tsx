import type { Register, ThemeSetArgs } from 'claude-code'

import { tierraMediaSvg } from './scene'
import type { Lang } from './scene'

const PLUGIN = 'tierra-media'
const COMMAND = 'tierra-media'
// Holds 'off' where the person put the map away; absent, the map shows.
const OFF_KEY = 'off'
// Holds the language the person picked with the command; absent, the plugin's `language` option decides.
const LANG_KEY = 'lang'

const WORDS = {
  en: {
    describe: 'The map of Middle-earth behind the chat, the Fellowship walking; "es"/"en" pick the language, "off" hides it.',
    alt: 'A parchment map of Middle-earth: the Fellowship walks from Rivendell to Amon Hen',
    stored: 'Map put away. /tierra-media brings it back.',
    usage: 'Try /tierra-media, /tierra-media en, /tierra-media es or /tierra-media off.',
    shown: 'Middle-earth applied. Made for a light window.',
    undrawn: 'Middle-earth applied, but this window draws no themes.',
    failed: 'The map could not be shown',
    unstored: 'The map could not be put away',
  },
  es: {
    describe: 'El mapa de la Tierra Media detrás del chat, con la Compañía caminando; "es"/"en" eligen el idioma, "off" lo quita.',
    alt: 'Mapa de la Tierra Media en pergamino: la Compañía camina de Rivendel a Amon Hen',
    stored: 'Mapa guardado. /tierra-media lo vuelve a mostrar.',
    usage: 'Prueba /tierra-media, /tierra-media es, /tierra-media en o /tierra-media off.',
    shown: 'Tierra Media aplicada. Hecha para ventana clara.',
    undrawn: 'Tierra Media aplicada, pero esta ventana no dibuja temas.',
    failed: 'El mapa no se pudo mostrar',
    unstored: 'El mapa no se pudo quitar',
  },
} as const

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'es'
}

// The scene's name carries the language, so a change of language is a change of scene and the app draws it again.
// A pale parchment veil over the chat column. The scene keeps that column almost bare, so the veil can stay light.
function lookFor(lang: Lang): ThemeSetArgs {
  return {
    backdrop: { scene: `${PLUGIN}-${lang}`, glass: { blur: 5, tint: '#faf3e0', opacity: 0.72 } },
    overrideColorScheme: 'light',
  }
}

// Built once a load for each language: the scene is the same every time.
const built = new Map<Lang, string>()

function scene(lang: Lang): string {
  let ready = built.get(lang)

  if (ready === undefined) {
    ready = tierraMediaSvg(lang)
    built.set(lang, ready)
  }

  return ready
}

export const register: Register = (on, options) => {
  const chosen: Lang = isLang(options.language) ? options.language : 'en'

  /** The command's pick where there is one, else the plugin's option. */
  function pick(stored: unknown): Lang {
    return isLang(stored) ? stored : chosen
  }

  on('session.start', async ($, e, next) => {
    let lang = chosen

    try {
      lang = pick(await $.store.get(LANG_KEY))
    } catch {
      // The option stands.
    }

    try {
      await $.command.register({ name: COMMAND, description: WORDS[lang].describe })
    } catch (error) {
      void $.ui.toast(`tierra-media: /${COMMAND} (${String(error)})`)
    }

    // A fault here must not cost the session its start.
    try {
      if ((await $.store.get(OFF_KEY)) !== 'off') {
        await $.theme.set(lookFor(lang))
      }
    } catch (error) {
      void $.ui.toast(`tierra-media: ${WORDS[lang].failed} (${String(error)})`)
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    let lang = chosen

    try {
      lang = pick(await $.store.get(LANG_KEY))
    } catch {
      // The option stands.
    }

    if (word === 'off') {
      try {
        await $.store.set(OFF_KEY, 'off')
        await $.theme.clear()
      } catch (error) {
        return { text: `${WORDS[lang].unstored}: ${String(error)}` }
      }

      return { text: WORDS[lang].stored }
    }

    if (word !== '' && word !== 'on' && !isLang(word)) {
      return { text: WORDS[lang].usage }
    }

    try {
      if (isLang(word)) {
        lang = word
        await $.store.set(LANG_KEY, lang)
      }

      await $.store.delete(OFF_KEY)
      const set = await $.theme.set(lookFor(lang))

      return { text: set.isDrawn ? WORDS[lang].shown : WORDS[lang].undrawn }
    } catch (error) {
      return { text: `${WORDS[lang].failed}: ${String(error)}` }
    }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.surface !== 'desktop') {
      return next(e)
    }

    const lang: Lang = String(e.props.scene).endsWith('-es') ? 'es' : 'en'
    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt={WORDS[lang].alt} source={scene(lang)} />
  })
}
