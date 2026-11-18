// The key figures of the Activity tab (Figma `kpis`, D17 474:584): four of
// the library's `KpiTile`, each its value, label and caption (`panel · kpi
// calls` 474:585), in a row on the desktop and a tablet and two by two on
// the phone, where they show no caption (M15 474:1216). Props only.
import { Grid, KpiTile } from '@eshelton328/component-library-1701'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivity } from '../types.ts'
import { activityLayout, kpiCaption, kpiLayer } from './activityView.ts'

export type ToolkitActivityKpisProps = {
  kpis: ToolkitActivity['kpis']
  layout: Viewport
}

export function ToolkitActivityKpis({ kpis, layout }: ToolkitActivityKpisProps) {
  const columns = activityLayout(layout).kpiColumns
  // D17 474:584: four tiles 12 apart; M15 474:1216: two by two, 8 apart.
  return (
    <Grid columns={columns === 4 ? '4' : '2'} gap={columns === 4 ? '12' : '8'} data-figma="kpis">
      {kpis.map((k) => (
        <div key={k.label} data-figma={kpiLayer(k)}>
          <KpiTile value={k.value} label={k.label} caption={kpiCaption(k, layout)} />
        </div>
      ))}
    </Grid>
  )
}
