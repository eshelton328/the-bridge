# Settings library gaps

Parts and tokens the Settings page (d-119) needs that the component library
(`@eshelton328/component-library-1701`, the build installed in this
worktree) could not draw when the page was planned. Each gap goes to the
library in a batched PR through the `library-gap-filler` agent;
bridge-coord releases it (d-104). The frames are PNG references
(`references/settings/`), so no Figma node is named.

| Part or token                                                        | Frames                    | What is missing                                                                                                                      | Used now                             |
| -------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Gear icon for the Settings rail item and More drawer row             | D01, D02, M03             | Done: component-library-1701 #318 (aea78f1), released in beta.104.                                                                   | `SettingsIcon`                       |
| Text size Small and Large as type token sets, by a class on `<html>` | D01–D02, T01–T04, M01–M02 | Done: component-library-1701 #320, released in beta.104; d-122 made the base Small and added `text-default` and `text-large` (#340). | `textSizeClass` in `app/textSize.ts` |
