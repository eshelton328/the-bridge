// What the SSE streams share (R43b): a comment line every `ssePingMs`, so a
// proxy keeps a quiet stream open and a page that hears nothing for three
// times as long can tell that the server is gone (a hard kill behind Vite
// ends no stream the page can see).

/** The time between two `: ping` comment lines of an SSE stream. */
export const ssePingMs = 15_000
