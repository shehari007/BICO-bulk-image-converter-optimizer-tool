import { common } from './common'
import { welcome } from './welcome'
import { toolbar } from './toolbar'
import { queue } from './queue'
import { settings } from './settings'
import { panels } from './panels'
import { stats } from './stats'
import { appearance } from './appearance'
import { shell } from './shell'

/**
 * The English dictionary, assembled from one file per area of the interface.
 *
 * Splitting it keeps each file reviewable and lets several people work on
 * different areas without colliding. The merge is flat, so a duplicated key
 * across two namespaces silently wins in import order: keep keys prefixed with
 * their area and that cannot happen.
 */
export const en = {
  ...common,
  ...welcome,
  ...toolbar,
  ...queue,
  ...settings,
  ...panels,
  ...stats,
  ...appearance,
  ...shell
} as const
