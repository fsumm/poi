import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'

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
          edges { node { content featureSettings { feature value } fontStyle { ${FONT_STYLE_FIELDS} } } }
        }
      }
    }
  }
}`

const QUERY_BY_ID = `query POITypeTesterById($id: ID!) {
  node(id: $id) {
    ... on FontCollection {
      typeTesters(first: 999) {
        edges { node { content featureSettings { feature value } fontStyle { ${FONT_STYLE_FIELDS} } } }
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
    // Features fontdue has turned on by default for this tester (value !== "0")
    const defaultFeatures = (node.featureSettings ?? [])
      .filter(s => s.value && s.value !== '0')
      .map(s => s.feature)
    result.push({ ...fs, defaultContent: node.content ?? 'Type something', defaultFeatures })
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

// Fallback font size (px) shown only before the first autofit measurement.
const DEFAULT_FONT_SIZE = 120

// ── Autofit ───────────────────────────────────────────────────────────────────
// While `enabled`, scales the font size so the text fills the container width,
// re-measuring as the text / features / axes / tracking / viewport change. The
// measurement uses a hidden span at a fixed 100px reference (independent of the
// resulting fontSize) so there's no feedback loop. Disabled the moment the user
// sets the size manually; re-enabled only on a fresh mount (navigation/refresh).
function useAutofit(containerRef, setFontSize, opts) {
  const { enabled, fontLoaded, fontFamily, fontWeight, fontStyle,
          featureSettings, variationSettings, tracking, text } = opts
  const measureRef = useRef(null)

  useEffect(() => {
    const span = document.createElement('span')
    span.style.cssText = 'position:fixed;top:-9999px;left:-9999px;white-space:nowrap;visibility:hidden;font-size:100px'
    document.body.appendChild(span)
    measureRef.current = span
    return () => span.remove()
  }, [])

  const fit = useCallback(() => {
    const container = containerRef.current
    const span = measureRef.current
    if (!enabled || !container || !span || !fontLoaded || !fontFamily) return
    span.style.fontFamily = `"${fontFamily}", sans-serif`
    span.style.fontWeight = fontWeight ?? 400
    span.style.fontStyle = fontStyle ?? 'normal'
    span.style.fontFeatureSettings = featureSettings || 'normal'
    span.style.fontVariationSettings = variationSettings || 'normal'
    span.style.letterSpacing = `${tracking ?? 0}em`
    // Multi-line text (the user pressed Enter) must fill the width based on its
    // WIDEST line, not the lines concatenated — otherwise the size shrinks far
    // too small. innerText carries the line breaks as "\n".
    const lines = String(text || ' ').split('\n')
    let textW = 0
    for (const line of lines) {
      span.textContent = line.length ? line : ' '
      if (span.offsetWidth > textW) textW = span.offsetWidth
    }
    const containerW = container.clientWidth
    if (!textW || !containerW) return
    setFontSize(Math.min(900, Math.max(12, Math.floor((containerW / textW) * 100))))
  }, [enabled, fontLoaded, fontFamily, fontWeight, fontStyle, featureSettings, variationSettings, tracking, text])

  // useLayoutEffect runs before paint, so load / style change / typing never
  // flash a stale size.
  useLayoutEffect(() => { fit() }, [fit])

  // Re-fit on viewport / container width changes — debounced so a window drag
  // doesn't re-measure and reflow the (large, overflowing) text every frame,
  // which was causing noticeable resize lag. Fits once the resize settles.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return
    let t
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(fit, 150)
    })
    ro.observe(container)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [fit, enabled])
}

// ── Slider with value pill ────────────────────────────────────────────────────

function SliderControl({ label, min, max, step = 1, value, onChange }) {
  const [draft, setDraft] = useState(null) // null = not editing
  // Decimal places implied by the step (e.g. step 0.1 → 1 decimal) so fractional
  // controls like Line Height display "1.1" instead of being rounded to "1".
  const decimals = (String(step).split('.')[1] || '').length
  const clamp = v => Math.min(max, Math.max(min, v))
  const fmt = v => Number(v).toFixed(decimals)

  function commit(str) {
    const raw = Number(str)
    if (!isNaN(raw) && str.trim() !== '') onChange(clamp(raw))
    setDraft(null)
  }

  return (
    <div className="tt-slider">
      <span className="tt-slider-label">{label}</span>
      <input
        type="number"
        className="tt-slider-value"
        step={step}
        value={draft ?? fmt(value)}
        onChange={e => setDraft(e.target.value)}
        onFocus={e => { setDraft(fmt(value)); e.target.select() }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.target.blur(); return }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            // Shift + arrow steps by 10× the step (otherwise it steps by one step)
            if (e.shiftKey) {
              e.preventDefault()
              const base = Number(e.target.value)
              if (!isNaN(base)) {
                const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * 10
                const next = clamp(Number((base + delta).toFixed(decimals)))
                setDraft(fmt(next))
                onChange(next)
              }
              return
            }
            setTimeout(() => {
              const raw = Number(e.target.value)
              if (!isNaN(raw)) {
                const next = clamp(Number(raw.toFixed(decimals)))
                setDraft(fmt(next))
                onChange(next)
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
  // Tracks the tester content so it can be restored when the style changes
  const [text, setText] = useState('')
  const [tracking, setTracking] = useState(0)
  const [lineHeight, setLineHeight] = useState(1.1)
  const [enabledFeatures, setEnabledFeatures] = useState(new Set())
  const [axisValues, setAxisValues] = useState({})
  const [fontSize, setFontSize] = useState(null)
  // Text fills the container by default; turns off once the user sets a size,
  // and is only restored on a fresh mount (navigation / refresh).
  const [autofit, setAutofit] = useState(true)

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
      setEnabledFeatures(new Set(preferred.defaultFeatures ?? []))
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
    setEnabledFeatures(new Set(style.defaultFeatures ?? []))
  }, [style?.id])

  const fontLoaded = useFontFace(style?.cssFamily, style?.webfontSources, style?.cssWeight, style?.cssStyle)

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

  // Keep the text filling the container width until the user sets a size.
  useAutofit(containerRef, setFontSize, {
    enabled: autofit,
    fontLoaded,
    fontFamily: style?.cssFamily,
    fontWeight: style?.cssWeight,
    fontStyle: style?.cssStyle,
    featureSettings: fontFeatureSettings,
    variationSettings: fontVariationSettings,
    tracking,
    text,
  })

  const textStyle = style ? {
    fontFamily: fontLoaded ? `"${style.cssFamily}", sans-serif` : 'sans-serif',
    fontWeight: style.cssWeight,
    fontStyle: style.cssStyle,
    fontSize: fontSize ? `${fontSize}px` : '0px',
    letterSpacing: `${tracking}em`,
    fontFeatureSettings,
    fontVariationSettings,
    lineHeight,
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
    <div className="tt">
      {/* ── Text area ───────────────────────────────────────── */}
      <div className="tt-text-wrap" ref={containerRef}>
        <div
          ref={textAreaRef}
          className="tt-text"
          style={textStyle}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={e => setText(e.currentTarget.innerText)}
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
            min={12} max={900}
            value={fontSize ?? DEFAULT_FONT_SIZE}
            onChange={v => { setAutofit(false); setFontSize(v) }}
          />

          {/* Tracking slider */}
          <SliderControl
            label="Tracking"
            min={-100} max={100} step={1}
            value={Math.round(tracking * 1000)}
            onChange={v => setTracking(v / 1000)}
          />

          {/* Line height slider */}
          <SliderControl
            label="Line Height"
            min={0.5} max={1.5} step={0.01}
            value={lineHeight}
            onChange={setLineHeight}
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
