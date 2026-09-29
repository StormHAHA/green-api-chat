import styles from './Avatar.module.css'

const GRADIENTS = [
  ['#ff8a65', '#ff5a7a'],
  ['#ffc24b', '#ff8a3d'],
  ['#5fd38d', '#20a86a'],
  ['#4fd1e8', '#2c8cf4'],
  ['#6f8cff', '#4a5cf0'],
  ['#b784ff', '#7d4dff'],
  ['#ff85c8', '#e0479e'],
]

function hashString(value: string): number {
  let hash = 0
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash)
}

function getInitials(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '#'
  if (/^\d/.test(words[0]!)) return words.join('').slice(-2)
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

interface AvatarProps {
  title: string
  seed: string
  size?: number
}

export function Avatar({ title, seed, size = 48 }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(seed) % GRADIENTS.length]!

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {getInitials(title)}
    </span>
  )
}
