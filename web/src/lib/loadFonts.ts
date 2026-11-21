// Loads every font face the page's CSS declares. A browser loads a face only when text first uses it, and until then
// it lays the text out in a fallback font. On a CI runner with a cold cache, DiscussionCompactText measured the
// owner's message in the fallback before Geist loaded: two lines, 60 px high in place of 39 (the-bridge #315, CI run
// 44858794627). testSetup.ts calls this before each file's tests, so a test measures the app's real fonts.

/**
 * Loads each declared face that has not loaded yet, and waits for one that is loading now (its `load()` gives the same
 * promise); rejects if one fails, as a measure would then be wrong.
 */
export async function loadDeclaredFonts(fonts: FontFaceSet = document.fonts): Promise<void> {
  await Promise.all([...fonts].filter((face) => face.status !== 'loaded').map((face) => face.load()))
}
