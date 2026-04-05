# Milestones 01 and 02: Procedures

> For: AI agents (Claude, etc.) executing project setup  
> Purpose: Reduce repeated explanation of standard project kickoff process  
> Reference: `.internal-files/github-project-setup-methodology.md` for script details

---

## Overview

Every repository starts with two mandatory milestones:

| Milestone | Name | Output |
|-----------|------|--------|
| 01 | Ideation and Setup | Repository scaffolded, documented, initial commit |
| 02 | GitHub Project Frameout | Project board populated, work units defined and assignable |

These milestones are completed through conversation with the human operator, not autonomously.

---

## Milestone 01: Ideation and Setup

### What This Is

A discussion session where human and AI orchestrator:

1. Define what the project is and why it exists
2. Decide on repository structure
3. Customize templates for this specific project
4. Write the primary README
5. Initialize the memory bank with project context
6. Make the initial commit

### Process

**Phase A: Scope Definition**

The human brings a project concept. Through discussion, establish:

- Project name and one-line description
- Problem being solved / why this exists
- Target audience
- Key technologies involved
- Rough phase structure (what are the major chunks of work?)

Do not rush to generate. Stay in discussion until scope is clear.

**Phase B: Repository Scaffolding**

Once scope is understood:

1. Copy from `project-template-repository` the needed components
2. Customize directory structure for this project's domain
3. Remove anything not needed (keep it lean)

Typical structure:

```
project-name/
├── docs/documentation-standards/   # Templates (customize if needed)
├── work-logs/
│   ├── 01-ideation-and-setup/
│   └── 02-github-project-frameout/
├── [domain-specific directories]
├── AGENTS.md
├── LICENSE
├── LICENSE-DATA
├── README.md
└── [other standard files]
```

**Phase C: Documentation**

Write/customize these files:

| File | Action |
|------|--------|
| `README.md` | Write from `primary-readme-template.md`, fill in project specifics |
| Interior READMEs | Create for any directory that needs explanation |
| `AGENTS.md` | Populate with project context: identity, current state, key documents, architecture, conventions |

**Phase D: Initial Commit**

- Stage all files
- Commit message: `Initial commit: repository scaffolding and documentation`
- Push to remote

### Completion Criteria

Milestone 01 is complete when:

- [ ] Repository exists with appropriate structure
- [ ] README accurately describes the project
- [ ] AGENTS.md populated with project context
- [ ] All placeholder values replaced with project specifics
- [ ] Initial commit pushed

### Worklog

After completion, write `work-logs/01-ideation-and-setup/README.md` documenting:

- Objective and outcome (1-2 sentences each)
- Key decisions made (what and why)
- Artifacts produced
- What's handed off to M02

Use `worklog-readme-template.md` as the base.

---

## Milestone 02: GitHub Project Frameout

### What This Is

Transform the project scope into an actionable GitHub Project with:

- Labels for categorization
- Milestones for phase containers
- Tasks (parent issues) with progress tracking
- Sub-tasks (child issues) as assignable work units

### Prerequisites

- Milestone 01 complete
- `gh` CLI authenticated
- `gh-sub-issue` extension installed (see `.internal-files/github-project-setup-methodology.md`)

### Process

**Phase A: Scope Mapping**

From M01 discussions, identify:

1. **Milestones** — Major phases of work (typically 3-6 for initial mapping)
2. **Tasks** — Parent issues within each milestone (groups of related work)
3. **Sub-tasks** — Individual work units (session-sized, independently assignable)

Use numbering convention: `{Milestone}.{Task}.{SubTask}` (e.g., 2.1.3)

**Phase B: Script Creation**

Build the setup script following `.internal-files/github-project-setup-methodology.md`:

1. Define labels (Task, Sub-Task, domain-specific labels)
2. Define milestones with descriptions and due dates
3. Define tasks with bodies listing their sub-tasks
4. Define sub-tasks
5. Define linkages (which sub-tasks belong to which tasks)

Store script in `work-logs/02-github-project-frameout/` (e.g., `create-project.ps1`).

**Phase C: Execution**

Run the script. Verify:

- All labels created
- All milestones created
- All tasks have correct milestone assignment
- All sub-tasks linked to parent tasks (progress bars visible)
- Project board shows expected structure

**Phase D: Project Board Configuration**

In GitHub:

1. Create Project (if not exists)
2. Add repository to project
3. Configure Kanban view with appropriate columns
4. Add milestone filter for focused views

### Completion Criteria

Milestone 02 is complete when:

- [ ] All labels exist
- [ ] All milestones exist with descriptions
- [ ] All tasks created with sub-task linkages (progress bars visible)
- [ ] Project board configured and accessible
- [ ] Work units are ready for assignment

### Worklog

After completion, write `work-logs/02-github-project-frameout/README.md` documenting:

- Summary (milestones mapped, tasks created, sub-tasks created)
- Script location
- Any deviations from standard process
- Link to GitHub Project

---

## Work Unit Sizing

Sub-tasks should be **session-sized**:

- Completable in one working session (evening, afternoon)
- Independently assignable (no blocking dependencies within the sub-task)
- Clear scope (someone can pick it up and know what "done" means)

If a sub-task feels too big, split it. If it feels trivial, maybe it's part of another sub-task.

---

## Numbering Convention

Titles include structured numbering for Kanban readability:

```
Task 2.1: Document Proxmox Nodes
Sub-Task 2.1.1: Hardware specifications
Sub-Task 2.1.2: Storage configuration
Sub-Task 2.1.3: Cluster configuration
```

At a glance: `2` = Milestone 2, `2.1` = First task in M2, `2.1.3` = Third sub-task of Task 2.1.

---

## Script Reference

Full script template and methodology details in:  
`.internal-files/github-project-setup-methodology.md`

Key commands:

```powershell
# Create milestone (no gh milestone command, use API)
gh api "repos/$REPO/milestones" --method POST -f title="M1: Phase Name" -f description="..." -f due_on="2025-01-15T00:00:00Z"

# Create issue
gh issue create --repo $REPO --title "Task 1.1: Name" --label "Task" --milestone "M1: Phase Name" --body "..."

# Link sub-issue to parent
gh sub-issue add $parentNum $childNum --repo $REPO
```

---

## Common Patterns

### Small Projects (1-2 milestones beyond setup)

- M01: Ideation and Setup
- M02: GitHub Project Frameout  
- M03: [The actual work]

### Medium Projects (3-5 milestones of real work)

Map first 3 milestones in detail during M02. Add subsequent milestones as scope clarifies.

### Large Projects (6+ milestones)

Map first 3 milestones in detail. Create placeholder milestones for later phases. Refine as project progresses.

---

## Handoff

After M02, the project is ready for development:

- Repository structure exists
- Documentation established
- All work units visible in GitHub Project
- Sub-tasks assignable to human or AI agents
- Progress trackable via task progress bars

Development work begins with Milestone 03 (or whatever the first "real work" milestone is numbered).
