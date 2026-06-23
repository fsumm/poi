import { useState, useEffect, useRef, useCallback } from 'react'

const STORE_URL = 'https://store.poi.tf/graphql'

// Standard OT feature labels; supplemented by stylisticSetNames from the API
const FEATURE_LABELS = {
  liga: 'Standard Ligatures',
  dlig: 'Discretionary Ligatures',
  calt: 'Contextual Alternates',
  case: 'Case-Sensitive Forms',
  frac: 'Fractions',
  ordn: 'Ordinals',
  sups: 'Superscript',
  subs: 'Subscript',
  tnum: 'Tabular Numbers',
  onum: 'Oldstyle Figures',
  lnum: 'Lining Figures',
  pnum: 'Proportional Figures',
  smcp: 'Small Capitals',
  c2sc: 'Capitals to Small Caps',
  zero: 'Slashed Zero',
  swsh: 'Swash',
  titl: 'Titling Alternates',
  hist: 'Historical Forms',
  salt: 'Stylistic Alternates',
}

const FONT_STYLE_FIELDS = `
  id name cssFamily cssWeight cssStyle
  webfontSources { url format }
  fontFeatures {
    supportedFeatures
    stylisticSetNames { featureName humanName }
  }
  variableAxes { axis name minValue maxValue }
  variableInstances { name coordinates { axis value } }
`

const QUERY_BY_SLUG = `query POITypeTesterBySlug($slug: String!) {
  viewer {
    slug(name: $slug) {
      collection: fontCollection {
        typeTesters(first: 999) {
          edges { node { content fontStyle { ${FONT_STYLE_FIELDS} } } }
        }
      }
    }
  }
}`

const QUERY_BY_ID = `query POITypeTesterById($id: ID!) {
  node(id: $id) {
    ... on FontCollection {
      typeTesters(first: 999) {
        edges { node { content fontStyle { ${FONT_STYLE_FIELDS} } } }
      }
    }
  }
}`

// ── Data fetching ─────────────────────────────────────────────────────────────

function parseEdges(edges) {
  const seen = new Set()
  const result = []
  for (const { node } of edges) {
    const fs = node?.fontStyle
    if (!fs || seen.has(fs.id)) continue
    seen.add(fs.id)
    result.push({ ...fs, defaultContent: node.content ?? 'Type something' })
  }
  return result
}

function useFontData(collectionSlug, collectionId) {
  const [styles, setStyles] = useState(null)
  useEffect(() => {
    const [query, variables] = collectionId
      ? [QUERY_BY_ID, { id: collectionId }]
      : [QUERY_BY_SLUG, { slug: collectionSlug }]

    fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
      .then(r => r.json())
      .then(({ data }) => {
        const edges = collectionId
          ? (data?.node?.typeTesters?.edges ?? [])
          : (data?.viewer?.slug?.collection?.typeTesters?.edges ?? [])
        setStyles(parseEdges(edges))
      })
      .catch(console.error)
  }, [collectionSlug, collectionId])
  return styles
}

// Load a web font via the FontFace API, returns true when ready
function useFontFace(cssFamily, webfontSources, cssWeight, cssStyle) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!cssFamily || !webfontSources?.length) return
    let cancelled = false
    const faces = webfontSources.map(src =>
      new FontFace(cssFamily, `url("${src.url}")`, {
        weight: String(cssWeight ?? 400),
        style: cssStyle ?? 'normal',
      })
    )
    // Add before loading so document.fonts tracks the load in its status/ready promise
    faces.forEach(f => document.fonts.add(f))
    Promise.all(faces.map(f => f.load()))
      .then(() => { if (!cancelled) setLoaded(true) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [cssFamily, cssWeight, cssStyle])
  return loaded
}

// ── Autofit ───────────────────────────────────────────────────────────────────

// Scales font size so text fills the container width.
// Uses a hidden measurement span at a fixed reference size to avoid feedback loops.
function useAutofit(containerRef, text, fontFamily, fontLoaded) {
  const [fontSize, setFontSize] = useState(null)
  const measureRef = useRef(null)

  // Create / recycle the hidden measurement span
  useEffect(() => {
    const span = document.createElement('span')
    span.style.cssText = [
      'position:fixed', 'top:-9999px', 'left:-9999px',
      'white-space:nowrap', 'font-size:100px', 'pointer-events:none', 'visibility:hidden',
    ].join(';')
    document.body.appendChild(span)
    measureRef.current = span
    return () => span.remove()
  }, [])

  const fit = useCallback(() => {
    const container = containerRef.current
    const span = measureRef.current
    if (!container || !span || !fontLoaded || !fontFamily) return
    span.style.fontFamily = `"${fontFamily}", sans-serif`
    span.textContent = text || ' '
    const textW = span.offsetWidth
    const containerW = container.clientWidth
    if (!textW || !containerW) return
    const target = Math.floor((containerW / textW) * 100)
    setFontSize(Math.min(300, Math.max(12, target)))
  }, [text, fontFamily, fontLoaded])

  useEffect(() => { fit() }, [fit])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(fit)
    ro.observe(container)
    return () => ro.disconnect()
  }, [fit])

  return [fontSize, setFontSize]
}

