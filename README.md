# Gradient MOTD Generator

A single-page web app for Minecraft server owners: interpolate a smooth RGB gradient
across every character of your server MOTD, preview it in a pixel-accurate replica of the
vanilla multiplayer list, and copy the result in the format your server actually reads.

No build step, no dependencies at runtime, no network calls. Upload the folder and it works.

## Files

```
index.html            markup + Tailwind config values (no inline JS beyond config)
css/styles.css        source stylesheet (custom CSS + Tailwind directives live in the build)
css/app.min.css       generated, minified, production stylesheet — this is what ships
js/color.js           color parsing, hex conversion, linear interpolation
js/gradient.js        per-character LERP + vanilla / ampersand / MiniMessage emitters
js/preview.js         Minecraft server list renderer, ping bars, icon, obfuscated scramble
js/app.js             state, event wiring, counters, tabs, clipboard
assets/fonts/         Monocraft (SIL Open Font License 1.1)
```

## Output formats

| Tab | Target | Example |
| --- | --- | --- |
| Vanilla | `server.properties` | `\u00A7x\u00A7f\u00A7f\u00A75\u00A7f\u00A76\u00A7dW` |
| Ampersand | EssentialsX & plugin configs | `&#ff5f6dW&#ff636de` |
| MiniMessage | Paper/Spigot Adventure API | `<gradient:#ff5f6d:#ffc371>Welcome</gradient>` |

In vanilla and ampersand output, active style codes (`&l`, `&o`, `&n`, `&m`, `&k`) are
re-emitted after every color code, because a color code resets formatting in Java. Lines are
joined with a literal `\n` escape, which the properties reader turns into a real line break.

Minecraft shows at most 2 MOTD lines of roughly 45 (safe) to 59 (hard limit) characters;
the counters under the input flag both states.

## Credits

Preview typeface: [Monocraft](https://github.com/IdreesInc/Monocraft) by Idrees Inc,
SIL Open Font License 1.1. Not affiliated with Mojang or Microsoft.
