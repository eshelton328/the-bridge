# Workspaces page

The Workspaces page: the Workbench of Figma page 89:2, whose
references are in `references/workspaces/`. It is empty until the
workbench loop builds it. Read [../AGENTS.md](../AGENTS.md) first: it says
what each file of a page folder is for.

- `WorkspacesPage.tsx` is the connected entry; `screens/` are props-only.
- One state file per Figma Workspaces frame in `states/`, each with a story.