// ── Slider with value pill ────────────────────────────────────────────────────

function SliderControl({ label, min, max, step = 1, value, onChange }) {
  const [draft, setDraft] = useState(null) // null = not editing

  function commit(str) {
    const raw = Number(str)
    if (!isNaN(raw) && str.trim() !== '') onChange(Math.min(max, Math.max(min, raw)))
    setDraft(null)
  }

  return (
    <div className="tt-slider">
      <span className="tt-slider-label">{label}</span>
      <input
        type="number"
        className="tt-slider-value"
        value={draft ?? Math.round(value)}
        onChange={e => setDraft(e.target.value)}
        onFocus={e => { setDraft(String(Math.round(value))); e.target.select() }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.target.blur(); return }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            setTimeout(() => {
              const raw = Number(e.target.value)
              if (!isNaN(raw)) {
                const clamped = Math.min(max, Math.max(min, raw))
                setDraft(String(clamped))
                onChange(clamped)
              }
            }, 0)
          }
        }}
      />
      <input
        type="range"
        className="tt-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

// ── OT Features panel ─────────────────────────────────────────────────────────

function FeaturesPanel({ features, enabled, onToggle }) {
  return (
    <div className="tt-features">
      <div className="tt-features-heading">OpenType Features</div>
      <div className="tt-features-grid">
        {features.map(feat => (
          <button
            key={feat.tag}
            className="tt-feature-item"
            type="button"
            onClick={() => onToggle(feat.tag)}
          >
            <span className="tt-bullet" data-checked={enabled.has(feat.tag) ? 'true' : 'false'} />
            <span className="tt-feature-label">{feat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function axisDefault(axis, defaultWeight) {
  if (axis.axis === 'wght') {
    const v = defaultWeight ?? 300
    return v >= axis.minValue && v <= axis.maxValue ? v : axis.minValue
  }
  return axis.minValue <= 0 && 0 <= axis.maxValue ? 0 : axis.minValue
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TypeTester({ collectionSlug, collectionId, defaultStyleName, defaultWeight }) {
  const styles = useFontData(collectionSlug, collectionId)

  const [selectedId, setSelectedId] = useState(null)
  // text is used only for autofit measurement — never fed back into the DOM
  const [text, setText] = useState('')
  const [tracking, setTracking] = useState(0)
  const [enabledFeatures, setEnabledFeatures] = useState(new Set())
  const [axisValues, setAxisValues] = useState({})

  const containerRef = useRef(null)
  // Uncontrolled ref for the contenteditable — React never sets its children,
  // so the cursor position is never reset mid-word.
  const textAreaRef = useRef(null)

  // Select first style once data loads
  const style = styles?.find(s => s.id === selectedId) ?? styles?.[0] ?? null

  useEffect(() => {
    if (styles?.length && !selectedId) {
      const preferred = defaultStyleName
        ? (styles.find(s => s.name === defaultStyleName) ?? styles[0])
        : styles[0]
      setSelectedId(preferred.id)
      const initial = preferred.defaultContent ?? ''
      setText(initial)
      if (textAreaRef.current) textAreaRef.current.textContent = initial
      const defaults = {}
      preferred.variableAxes?.forEach(a => { defaults[a.axis] = axisDefault(a, defaultWeight) })
      setAxisValues(defaults)
    }
  }, [styles])

  // When style changes, reset text and axes
  useEffect(() => {
    if (!style) return
    const initial = style.defaultContent ?? ''
    setText(initial)
    if (textAreaRef.current) textAreaRef.current.textContent = initial
    const defaults = {}
    style.variableAxes?.forEach(a => { defaults[a.axis] = axisDefault(a, defaultWeight) })
    setAxisValues(defaults)
    setEnabledFeatures(new Set())
  }, [style?.id])

  const fontLoaded = useFontFace(style?.cssFamily, style?.webfontSources, style?.cssWeight, style?.cssStyle)
  const [fontSize, setFontSize] = useAutofit(containerRef, text ?? '', style?.cssFamily, fontLoaded)

  // The contenteditable ref is only available after fontLoaded triggers the full UI render.
  // Re-populate it here since the earlier effects ran while it was still null.
  useEffect(() => {
    if (fontLoaded && textAreaRef.current) {
      textAreaRef.current.textContent = text
    }
  }, [fontLoaded])

  // Build feature list with human names from API
  const features = style ? (style.fontFeatures?.supportedFeatures ?? []).map(tag => {
    const apiName = style.fontFeatures?.stylisticSetNames?.find(s => s.featureName === tag)?.humanName
    return { tag, name: apiName ?? FEATURE_LABELS[tag] ?? tag }
  }) : []

  // CSS for the rendered text
  const fontFeatureSettings = enabledFeatures.size > 0
    ? [...enabledFeatures].map(t => `"${t}" 1`).join(', ')
    : 'normal'

  const fontVariationSettings = Object.keys(axisValues).length > 0
    ? Object.entries(axisValues).map(([k, v]) => `"${k}" ${v}`).join(', ')
    : 'normal'

  const textStyle = style ? {
    fontFamily: fontLoaded ? `"${style.cssFamily}", sans-serif` : 'sans-serif',
    fontWeight: style.cssWeight,
    fontStyle: style.cssStyle,
    fontSize: fontSize ? `${fontSize}px` : '0px',
    letterSpacing: `${tracking}em`,
    fontFeatureSettings,
    fontVariationSettings,
    lineHeight: 1.1,
    // No letter-spacing transition: while dragging the tracking slider it would
    // animate (reflowing every frame), and with the now-visible overflowing text
    // each reflow is costly. Applying tracking instantly matches the Size slider.
  } : {}

  function toggleFeature(tag) {
    setEnabledFeatures(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  if (!styles || !fontLoaded) return <div className="tt-loading" data-anim-pending />

  const hasAxes = (style?.variableAxes?.length ?? 0) > 0
  const hasFeatures = features.length > 0
  const multiStyle = styles.length > 1
  // Named instances from the variable font (e.g. Thin, Light, Bold…)
  const instances = style?.variableInstances ?? []
  const hasInstances = instances.length > 0

  // Derive which instance is currently selected by matching axis values
  const activeInstanceName = hasInstances
    ? (instances.find(inst =>
        inst.coordinates.every(c => axisValues[c.axis] === c.value)
      )?.name ?? null)
    : null

  function selectInstance(inst) {
    const next = {}
    inst.coordinates.forEach(c => { next[c.axis] = c.value })
    setAxisValues(next)
  }

  return (
    // Keep gating the page-enter animation until autofit has measured the text
    // (fontSize is null until then, when the text renders at 0px). This carries
    // the [data-anim-pending] gate seamlessly on from the loading placeholder.
    <div className="tt" data-anim-pending={fontSize == null ? '' : undefined}>
      {/* ── Text area ───────────────────────────────────────── */}
      <div className="tt-text-wrap" ref={containerRef}>
        <div
          ref={textAreaRef}
          className="tt-text"
          style={textStyle}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={e => setText(e.currentTarget.textContent)}
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="tt-toolbar">
      <div className="tt-toolbar-row">
        {/* Style selector: instances (VF), multi-style, or static name */}
        {hasInstances ? (
          <div className="tt-style-selector">
            {instances.map(inst => (
              <button
                key={inst.name}
                className={`tt-style-pill${inst.name === activeInstanceName ? ' active' : ''}`}
                onClick={() => selectInstance(inst)}
                type="button"
              >
                {inst.name}
              </button>
            ))}
          </div>
        ) : multiStyle ? (
          <div className="tt-style-selector">
            {styles.map(s => (
              <button
                key={s.id}
                className={`tt-style-pill${s.id === style?.id ? ' active' : ''}`}
                onClick={() => { setSelectedId(s.id); setText(s.defaultContent) }}
                type="button"
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : (
          <span className="tt-name">{style?.name}</span>
        )}

        {/* Right-side controls */}
        <div className="tt-controls">
          {/* Size slider */}
          <SliderControl
            label="Size"
            min={12} max={300}
            value={fontSize ?? 120}
            onChange={setFontSize}
          />

          {/* Tracking slider */}
          <SliderControl
            label="Tracking"
            min={-100} max={100} step={1}
            value={Math.round(tracking * 1000)}
            onChange={v => setTracking(v / 1000)}
          />

          {/* Variable axes */}
          {hasAxes && style.variableAxes.map(axis => (
            <SliderControl
              key={axis.axis}
              label={axis.name}
              min={axis.minValue} max={axis.maxValue}
              value={axisValues[axis.axis] ?? axis.minValue}
              onChange={v => setAxisValues(prev => ({ ...prev, [axis.axis]: v }))}
            />
          ))}
        </div>
      </div>
      </div>

      {/* ── OT Features panel ────────────────────────────────── */}
      {hasFeatures && (
        <FeaturesPanel
          features={features}
          enabled={enabledFeatures}
          onToggle={toggleFeature}
        />
      )}
    </div>
  )
}
