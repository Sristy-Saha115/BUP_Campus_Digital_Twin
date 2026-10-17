import { useEffect, useRef, useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { useLang } from '../i18n.jsx';
import { api } from '../api';

export default function Chatbot() {
  const { t, lang } = useLang();
  const [msgs, setMsgs] = useState([{ from: 'bot', text: null }]);
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    const m = text.trim();
    if (!m) return;
    setText('');
    setMsgs((x) => [...x, { from: 'me', text: m }]);
    try {
      const d = await api('/chat', { method: 'POST', body: { message: m, lang } });
      setMsgs((x) => [...x, { from: 'bot', text: d.reply }]);
    } catch (err) {
      setMsgs((x) => [...x, { from: 'bot', text: err.message }]);
    }
  };

  return (
    <>
      <PageHero icon="fa-robot" title={t('chat.title')} sub={t('chat.sub')} />
      <div className="container py-4" style={{ maxWidth: 760 }}>
        <div className="panel">
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from}`}>{m.text ?? t('chat.hello')}</div>
            ))}
            <div ref={end} />
          </div>
          <form className="input-group mt-3" onSubmit={send}>
            <input className="form-control" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} />
            <button className="btn btn-gold" aria-label="Send"><i className="fa-solid fa-paper-plane" /></button>
          </form>
          <p className="small text-muted mt-2 mb-0">{t('chat.note')}</p>
        </div>
      </div>
    </>
  );
}
