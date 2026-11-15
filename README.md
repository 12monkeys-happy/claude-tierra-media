# Middle-earth · Tierra Media

**English** · [Español](#español)

A theme for Claude Code: a map of Middle-earth drawn on parchment behind the chat, with the Fellowship walking from Rivendell to Amon Hen along the edge of the window.

![The Fellowship walking across the map, behind the chat](demo.gif)

[Watch the full video (MP4, 16 s)](demo.mp4)

*The video is a recreation of the interface, in Spanish, with made-up sessions and conversation.*

## What it does

- Draws the map on both sides of the chat: the Shire, Bree and Eriador on the left; the Misty Mountains, Moria, Lothlórien and the Anduin on the right.
- Nine silhouettes walk the road in single file and start over. Inside Moria they fade.
- Lays a pale veil over the chat column so the text stays easy to read.
- Forces light mode while it is on.

It is made for the desktop app, with a wide window and the sidebar open. The terminal draws nothing.

## Install

At the prompt of a terminal session:

```
/plugin install tierra-media --marketplace 12monkeys-happy/claude-tierra-media
```

Answer `y` to add the marketplace, pick the scope with Enter, and choose the map language on the next screen.

From a shell:

```
claude plugin install tierra-media --marketplace 12monkeys-happy/claude-tierra-media
```

In the desktop app, where `/plugin` does not run: click **+** next to the message box, then **Plugins**, **Add marketplace** with `12monkeys-happy/claude-tierra-media`, then **Add plugin**.

## Use

- `/tierra-media` shows the map.
- `/tierra-media off` puts it away.
- `/tierra-media en` and `/tierra-media es` switch the language, and the choice is remembered.

## Language

The map comes in English and Spanish. English is the default.

- **When you install**, the plugin asks for `Map language`: `en` or `es`. You can change it later in the plugin's settings.
- **At any time**, `/tierra-media es` or `/tierra-media en` switches on the spot. A language picked with the command wins over the setting.

If another theme is on (one from `theme-examples`, for instance), turn it off first so it does not take over the map.

## Files

- `hooks/register.tsx`: the command, the language choice and the backdrop.
- `hooks/scene.ts`: the map, a single SVG animated with CSS, with no scripts or outside images.

## License

MIT. See `LICENSE`.

## Note

Fan work, made for the love of it. The drawing is original; the place names come from the works of J. R. R. Tolkien. It is not affiliated with or endorsed by the Tolkien Estate or any rights holder.

---

# Español

Un tema para Claude Code: un mapa de la Tierra Media dibujado en pergamino detrás del chat, con la Compañía caminando de Rivendel a Amon Hen por la orilla de la ventana.

*El video de arriba es una recreación de la interfaz, con sesiones y conversación inventadas.*

## Qué hace

- Dibuja el mapa a los lados del chat: la Comarca, Bree y Eriador a la izquierda; las Montañas Nubladas, Moria, Lothlórien y el Anduin a la derecha.
- Nueve siluetas en fila recorren el camino y vuelven a empezar. Dentro de Moria se atenúan.
- Pone un velo claro sobre la columna del chat para que el texto se lea bien.
- Fuerza el modo claro mientras está activo.

Está pensado para la app de escritorio, con la ventana ancha y la barra lateral abierta. En la terminal no se dibuja nada.

## Instalar

En el prompt de una sesión de terminal:

```
/plugin install tierra-media --marketplace 12monkeys-happy/claude-tierra-media
```

Responde `y` para agregar el marketplace, elige el alcance con Enter y escoge el idioma del mapa en la pantalla siguiente.

Desde la shell:

```
claude plugin install tierra-media --marketplace 12monkeys-happy/claude-tierra-media
```

En la app de escritorio, donde `/plugin` no corre: clic en **+** junto a la caja de mensajes, luego **Plugins**, **Add marketplace** con `12monkeys-happy/claude-tierra-media`, y **Add plugin**.

## Usar

- `/tierra-media` muestra el mapa.
- `/tierra-media off` lo guarda.
- `/tierra-media es` y `/tierra-media en` cambian el idioma, y la elección se recuerda.

## Idioma

El mapa viene en inglés y en español. El inglés es el idioma por defecto.

- **Al instalar**, el plugin pregunta por `Map language`: `en` o `es`. Después se puede cambiar en la configuración del plugin.
- **En cualquier momento**, `/tierra-media es` o `/tierra-media en` lo cambia al instante. El idioma elegido con el comando manda sobre la configuración.

Si tienes otro tema activo (por ejemplo uno de `theme-examples`), apágalo primero para que no le gane al mapa.

## Archivos

- `hooks/register.tsx`: el comando, la elección de idioma y el dibujo del fondo.
- `hooks/scene.ts`: el mapa, un solo SVG animado con CSS, sin scripts ni imágenes externas.

## Licencia

MIT. Ver `LICENSE`.

## Nota

Trabajo de fan, hecho por gusto. El dibujo es original; los nombres de lugares vienen de la obra de J. R. R. Tolkien. No está afiliado ni respaldado por Tolkien Estate ni por ningún titular de derechos.
