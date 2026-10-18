// Bangladesh time, so "today" is the same for everyone and matches the server
export const todayDhaka = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });   // YYYY-MM-DD

export const formatDateTime = (value, lang) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short',
  });
};
