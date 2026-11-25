'use client'

import { useId } from 'react'
import { reportOptions } from '@/lib/report-options.mjs'
import styles from './artwork-report-fields.module.css'

export default function ArtworkReportFields({
  reportType, details, onReportTypeChange, onDetailsChange, disabled = false,
}) {
  const id = useId()

  return (
    <>
      <fieldset className={styles.choices} disabled={disabled}>
        <legend className={styles.legend}>Alasan laporan</legend>
        {reportOptions.map(option => (
          <label key={option.value} className={styles.choice} htmlFor={`${id}-${option.value}`}>
            <input
              id={`${id}-${option.value}`}
              type="radio"
              name="reportType"
              value={option.value}
              checked={reportType === option.value}
              onChange={event => onReportTypeChange(event.target.value)}
              required
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <label className={styles.detailField}>
        Detail tambahan {reportType === 'other' ? '(wajib)' : '(opsional)'}
        <textarea
          name="details"
          value={details}
          onChange={event => onDetailsChange(event.target.value)}
          placeholder="Jelaskan singkat alasan laporan Anda..."
          maxLength={300}
          rows={3}
          required={reportType === 'other'}
          disabled={disabled}
        />
        <small>{details.length}/300</small>
      </label>
    </>
  )
}
