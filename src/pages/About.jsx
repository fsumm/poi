export default function About() {
  return (
    <div className="page">
      <div className="page-2col">
        <div className="page-img" />
        <div className="page-body">
          <div className="page-section-label">About</div>
          <p className="page-text">
            Place of Interest is an independent type foundry based in Brooklyn, NY.
            It was founded in 2024 by Felix Summ after years of drawing self-initiated
            typefaces. Get in touch for custom inquiries or to submit a font to the catalog.
          </p>
          <a
            className="btn btn-dark"
            href="mailto:hello@poi.tf"
          >
            hello@poi.tf
          </a>
        </div>
      </div>

      <div className="about-secondary">
        <div>
          <p className="about-secondary-text">
            The name Place of Interest comes from the designated Unicode name for ⌘.
            The oldest recorded ⌘ is 1,600 years old and was discovered in Sweden.
          </p>
          <p className="about-caption" style={{ marginTop: 48 }}>
            ⌘ in use on the design of the Finnish penni
          </p>
        </div>
        <div className="about-secondary-img" />
      </div>
    </div>
  )
}
