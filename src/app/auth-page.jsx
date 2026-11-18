'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signIn, signUp } from './auth-actions'
import styles from './auth.module.css'

const screens = {
  login: {
    title: 'Masuk',
    description: 'Simpan karya favorit dan ikuti challenge dengan akun ALTERIA.',
    action: 'Masuk',
    question: 'Belum punya akun?',
    link: { href: '/register', label: 'Daftar' },
    artwork: {
      image: '/alteria/woman-with-flowers.jpg',
      alt: 'Lukisan seorang perempuan duduk di samping rangkaian bunga.',
      title: 'A Woman Seated beside a Vase of Flowers',
      artist: 'Edgar Degas, 1865',
    },
  },
  register: {
    title: 'Daftar',
    description: 'Buat akun untuk mulai berbagi karya atau mengelola challenge.',
    action: 'Buat akun',
    question: 'Sudah punya akun?',
    link: { href: '/login', label: 'Masuk' },
    artwork: {
      image: '/alteria/wheat-field.jpg',
      alt: 'Lukisan ladang gandum dengan pohon cemara di bawah langit berawan.',
      title: 'Wheat Field with Cypresses',
      artist: 'Vincent van Gogh, 1889',
    },
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
          <section className={styles.panel} aria-labelledby="auth-title">
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
                  <p className={styles.hint} id="password-hint">Minimal 8 karakter.</p>
                  <PasswordField
                    name="confirmation"
                    label="Konfirmasi kata sandi"
                    autoComplete="new-password"
                  />

                  <fieldset className={styles.roles}>
                    <legend>Daftar sebagai</legend>
                    <div className={styles.roleOptions}>
                      <label className={styles.role}>
                        <input
                          type="radio"
                          name="role"
                          value="member"
                          defaultChecked={feedback?.values.role !== 'curator'}
                        />
                        <span>
                          <strong>Member</strong>
                          <small>Unggah karya dan ikuti challenge.</small>
                        </span>
                      </label>
                      <label className={styles.role}>
                        <input
                          type="radio"
                          name="role"
                          value="curator"
                          defaultChecked={feedback?.values.role === 'curator'}
                        />
                        <span>
                          <strong>Curator</strong>
                          <small>Kelola challenge setelah akun disetujui Admin.</small>
                        </span>
                      </label>
                    </div>
                  </fieldset>
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

          <figure className={styles.artwork}>
            <div className={styles.artworkImage}>
              <Image
                src={screen.artwork.image}
                alt={screen.artwork.alt}
                fill
                sizes="(max-width: 760px) 92vw, 49vw"
              />
            </div>
            <figcaption className={styles.caption}>
              <cite>{screen.artwork.title}</cite>
              <span>{screen.artwork.artist}</span>
            </figcaption>
          </figure>
        </main>
      </div>
    </div>
  )
}
