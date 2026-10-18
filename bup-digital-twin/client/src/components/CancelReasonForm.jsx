import { useState } from 'react';
import { useLang } from '../i18n.jsx';

// Inline "reason for cancellation" form shared by the student and faculty panels.
// onConfirm(reason) must return a promise; the parent closes the form when it succeeds.
export default function CancelReasonForm({ label, onConfirm, onBack }) {
  const { t } = useLang();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (reason.trim().length < 3) { setError(t('fd.reasonRequired')); return; }
    setBusy(true);
    setError('');
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <>
      <label className="form-label small mb-1">{label}</label>
      <div className="input-group">
        <input
          className="form-control"
          value={reason}
          maxLength={300}
          autoFocus
          onChange={(e) => { setReason(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn btn-danger" disabled={busy} onClick={submit}>{t('fd.confirmCancel')}</button>
        <button className="btn btn-outline-secondary" disabled={busy} onClick={onBack}>{t('fd.back')}</button>
      </div>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </>
  );
}
