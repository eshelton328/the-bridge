// The key figures of the Activity tab (Figma `kpis`, D17 474:584): four of
// the library's `KpiTile`, each its value, label and caption (`panel · kpi
// calls` 474:585), in a row on the desktop and a tablet and two by two on
// the phone, where they show no caption (M15 474:1216). The Activity view
// (D11 `kpis` 444:499) passes its own Figma keys and gap, and its tablet and
// phone figures have no caption in the data. Props only.
import { Grid, KpiTile } from '@eshelton328/component-library-1701'
import type { Viewport } from '../../../lib/screenState.ts'
import { activityLayout, kpiCaption, kpiLayer } from './activityView.ts'

type Kpi = { value: string; label: string; caption?: string | undefined }

export type ToolkitActivityKpisProps = {
  kpis: readonly Kpi[]
  layout: Viewport
  /** The Figma key of a tile; the Activity tab's (`panel · kpi calls`) when not set. */
  layer?: ((kpi: Kpi) => string) | undefined
  /** The gap between the tiles; the Activity tab's when not set (12 in a row, 8 two by two). */
  gap?: '8' | '12' | undefined
}

export function ToolkitActivityKpis({ kpis, layout, layer = kpiLayer, gap }: ToolkitActivityKpisProps) {
  const columns = activityLayout(layout).kpiColumns
  // D17 474:584: four tiles 12 apart; M15 474:1216: two by two, 8 apart.
  return (
    <Grid columns={columns === 4 ? '4' : '2'} gap={gap ?? (columns === 4 ? '12' : '8')} data-figma="kpis">
      {kpis.map((k) => (
        <div key={k.label} data-figma={layer(k)}>
          <KpiTile value={k.value} label={k.label} caption={kpiCaption(k, layout)} />
        </div>
      ))}
    </Grid>
  )
}
