import { useLang } from '../i18n.jsx';

// ---- shared helpers (also used by ScholarshipModal) ----

export const statusKey = (s) => String(s.status || 'Varies').toLowerCase();   // open | closed | varies | upcoming

// Fixed date when there is one (shown in Bangladesh time), otherwise the short note
export function formatDeadline(s, lang, t) {
  if (s.deadline) {
    return new Date(s.deadline).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  return s.deadlineNote || t('sch.check');
}

export const levelText = (s) => (Array.isArray(s.level) ? s.level.join(' / ') : s.level || '—');

export function SchStatus({ status }) {
  const { t } = useLang();
  const key = String(status || 'Varies').toLowerCase();
  return <span className={`sch-status ${key}`}>{t(`sch.${key}`)}</span>;
}

export function Flag({ code }) {
  return code
    ? <span className={`fi fi-${code} sch-flag`} aria-hidden="true" />
    : <i className="fa-solid fa-globe sch-flag-fallback" aria-hidden="true" />;
}

// ---- the card ----

function Row({ label, children }) {
  return (
    <div className="sch-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ScholarshipCard({ s, onOpen }) {
  const { t, lang } = useLang();
  const isBup = s.category === 'BUP';

  return (
    <article className="sch-card">
      <header className="sch-card-head">
        <span className={isBup ? 'sch-icon' : 'sch-icon sch-icon-flag'}>
          {isBup ? <i className="fa-solid fa-graduation-cap" aria-hidden="true" /> : <Flag code={s.countryCode} />}
        </span>
        <h3 className="sch-title">{s.title}</h3>
      </header>

      <dl className="sch-meta">
        {isBup ? (
          <>
            <Row label={t('sch.minCgpa')}>{Number(s.minCgpa).toFixed(2)}</Row>
            <Row label={t('sch.amount')}>{s.amount}</Row>
            <Row label={t('sch.type')}>{s.type}</Row>
          </>
        ) : (
          <>
            <Row label={t('sch.country')}>{s.country}</Row>
            <Row label={t('sch.level')}>{levelText(s)}</Row>
            <Row label={t('sch.funding')}>{s.funding}</Row>
            <Row label={t('sch.deadline')}>{formatDeadline(s, lang, t)}</Row>
            <Row label={t('sch.status')}><SchStatus status={s.status} /></Row>
          </>
        )}
      </dl>

      <div className="sch-actions">
        <button type="button" className="btn btn-navy" onClick={() => onOpen(s)}>
          {t('sch.viewDetails')}
        </button>
      </div>
    </article>
  );
}
