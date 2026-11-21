import { activityLabels } from './data/mechanics'

export function activityFromRoll(roll: number): string {
  return activityLabels.find((entry) => roll <= entry.max)?.value ?? activityLabels[activityLabels.length - 1].value
}
