# Every Cell is Code

[Discord server](https://discord.gg/fSMwfn8sKw)

**Every Cell is Code** is an infinite grid where each cell is a living JavaScript block — a self-contained WebWorker with its own canvas.
Each block can render graphics, communicate with its neighbors, and evolve over time.
Together, they form a programmable universe — decentralized, reactive, and alive.

**Try it out here:** [https://pavel-voronin.github.io/every-cell-is-code/](https://pavel-voronin.github.io/every-cell-is-code/)

---

## 🚧 Roadmap

- [x] **Codebase maturity:** refactor MVP, improve architecture, clean up and stabilize core logic
- [x] Chunked loading of blocks
- [ ] Grid navigation (infinite scroll w/ pointer lock like in Miro/Figma, teleport by coordinates)
- [ ] Chunk management (multi-level chunks, unloading, caching, etc.)
- [ ] Developer Experience (API, instructions, your [ideas](https://github.com/pavel-voronin/every-cell-is-code/discussions))
- [ ] Live block editor
- [ ] Standalone domain and sandboxing w/ CSP

---

## 🧩 How to Contribute

Create your own block and drop it onto the grid!

1. Write a JavaScript worker and place it next to `src/public/workers` folder.
2. Pick any free coordinates and register your block in `src/public/chunk_{chunkX = x/8}_{chunkY = y/8}.json`. Chunk size **will be** adjusted soon.
3. Submit a PR to share your block with the world 🌍

---

## 🤝 Join the Community

Join us on our [Discord server](https://discord.gg/fSMwfn8sKw)

We’re building a creative space where code becomes pixels, behavior, neighbors, and art. 🎨✨

- Share ideas in [Discussions](https://github.com/pavel-voronin/every-cell-is-code/discussions)
- Report bugs or request features via [Issues](https://github.com/pavel-voronin/every-cell-is-code/issues)

---

## 📜 License

[MIT](LICENSE) © 2025 Pavel Voronin — made with ❤️
