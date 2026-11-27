import requirements from '../../data/maintenanceRequirements.json'
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s，。；;、:：()（）【】\[\]_.-]+/g, '')
const entries = Object.entries(requirements).flatMap(([systemName, devices]) =>
  Object.entries(devices).flatMap(([deviceName, checks]) =>
    Object.entries(checks).map(([itemName, detail]) => ({
      systemName, deviceName, itemName, requirement: detail?.['测试方法和要求'] || ''
    }))
  )
)
export function findMaintenanceRequirement(system, item) {
  const s = normalize(system), i = normalize(item)
  if (!s || !i) return ''
  const candidates = entries.map(entry => {
    const device = normalize(entry.deviceName), category = normalize(entry.systemName), check = normalize(entry.itemName)
    const deviceMatch = s === device ? 5 : (s.includes(device) || device.includes(s)) ? 3 : (s.includes(category) || category.includes(s)) ? 1 : 0
    const itemMatch = i === check ? 5 : (i.includes(check) || check.includes(i)) ? 3 : 0
    return { ...entry, score: deviceMatch + itemMatch }
  }).filter(entry => entry.requirement && entry.score >= 6).sort((a,b) => b.score-a.score)
  if (!candidates.length) return ''
  const best = candidates[0]
  if (candidates.length > 1 && candidates[1].score === best.score && candidates[1].requirement !== best.requirement) return ''
  return best.requirement
}
