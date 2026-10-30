import { useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { Flag, SchStatus, formatDeadline, levelText } from './ScholarshipCard.jsx';

function Section({ title, children }) {
  return (
    <section className="sch-sec">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : 'https://www.bup.edu.bd/');

// Plain React modal (no Bootstrap JS needed). Close with the X, the backdrop or the Esc key.
export default function ScholarshipModal({ s, onClose }) {
  const { t, lang } = useLang();
  const closeRef = useRef(null);
  const isBup = s.category === 'BUP';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const verified = s.lastVerified
    ? new Date(s.lastVerified).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric',
    })
    : '';

  return (
    <div className="sch-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sch-modal" role="dialog" aria-modal="true" aria-labelledby="sch-modal-title">
        <button ref={closeRef} type="button" className="sch-close" aria-label={t('sch.close')} onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className="sch-modal-head">
          <span className={isBup ? 'sch-icon' : 'sch-icon sch-icon-flag'}>
            {isBup ? <i className="fa-solid fa-graduation-cap" aria-hidden="true" /> : <Flag code={s.countryCode} />}
          </span>
          <h3 id="sch-modal-title">{s.title}</h3>
        </div>

        {isBup ? (
          <>
            <Section title={t('sch.eligibility')}>
              <ul>{(s.eligibility || []).map((x) => <li key={x}>{x}</li>)}</ul>
            </Section>
            <Section title={t('sch.amountTitle')}><p>{s.amount}</p></Section>
            <Section title={t('sch.type')}><p>{s.type}</p></Section>
          </>
        ) : (
          <>
            <Section title={t('sch.country')}><p>{s.country}</p></Section>
            <Section title={t('sch.studyLevel')}><p>{levelText(s)}</p></Section>
            <Section title={t('sch.funding')}><p>{s.funding}</p></Section>
            <Section title={t('sch.basicEligibility')}>
              <ul>{(s.eligibility || []).map((x) => <li key={x}>{x}</li>)}</ul>
            </Section>
            <Section title={t('sch.deadline')}>
              <p className="mb-1">{formatDeadline(s, lang, t)} <SchStatus status={s.status} /></p>
            </Section>
          </>
        )}

        {s.note && <Section title={t('sch.note')}><p>{s.note}</p></Section>}

        <p className="sch-source">
          {s.sourceName && <>{t('sch.source')}: {s.sourceName}</>}
          {verified && <> &middot; {t('sch.verified')}: {verified}</>}
        </p>

        <a className="btn btn-navy sch-visit" href={safeUrl(s.applyUrl)} target="_blank" rel="noopener noreferrer">
          {isBup ? t('sch.visitBup') : t('sch.visitSite')} <i className="fa-solid fa-arrow-up-right-from-square ms-1" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
