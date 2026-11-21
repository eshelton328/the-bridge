// The lines a live Claude chat's model chip shows after a model restart (W10): liveModel.ts gives them by the
// server's answer, and useLiveModel.ts for a `starting` chat once the list shows it.

/** The chip's lines, by reason. */
export const modelLines = {
  restarting: 'The chat is restarting',
  working: 'Wait until the chat is idle',
  needsYou: 'The chat needs you on the Mac',
  skipsPermissions: 'This chat skips permissions; change the model on the Mac',
  launchArgsUnknown: 'Change the model on the Mac; the bridge cannot read how this chat started',
  folderChanged: "The chat's folder changed; change the model on the Mac",
  inputNotEmpty: 'Clear the message box on the Mac first',
  gone: 'That chat is gone',
  notRestarted: 'The chat did not restart; it runs as before',
  noAnswer: 'No answer from the server; the chat may have restarted',
  failed: 'Could not change the model',
} as const
