import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccountPanel from '@/app/account-panel'
import ActionForm from '@/app/dashboard/action-form'
import SubmissionCards from '@/app/challenge/submission-cards'
import { getChallengeById, getChallengeSubmissions } from '@/lib/challenges'
import { challengeStatusLabels } from '@/lib/challenge-dates'
import { requireUser } from '@/lib/session'
import { announceWinners, removeChallenge, saveChallenge } from '../../challenge-actions'
import ChallengeFields from '../../challenge-fields'
import styles from '../../../member/member-artworks.module.css'

export default async function ManageChallenge({ params }) {
  const user = await requireUser('curator')
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge || challenge.curatorId !== user.id) notFound()

  const submissions = await getChallengeSubmissions(id)

  return (
    <AccountPanel title={challenge.title} description={challengeStatusLabels[challenge.status]} wide>
      <div className={styles.formActions}>
        <Link href="/dashboard/curator">Kembali ke Kelola Challenge</Link>
        <Link href={`/challenge/${id}`}>Lihat halaman publik</Link>
      </div>

      <section className={styles.section} aria-labelledby="edit-challenge">
        <header className={styles.sectionHeader}><h2 id="edit-challenge">Edit Challenge</h2></header>
        <ActionForm action={saveChallenge.bind(null, id)} submitLabel="Simpan perubahan">
          <ChallengeFields challenge={challenge} />
        </ActionForm>
      </section>

      <section className={styles.section} aria-labelledby="peserta-challenge">
        <header className={styles.sectionHeader}><h2 id="peserta-challenge">Karya Peserta</h2></header>
        {submissions.length ? <SubmissionCards submissions={submissions} /> : <p className={styles.empty}>Belum ada peserta.</p>}
        {challenge.status !== 'ended' && <p className={styles.hint}>Pemenang dapat dipilih setelah tenggat.</p>}
        {challenge.status === 'ended' && submissions.length > 0 && (
          <ActionForm action={announceWinners.bind(null, id)} submitLabel="Umumkan pemenang">
            {[1, 2, 3].map(rank => (
              <div className={styles.field} key={rank}>
                <label htmlFor={`winner-${rank}`}>Juara {rank}</label>
                <select id={`winner-${rank}`} name={`rank-${rank}`} defaultValue={submissions.find(item => item.rank === rank)?.id ?? ''}>
                  <option value="">Pilih karya</option>
                  {submissions.map(item => <option key={item.id} value={item.id}>{item.title} · {item.artist}</option>)}
                </select>
              </div>
            ))}
          </ActionForm>
        )}
      </section>

      <section className={styles.section} aria-labelledby="hapus-challenge">
        <header className={styles.sectionHeader}><h2 id="hapus-challenge">Hapus Challenge</h2></header>
        <ActionForm action={removeChallenge.bind(null, id)} submitLabel="Hapus challenge" danger>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirmed" value="yes" required />
            Hapus challenge ini beserta submisi dan hasilnya.
          </label>
        </ActionForm>
      </section>
    </AccountPanel>
  )
}
