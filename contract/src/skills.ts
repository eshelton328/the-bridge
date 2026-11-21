// The skills and commands that a chat's "/" list offers (R34): each by the
// name the owner types after "/", a one-line description and where it comes
// from. Never a path or a file's text beyond its description.
import { z } from 'zod'
import { ChatId } from './ids.ts'

/** The longest description: one line, cut by the server at about 80 characters. */
export const maxSkillDescription = 120
/** The most entries in one list. */
export const maxSkills = 500

/** Where a skill comes from: a command the page sends itself, the owner's own, the chat's folder, or a plugin. */
export const SkillSource = z.enum(['builtin', 'user', 'project', 'plugin'])
export type SkillSource = z.infer<typeof SkillSource>

export const ChatSkill = z.strictObject({
  /** What the owner types after "/", such as "writer" or "engine:ambitious". */
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/),
  description: z.string().max(maxSkillDescription),
  source: SkillSource,
})
export type ChatSkill = z.infer<typeof ChatSkill>

/** `GET /api/chats/:chat/skills`: the built-in commands first, then the skills by name. */
export const ChatSkillsResponse = z.strictObject({
  chat: ChatId,
  skills: z.array(ChatSkill).max(maxSkills),
})
export type ChatSkillsResponse = z.infer<typeof ChatSkillsResponse>
