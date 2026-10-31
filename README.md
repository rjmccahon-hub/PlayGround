# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/rjmccahon-hub/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/rjmccahon-hub/PlayGround)

- 🎮 [Open the project](https://omgithub.com/rjmccahon-hub/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=rjmccahon-hub%2FPlayGround).
- 💻 [Explore the source](https://github.com/rjmccahon-hub/PlayGround).
- 🛠️ [Check build runs](https://github.com/rjmccahon-hub/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/rjmccahon-hub/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/rjmccahon-hub).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

## Cubic Kingdoms

A cozy, browser-based voxel sandbox inspired by the classic cubic castle MMOs.
Explore a floating island, mine and place blocks, take on village quests, leap
the sky-stone parkour course, and build your own kingdom in the clouds.

### Play

No build step required. Serve the folder with any static file server:

```bash
python3 -m http.server 3002 --bind 127.0.0.1
```

Then open <http://127.0.0.1:3002>.

### Controls

- **WASD** move, **Space** jump, **Shift** sprint
- **Mouse** look, **left-click** mine, **right-click** place
- **E** talk to villagers, **1–9** select a hotbar block
- **I** inventory, **B** shop, **C** wardrobe, **M** sound, **G** dance, **Esc** pause
- **Touch**: left joystick to move, drag the world to look, action buttons to jump,
  mine, place, talk, and dance

Progress, world edits, quests, coins, and wardrobe choices save automatically in
the browser. Use **Menu → Reset realm** to start fresh.

### Tech

Three.js (vendored for offline use), procedural voxel textures, chunked meshing
with ambient occlusion, a day/night cycle, procedural WebAudio, and a responsive
touch HUD. Everything runs as static HTML/CSS/ES modules.
