# Spec 05: Code Commenting and Repo Cleanup

Engine source files, simulation scripts, and repository documentation brought to project standards: dual-audience commenting on all code, script headers on all executable files, interior READMEs corrected, and structural inconsistencies resolved.

---

## 1. Outcome

All TypeScript and Python source files have dual-audience comments and language-appropriate headers per the project's documentation standards. All interior READMEs accurately reflect their directory contents and link to correct file paths. The duplicated `documentation-standards/` directory at the repo root is removed. The duplicated `m3-trait-system-v2.md` in `game-design/` is replaced with a pointer to the canonical copy in `spec/`.

---

## 2. Test Gates

| Gate | Verification |
|------|-------------|
| Every `.ts` file in `src/` has a file-level docblock | `grep -rL "\/\*\*" src/ --include="*.ts"` returns empty |
| Every `.py` file in `simulation/` has a script header | `head -5 simulation/*.py` shows docstring on each |
| Comments follow dual-audience pattern | Manual review: each function has a brief "what" comment (user-facing) and implementation notes where non-obvious (developer-facing) |
| `documentation-standards/` at repo root is removed | `ls -d documentation-standards/` fails |
| `game-design/m3-trait-system-v2.md` is a pointer, not a copy | File contains only a redirect notice and link to `spec/m3-trait-system-v2.md` |
| All interior READMEs list correct file inventories | Each README's file table matches `ls` of its directory |
| No broken relative links in any README | `grep -r '](../' docs/ game-design/ spec/ simulation/ work-logs/ --include="*.md"` cross-checked against actual paths |
| `.ruff_cache/` is gitignored and removed from tracking | `.gitignore` contains `.ruff_cache/` and directory is untracked |

---

## 3. Constraints

- Do not modify any game logic, simulation logic, or design content. This is a documentation and commenting pass only.
- Follow the commenting style in `docs/documentation-standards/code-commenting-dual-audience.md`.
- Follow the script header templates in `docs/documentation-standards/script-header-python.md` and `docs/documentation-standards/script-header-shell.md`.
- TypeScript files use JSDoc-style `/** */` block comments for file headers and exported function documentation.
- Python files use module-level docstrings and function docstrings.
- Comments must add value. Do not comment self-evident code (e.g., `// increment counter` on `i++`). Focus on *why* and *what*, not *how*.
- Interior READMEs follow the template at `docs/documentation-standards/interior-readme-template.md`.

---

## 4. Scope

**Pre-existing (do not create or modify logic in):**

- `src/` (13 TypeScript files, ~98KB total)
- `simulation/simulator.py` (~350 LOC)
- `simulation/game_data.py` (~150 LOC)
- `data/*.json` (do not modify)
- `game-design/` content documents (do not modify content)
- `spec/` specification documents (do not modify content)

**Modify (comments and headers only):**

- `src/main.ts`
- `src/styles.css` (file header comment only)
- `src/types/index.ts`, `scene.ts`, `event.ts`, `state.ts`, `characters.ts`
- `src/engine/game-state.ts`, `scene-runner.ts`, `event-system.ts`, `save-manager.ts`
- `src/ui/layout.ts`, `dialogue.ts`, `hud.ts`, `screens.ts`
- `src/audio/audio-manager.ts`
- `simulation/simulator.py`
- `simulation/game_data.py`

**Modify (README content):**

- `docs/README.md`
- `game-design/README.md`
- `spec/README.md`
- `work-logs/README.md`
- `work-logs/01-concept-and-art-direction/README.md`
- `data/README.md`
- `assets/README.md`
- `assets/concept-artwork/README.md`
- `simulation/README.md`
- `shared/README.md`

**Replace with pointer:**

- `game-design/m3-trait-system-v2.md` → pointer to `spec/m3-trait-system-v2.md`

**Delete:**

- `documentation-standards/` (root-level duplicate; canonical copy is `docs/documentation-standards/`)
- `.ruff_cache/` (add to `.gitignore`, remove from tracking)

**Out of scope:**

- SpecSmith retrospective spec rewrites (separate task)
- Work log content writing (separate task)
- GDD content updates (separate task)
- AGENTS.md and root README updates (separate task)
- Spec file renaming (separate task)

---

## 5. Dependencies

| Dependency | Relationship |
|------------|-------------|
| `docs/documentation-standards/code-commenting-dual-audience.md` | Defines the commenting style to follow |
| `docs/documentation-standards/interior-readme-template.md` | Template for README updates |
| `docs/documentation-standards/script-header-python.md` | Header format for Python files |

---

## 6. References

| Resource | Description |
|----------|-------------|
| [Engine Spec](spec/engine-spec.md) | Architecture context for understanding source file purposes |
| [Simulator Spec](spec/wp-simulator-spec.md) | Architecture context for simulation files |
| [Repo Cleanup Task List](work-logs/03-content-design/repo-cleanup-tasks.md) | Prior audit identifying specific README issues |
