export default function Alert({ msg }) {
  if (!msg) return null;
  return <div className={`alert alert-${msg.type} py-2 mt-3 mb-0`} role="status">{msg.text}</div>;
}
