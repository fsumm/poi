const { useEffect, useMemo, useState } = React;
const h = React.createElement;

const fonts = [
  {
    id: "aeronaut",
    name: "Aeronaut",
    mark: "RtxO+",
    image: "/public/assets/images/aeronaut-building.jpg",
    family: "POI Aeronaut",
    span: "span-4",
    detail: "This geometric sans, inspired by cursive practice sheets, brings warmth and whimsy to a genre that historically lacks it. Arrows, originally intended to guide the student's hand, draw parallels to aerodynamics, the typeface's namesake. Best suited for expressive messaging, Aeronaut includes 12 stylistic sets, giving you full creative control.",
    specimen: ["Aeronaut", "Xx5sv"]
  },
  {
    id: "carbonic",
    name: "Carbonic",
    mark: "olpw4",
    image: "/public/assets/images/carbonic-tiles.jpg",
    family: "POI Carbonic",
    span: "span-2",
    detail: "A compact superfamily with a restless italic, Carbonic is built for signage, captions, and sturdy text systems that need a little voltage.",
    specimen: ["Carbonic", "ap09k"]
  },
  {
    id: "orbiter",
    name: "Orbiter",
    mark: "95o-q",
    image: "/public/assets/images/orbiter-rooftop.jpg",
    family: "POI Orbiter",
    span: "span-2",
    detail: "Orbiter is a strong grotesk variable family with heavy forms, sharp terminals, and a slant axis tuned for kinetic display typography.",
    specimen: ["Orbiter", "Rr204"]
  },
  {
    id: "diode",
    name: "Diode",
    mark: "x7Ls8",
    image: "/public/assets/images/diode-street.jpg",
    family: "POI Diode",
    span: "span-2",
    detail: "Diode pushes simple forms into blocky, utilitarian texture, from thin engineering labels to oversized black display settings.",
    specimen: ["Diode", "0nA48"]
  }
];

