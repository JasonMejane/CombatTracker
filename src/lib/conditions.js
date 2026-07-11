export const CONDITIONS = [
  { key: 'blinded', label: 'Blinded', emoji: '🙈' },
  { key: 'charmed', label: 'Charmed', emoji: '💘' },
  { key: 'deafened', label: 'Deafened', emoji: '🔇' },
  { key: 'frightened', label: 'Frightened', emoji: '😱' },
  { key: 'grappled', label: 'Grappled', emoji: '✊' },
  { key: 'incapacitated', label: 'Incapacitated', emoji: '💫' },
  { key: 'invisible', label: 'Invisible', emoji: '👻' },
  { key: 'paralyzed', label: 'Paralyzed', emoji: '⚡' },
  { key: 'petrified', label: 'Petrified', emoji: '🪨' },
  { key: 'poisoned', label: 'Poisoned', emoji: '🤢' },
  { key: 'prone', label: 'Prone', emoji: '⬇️' },
  { key: 'restrained', label: 'Restrained', emoji: '⛓️' },
  { key: 'stunned', label: 'Stunned', emoji: '😵' },
  { key: 'unconscious', label: 'Unconscious', emoji: '😴' },
  { key: 'concentration', label: 'Concentration', emoji: '🎯' },
]

const byKey = new Map(CONDITIONS.map((c) => [c.key, c]))

export function conditionEmoji(key) {
  return byKey.get(key)?.emoji ?? ''
}

export function conditionLabel(key) {
  return byKey.get(key)?.label ?? key
}
