# Áudio

`the-fight-juliush.mp3` é **The Fight – Epic Battle Music**, de JuliusH.

- Fonte: https://pixabay.com/music/epic-classical-the-fight-epic-battle-music-4285/
- Licença: Pixabay Content License — https://pixabay.com/service/license-summary/
- Uso no projeto: menus, preparação, manuais e páginas narrativas. A reprodução é interrompida durante a partida.

## Sons da partida (`sfx/`)

Durante a partida, `../audio.js` toca os arquivos de `sfx/` e, para cada vaga ainda sem arquivo, um efeito sintetizado em tempo real. A lista completa de vagas está em `sfx/LEIA-ME.md`. Todos da Pixabay, sob a Pixabay Content License.

| Arquivo | Som | Autor | Fonte |
|---|---|---|---|
| `sfx/mar.mp3` | Sea gently lapping waves far away seagulls | JonathanSlatterMusic | https://pixabay.com/sound-effects/nature-sea-gently-lapping-waves-far-away-seagulls-486892/ |
| `sfx/tambores-longe.mp3` | Ancient War Drums | DRAGON-STUDIO | https://pixabay.com/sound-effects/musical-ancient-war-drums-463214/ |
| `sfx/tambores-guerra.mp3` | Horde War Drums loop 130bpm | WilliamHector | https://pixabay.com/sound-effects/musical-horde-war-drums-loop-130bpm-342956/ |
| `sfx/batimento.mp3` | Heartbeat loop | freesound_community | https://pixabay.com/sound-effects/people-heartbeat-loop-96879/ |
| `sfx/revelar.mp3` | Mystic Reveal | Universfield | https://pixabay.com/sound-effects/musical-mystic-reveal-567294/ |
| `sfx/descoberta.mp3` | Chest Opening | freesound_community | https://pixabay.com/sound-effects/household-chest-opening-87569/ |
| `sfx/encontro.mp3` | Ancient Lyre Sound, Short Arpeggio | Lesiakower | https://pixabay.com/sound-effects/musical-ancient-lyre-sound-short-arpeggio-sound-effect-430628/ |
| `sfx/cronica.mp3` | Single Church Bell | Universfield | https://pixabay.com/sound-effects/musical-single-church-bell-156463/ |
| `sfx/feito.mp3` | Grito curto de soldados aclamando o herói (escolhido pelo Felipe em 02/10/2026) | Pixabay | — |
| `sfx/queda.mp3` | Dark Melancholic Cello Solo | Chrysalyn | https://pixabay.com/sound-effects/musical-dark-melancholic-cello-solo-540238/ |
| `sfx/deus-atena.mp3` | Magic Twinkle | Universfield | https://pixabay.com/sound-effects/film-special-effects-magic-twinkle-244951/ |
| `sfx/deus-poseidon.mp3` | Waves Crashing | DRAGON-STUDIO | https://pixabay.com/sound-effects/nature-waves-crashing-397977/ |
| `sfx/deus-zeus.mp3` | Thunder Strike | Universfield | https://pixabay.com/sound-effects/nature-thunder-strike-124463/ |
| `sfx/espada.mp3` | Sword Slash With Metallic Impact | DavidDumaisAudio | https://pixabay.com/sound-effects/film-special-effects-sword-slash-with-metallic-impact-185435/ |
| `sfx/lanca.mp3` | spear_thrust (1) | Yodguard | https://pixabay.com/sound-effects/film-special-effects-spear-thrust-1-382402/ |
| `sfx/escudo.mp3` | shield_impact (3) | Yodguard | https://pixabay.com/sound-effects/film-special-effects-shield-impact-3-382411/ |
| `sfx/flecha.mp3` | Bow sound | u_2c8g87fmmx | https://pixabay.com/sound-effects/film-special-effects-bow-sound-596323/ |
| `sfx/acampamento.mp3` | Men Shouting Hey | freesound_community | https://pixabay.com/sound-effects/people-men-shouting-hey-6376/ |
| `sfx/marcha.mp3` | Army Marching Steps Ambience Noise | Alex_Jauk | https://pixabay.com/sound-effects/film-special-effects-army-marching-steps-ambience-noise-442715/ |
| `sfx/troianos.mp3` | War Drum Loop | freesound_community | https://pixabay.com/sound-effects/musical-war-drum-loop-103870/ |
| `sfx/caixa.mp3` | box-dropping-with-stones | freesound_community | https://pixabay.com/sound-effects/film-special-effects-box-dropping-with-stones-46880/ |

## Trilha dos portais

A página de portais (`index.html`) tem trilha própria: *Cinematic Travel Adventure* (cinematicacoustica, Pixabay), em `assets/audio/cinematicacoustica-cinematic-travel-adventure-537131.mp3`, com ganho 0,68 para soar no mesmo volume de *The Fight* (JuliusH), que fica com a campanha de Troia. Para dar trilha própria a outra página, use `data-music`, `data-music-title` e, se precisar nivelar o volume, `data-music-gain` na tag do `audio.js`.
