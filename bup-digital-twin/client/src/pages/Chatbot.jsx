import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

const SUGGESTIONS = ['s.sch', 's.blood', 's.fac', 's.bus', 's.club'];

export default function Chatbot() {
  const { t, lang } = useLang();
  const [msgs, setMsgs] = useState([{ from: 'bot', text: null, links: [] }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('rules');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (raw) => {
    const m = String(raw).trim();
    if (!m || busy) return;
    setText('');
    setBusy(true);
    const history = msgs
      .filter((x) => x.text)
      .slice(-6)
      .map((x) => ({ role: x.from === 'me' ? 'user' : 'assistant', content: x.text }));
    setMsgs((x) => [...x, { from: 'me', text: m }]);
    try {
      const d = await api('/chat', { method: 'POST', body: { message: m, lang, history } });
      setMode(d.mode || 'rules');
      setMsgs((x) => [...x, { from: 'bot', text: d.reply, links: d.links || [] }]);
    } catch (err) {
      setMsgs((x) => [...x, { from: 'bot', text: err.message, links: [] }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero icon="fa-robot" title={t('chat.title')} sub={t('chat.sub')} />
      <div className="container py-4" style={{ maxWidth: 760 }}>
        <div className="panel">
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text ?? t('chat.hello')}</div>
                {m.links && m.links.length > 0 && (
                  <div className="mt-2">
                    {m.links.map((l) => (/^https?:\/\//.test(l.to)
                      ? <a key={l.to} href={l.to} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-navy me-2 mb-1">{l.label} ↗</a>
                      : <Link key={l.to} to={l.to} className="btn btn-sm btn-navy me-2 mb-1">{l.label} →</Link>))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="chat-bubble bot text-muted">…</div>}
            <div ref={end} />
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS.map((k) => <button key={k} type="button" className="chip" onClick={() => send(t(k))}>{t(k)}</button>)}
          </div>

          <form className="input-group mt-3" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} maxLength={500} />
            <button className="btn btn-gold" aria-label="Send" disabled={busy}><i className="fa-solid fa-paper-plane" /></button>
          </form>
          <p className="small text-muted mt-2 mb-0">{mode === 'ai' ? t('chat.aiNote') : t('chat.note')}</p>
        </div>
      </div>
    </>
  );
}
