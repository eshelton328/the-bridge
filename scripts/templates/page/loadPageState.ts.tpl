// The {{Title}} route's loader: the state to show, `?state=` in development.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { {{page}}States } from './states/index.ts'
import { {{Page}}State, type {{Page}}Data, type {{Page}}Ui } from './types.ts'

type {{Page}}StateKey = keyof typeof {{page}}States

const is{{Page}}StateKey = (key: string): key is {{Page}}StateKey => Object.hasOwn({{page}}States, key)

export function load{{Page}}State(requested: string | undefined): ScreenState<{{Page}}Data, {{Page}}Ui> {
  const key = import.meta.env.DEV && requested !== undefined ? requested : Object.keys({{page}}States)[0]
  if (key === undefined || !is{{Page}}StateKey(key)) throw notFound()
  return parseState({{Page}}State, {{page}}States[key], `{{page}}/${key}`)
}
