const COLORS = ['#7b61ff', '#2f80ed', '#27ae60', '#f2994a', '#eb5757', '#9b51e0', '#00a5b8']

export function Avatar({ title }: { title: string }) {
  const hash = [...title].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const letters = title.replace(/[^\p{L}\d]/gu, '').slice(-2)
  return (
    <div className="avatar" style={{ background: COLORS[hash % COLORS.length] }}>
      {letters}
    </div>
  )
}
