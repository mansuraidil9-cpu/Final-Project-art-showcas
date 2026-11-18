import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>ALTERIA</h1>
      <nav>
        <ul>
          <li><Link href="/login">Masuk</Link></li>
          <li><Link href="/register">Daftar</Link></li>
        </ul>
      </nav>
    </main>
  )
}