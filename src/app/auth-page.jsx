'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { newPasswordPattern } from '../lib/account-validation.mjs'
import { signIn, signUp } from './auth-actions'
import styles from './auth.module.css'

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
    description: 'Buat akun Member. Kamu bisa mengajukan peran Curator dari dashboard.',
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

  return (
    <div className={styles.screen}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/">ALTERIA</Link>
          <Link className={styles.back} href="/">Kembali ke beranda</Link>
        </header>

        <main className={styles.content}>
          <section className={`${styles.panel} ${styles.formPanel}`} aria-labelledby="auth-title">
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

          <aside className={styles.accountInfo} aria-labelledby="account-info-heading">
            <h2 id="account-info-heading">Apa itu ALTERIA?</h2>
            <p>ALTERIA adalah galeri seni digital untuk menjelajahi karya dan mengenal kreator di baliknya.</p>
            <p>Kreator bisa memamerkan karya dan mengikuti challenge seni yang diadakan Curator.</p>
          </aside>
        </main>
      </div>
    </div>
  )
}
