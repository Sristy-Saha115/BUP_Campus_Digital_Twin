export default function PageHero({ icon, title, sub }) {
  return (
    <section className="page-hero">
      <div className="container">
        <h1><i className={`fa-solid ${icon} gold me-2`} />{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}