const routes = {
  "#/": "catalog",
  "#/catalog": "catalog",
  "#/contact": "contact",
  "#/about": "about",
  "#/trials": "trials",
  "#/tester": "tester",
  "#/newsletter": "newsletter"
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Link({ to, children, className }) {
  return h("a", { href: to, className }, children);
}

function Header() {
  return h("header", { className: "site-header" },
    h(Link, { to: "#/", className: "brand-mark", children: "⌘" }),
    h("nav", { className: "main-nav", "aria-label": "Primary" },
      h(Link, { to: "#/catalog", children: "Catalog" }),
      h(Link, { to: "#/contact", children: "Contact" }),
      h(Link, { to: "#/about", children: "About" }),
      h(Link, { to: "#/trials", children: "Trials" })
    ),
    h(Link, { to: "#/cart", className: "cart-link", children: "Cart" })
  );
}

function Footer({ legal = false }) {
  return h("footer", { className: "site-footer" },
    h("strong", null, "Place of Interest"),
    h(Link, { to: "#/trials", children: "License" }),
    h("a", { href: "https://www.instagram.com/", target: "_blank", rel: "noreferrer" }, legal ? "Privacy" : "Instagram"),
    h("a", { href: "#/legal" }, legal ? "Cookies" : "Legal"),
    h(Link, { to: "#/newsletter", children: legal ? "Legal" : "Newsletter" })
  );
}

function Catalog() {
  return h("main", { className: "catalog grid-10" },
    fonts.map((font, index) => h("article", {
      className: cx("font-card", font.span, `card-${index + 1}`),
      key: font.id
    },
      h(Link, { to: `#/${font.id}`, className: "font-card-link" },
        h("figure", { className: "image-type-card" },
          h("img", { src: font.image, alt: `${font.name} specimen photograph` }),
          h("figcaption", { className: "photo-mark", style: { fontFamily: font.family } }, font.mark)
        ),
        h("h2", null, h("span", null, "⌘"), " ", font.name)
      )
    ))
  );
}

function FontDetail({ font }) {
  return h("main", { className: "font-detail" },
    h("section", { className: "detail-intro grid-10" },
      h("img", { className: "detail-image span-4", src: font.image, alt: `${font.name} specimen photograph` }),
      h("div", { className: "detail-copy span-3" },
        h("h1", null, h("span", null, "⌘"), " ", font.name),
        h("p", { className: "big-aa", style: { fontFamily: font.family } }, font.id === "aeronaut" ? "Aa" : font.name.slice(0, 2)),
        h("p", null, font.detail)
      ),
      h("div", { className: "detail-actions span-2" },
        h("button", { className: "pill black" }, "Download Trial"),
        h("button", { className: "pill blue" }, "Buy")
      )
    ),
    h("section", { className: "specimens", style: { fontFamily: font.family } },
      h("p", null, font.specimen[0]),
      h("p", null, font.specimen[1])
    ),
    h("section", { className: "detail-tester grid-10" },
      h("h2", { className: "span-2" }, "Type tester"),
      h(Link, { to: "#/tester", className: "tester-link span-2", children: "Open tester" })
    )
  );
}

function About() {
  return h("main", { className: "info-page grid-10" },
    h("img", { className: "info-image span-2", src: "/public/assets/images/about-portrait.jpg", alt: "Portrait of Felix Summa" }),
    h("section", { className: "info-copy span-2" },
      h("h1", null, "About"),
      h("p", null, "Place of Interest is an independent type foundry based in Brooklyn, NY. It was founded in 2024 by Felix Summa after years of drawing self-initiated typefaces. Get in touch for custom inquiries or to submit a font to the catalog."),
      h("a", { className: "pill black email-pill", href: "mailto:hello@poi.tf" }, "hello@poi.tf")
    ),
    h("img", { className: "info-image span-2 about-coin", src: "/public/assets/images/about-coin.jpg", alt: "Finnish penni with command symbol" }),
    h("section", { className: "info-copy span-2 coin-copy" },
      h("p", null, "The name Place of Interest refers to the registered Unicode name for ⌘. The oldest recorded ⌘ is 1,600 years old and was discovered in Sweden."),
      h("p", { className: "muted" }, "⌘ used in the design of the Finnish penni")
    )
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText("hello@poi.tf");
    setCopied(true);
  };

  return h("main", { className: "info-page contact-page grid-10" },
    h("div", { className: "contact-art span-2", "aria-hidden": "true" },
      h("div", { className: "tilted-card" },
        h("span", null, "⌘"),
        h("strong", null, "Place of Interest")
      )
    ),
    h("section", { className: "info-copy span-3" },
      h("h1", null, "Contact"),
      h("p", null, "We’re open for custom projects, collaborations, and modifications to the catalog. Have a font ready for retail release? We’d love to see that too."),
      h("button", { className: cx("pill email-pill", copied ? "blue" : "black"), onClick: copy },
        h("span", { className: "tooltip" }, copied ? "Copied" : "Copy"),
        "hello@poi.tf"
      )
    )
  );
}

function Trials() {
  return h("main", { className: "info-page trials-page grid-10" },
    h("img", { className: "info-image span-2", src: "/public/assets/images/trial-sheets.jpg", alt: "Trial font print specimens" }),
    h("section", { className: "info-copy span-4" },
      h("h1", null, "Trials"),
      h("p", null, "Trial fonts include the complete character set and all OpenType features. Perfect for client pitches, personal projects, and student work."),
      h("label", { className: "check-row" },
        h("input", { type: "checkbox", defaultChecked: true }),
        h("span", null),
        h("strong", null, "I agree to the ", h("a", { href: "#/license" }, "trial license terms"))
      ),
      h("label", { className: "check-row" },
        h("input", { type: "checkbox" }),
        h("span", null),
        h("strong", null, "Subscribe to the newsletter")
      ),
      h("button", { className: "pill disabled" }, "Submit")
    )
  );
}

function Newsletter() {
  return h("main", { className: "newsletter-page grid-10" },
    h("img", { className: "span-2 newsletter-image", src: "/public/assets/images/newsletter-tower.jpg", alt: "Transmission tower in green grass" }),
    h("form", { className: "newsletter-form span-3" },
      h("h1", null, "Sign up to the newsletter"),
      h("input", { placeholder: "Your name", "aria-label": "Your name" }),
      h("input", { type: "email", placeholder: "Your email", "aria-label": "Your email" }),
      h("label", { className: "check-row" },
        h("input", { type: "checkbox" }),
        h("span", null),
        h("strong", null, "I wish to subscribe to the newsletter")
      ),
      h("button", { className: "pill blue", type: "button" }, "Submit")
    )
  );
}

function Tester() {
  const [weight, setWeight] = useState(650);
  const [slant, setSlant] = useState(0);
  const orbiterStyle = useMemo(() => ({
    fontFamily: "POI Orbiter VF",
    fontVariationSettings: `"wght" ${weight}, "slnt" ${slant}`
  }), [weight, slant]);

  return h("main", { className: "tester-page" },
    h("section", { className: "tester-row grid-10" },
      h("div", { className: "tester-label span-2" }, "POI Aeronaut Regular"),
      h("h1", { className: "tester-sample span-8", style: { fontFamily: "POI Aeronaut" }, contentEditable: true, suppressContentEditableWarning: true }, "Aeronaut")
    ),
    h("section", { className: "tester-row grid-10" },
      h("div", { className: "tester-label span-2" }, "POI Orbiter VF SemiBold"),
      h("div", { className: "feature-panel span-2" },
        h("h2", null, "OpenType features"),
        h("label", { className: "check-row small" }, h("input", { type: "checkbox" }), h("span", null), h("strong", null, "Single-story a")),
        h("label", { className: "check-row small" }, h("input", { type: "checkbox" }), h("span", null), h("strong", null, "Slashed zero"))
      ),
      h("div", { className: "axes-panel span-3" },
        h("h2", null, "Axes"),
        h("label", null, "Weight", h("input", { type: "range", min: 400, max: 900, value: weight, onChange: e => setWeight(e.target.value) })),
        h("label", null, "Slant", h("input", { type: "range", min: -12, max: 0, value: slant, onChange: e => setSlant(e.target.value) }))
      ),
      h("p", { className: "tester-sample orbiter span-7", style: orbiterStyle, contentEditable: true, suppressContentEditableWarning: true }, "Orbiter")
    )
  );
}

function App() {
  const [hash, setHash] = useState(location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(location.hash || "#/");
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const font = fonts.find(item => hash === `#/${item.id}`);
  const route = routes[hash] || (font ? "font" : "catalog");

  return h(React.Fragment, null,
    route !== "tester" && h(Header),
    route === "catalog" && h(Catalog),
    route === "font" && h(FontDetail, { font }),
    route === "about" && h(About),
    route === "contact" && h(Contact),
    route === "trials" && h(Trials),
    route === "newsletter" && h(Newsletter),
    route === "tester" && h(Tester),
    route !== "catalog" && route !== "tester" && h(Footer, { legal: route === "trials" })
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
