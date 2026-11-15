import type { Register, ThemeSetArgs } from 'claude-code'

import { tierraMediaSvg } from './scene'

const PLUGIN = 'tierra-media'
const SCENE = 'tierra-media'
const COMMAND = 'tierra-media'
// Holds 'off' where the person put the map away; absent, the map shows.
const OFF_KEY = 'off'
// A pale parchment veil over the chat column. The scene keeps that column almost bare, so the veil can stay light.
const LOOK: ThemeSetArgs = {
  backdrop: { scene: SCENE, glass: { blur: 5, tint: '#faf3e0', opacity: 0.72 } },
  overrideColorScheme: 'light',
}

// Built once a load: the scene is the same every time.
let built: string | undefined

function scene(): string {
  built ??= tierraMediaSvg()

  return built
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: COMMAND,
        description: 'El mapa de la Tierra Media detrás del chat, con la Compañía caminando; "off" lo quita.',
      })
    } catch (error) {
      void $.ui.toast(`tierra-media: /${COMMAND} no está disponible (${String(error)})`)
    }

    // A fault here must not cost the session its start.
    try {
      if ((await $.store.get(OFF_KEY)) !== 'off') {
        await $.theme.set(LOOK)
      }
    } catch (error) {
      void $.ui.toast(`tierra-media: el mapa no se pudo mostrar (${String(error)})`)
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === 'off') {
      try {
        await $.store.set(OFF_KEY, 'off')
        await $.theme.clear()
      } catch (error) {
        return { text: `El mapa no se pudo quitar: ${String(error)}` }
      }

      return { text: 'Mapa guardado. /tierra-media lo vuelve a mostrar.' }
    }

    if (word !== '' && word !== 'on') {
      return { text: 'Prueba /tierra-media o /tierra-media off.' }
    }

    try {
      await $.store.delete(OFF_KEY)
      const set = await $.theme.set(LOOK)

      return {
        text: set.isDrawn
          ? 'Tierra Media aplicada. Hecha para ventana clara.'
          : 'Tierra Media aplicada, pero esta ventana no dibuja temas.',
      }
    } catch (error) {
      return { text: `El mapa no se pudo mostrar: ${String(error)}` }
    }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.surface !== 'desktop') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        isInteractive
        alt="Mapa de la Tierra Media en pergamino: la Compañía camina de Rivendel a Amon Hen"
        source={scene()}
      />
    )
  })
}
