'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { newPasswordPattern } from '../lib/account-validation.mjs'
import { signIn, signUp } from './auth-actions'
import HomeLink from './home-link'
import styles from './auth.module.css'
import LoginAtmosphere from './login/login-atmosphere'

const screens = {
  login: {
    title: 'Masuk',
    description: 'Simpan karya favorit dan ikuti challenge dengan akun ALTERIA.',
    action: 'Masuk',
    question: 'Belum punya akun?',
    link: { href: '/register', label: 'Daftar' },
  },
  register: {
    title: 'Daftar',
    description: 'Buat akun ALTERIA untuk memamerkan karya, menyimpan favorit, dan mengikuti challenge.',
    action: 'Buat akun',
    question: 'Sudah punya akun?',
    link: { href: '/login', label: 'Masuk' },
  },
}

function PasswordField({ name, label, autoComplete, minLength, hintId }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <div className={styles.password}>
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={128}
          pattern={autoComplete === 'new-password' ? newPasswordPattern : undefined}
          aria-describedby={hintId}
          required
        />
        <button
          type="button"
          aria-label={`${visible ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`}
          onClick={() => setVisible(value => !value)}
        >
          {visible ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>
    </div>
  )
}

export default function AuthPage({ variant }) {
  const screen = screens[variant]
  const registering = variant === 'register'
  const [feedback, submit, pending] = useActionState(registering ? signUp : signIn, null)
  const login = !registering

  return (
    <div className={`${styles.screen} ${styles.loginScreen}`}>
      <LoginAtmosphere />
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <HomeLink />
        </header>

        <main className={`${styles.content} ${styles.loginContent}`}>
          <section
            className={`${styles.panel} ${styles.formPanel} ${styles.loginCard} ${registering ? styles.registerCard : ''}`}
            aria-labelledby="auth-title"
            onPointerMove={event => {
              const bounds = event.currentTarget.getBoundingClientRect()
              event.currentTarget.style.setProperty('--mx', `${event.clientX - bounds.left}px`)
              event.currentTarget.style.setProperty('--my', `${event.clientY - bounds.top}px`)
            }}
          >
            <h1 id="auth-title">{screen.title}</h1>
            <p className={styles.intro}>{screen.description}</p>

            <form className={styles.form} action={submit}>
              {registering && (
                <div className={styles.field}>
                  <label htmlFor="displayName">Nama tampilan</label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    defaultValue={feedback?.values.displayName}
                    maxLength={120}
                    required
                  />
                </div>
              )}

              {registering && (
                <div className={styles.field}>
                  <label htmlFor="role">Daftar sebagai</label>
                  <select id="role" name="role" defaultValue={feedback?.values.role || 'member'} required>
                    <option value="member">Member</option>
                    <option value="curator">Curator</option>
                  </select>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete={registering ? 'email' : 'username'}
                  defaultValue={feedback?.values.email}
                  maxLength={254}
                  required
                />
              </div>

              <PasswordField
                name="password"
                label="Kata sandi"
                autoComplete={registering ? 'new-password' : 'current-password'}
                minLength={registering ? 8 : undefined}
                hintId={registering ? 'password-hint' : undefined}
              />

              {registering && (
                <>
                  <p className={styles.hint} id="password-hint">8 sampai 128 karakter tanpa spasi atau karakter tak terlihat.</p>
                  <PasswordField
                    name="confirmation"
                    label="Konfirmasi kata sandi"
                    autoComplete="new-password"
                  />
                </>
              )}

              <button className={styles.submit} type="submit" disabled={pending}>
                {pending ? 'Memproses…' : screen.action}
              </button>
              {feedback && (
                <p className={styles.feedback} role="alert">{feedback.error}</p>
              )}
            </form>

            <p className={styles.switch}>
              {screen.question} <Link href={screen.link.href}>{screen.link.label}</Link>
            </p>
          </section>

          <aside className={`${styles.accountInfo} ${styles.loginEditorial}`} aria-labelledby="account-info-heading">
            <h2 id="account-info-heading">{registering ? 'Mulai Ruang Karyamu.' : 'Apa itu ALTERIA?'}</h2>
            {login ? (
              <>
                <p>ALTERIA adalah ruang galeri digital untuk merayakan karya, menemukan kreator, dan bertemu lewat challenge seni yang dikurasi.</p>
                <ul className={styles.loginBulletList}>
                  <li>Jelajahi karya dari berbagai kreator.</li>
                  <li>Simpan karya favorit dalam koleksi personal.</li>
                  <li>Ikuti challenge seni pilihan Curator.</li>
                </ul>
              </>
            ) : (
              <>
                <p>Bangun ruang kreatifmu di ALTERIA—tempat karya, penikmat seni, dan kesempatan berkarya bertemu.</p>
                <ul className={styles.loginBulletList}>
                  <li>Pamerkan karya lintas medium dalam ruang kurasi digital.</li>
                  <li>Ikuti challenge berkala yang dikurasi langsung oleh Curator.</li>
                  <li>Simpan karya favorit dan ajukan akses Curator dari dashboard.</li>
                </ul>
              </>
            )}
          </aside>
        </main>
      </div>
    </div>
  )
}
