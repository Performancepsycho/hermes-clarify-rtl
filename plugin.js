// clarify-rtl: Arabic layout for clarify question cards in Hermes Desktop.
// Rebuilt after Omar's `clarify-rtl` (hermes-system #1096); his code was not in the snapshot.
// Temporary: remove when Hermes core gives clarify cards a text direction.
//
// What it does:
// - A card whose text is mostly Arabic gets dir="rtl" (badges, icon and rows flip).
// - Every text line picks its own direction from its first strong letter
//   (unicode-bidi: plaintext), so mixed Arabic/English lines read correctly.

const STYLE_ID = 'clarify-rtl-style'
const CARD = '[data-slot="clarify-inline"]'
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
const LATIN = /[A-Za-z]/g

const CSS = `
${CARD} [data-clarify-batch-question] span,
${CARD} [data-clarify-batch-question] p,
${CARD} [data-choice] span,
${CARD} textarea,
${CARD} p {
  unicode-bidi: plaintext;
  text-align: start;
}
${CARD}[dir="rtl"] textarea { direction: rtl; }
`

function isMostlyArabic(text) {
  const ar = (text.match(ARABIC) || []).length
  const la = (text.match(LATIN) || []).length
  return ar > 0 && ar >= la
}

function markCards(root) {
  const cards = root.querySelectorAll ? root.querySelectorAll(CARD) : []
  for (const card of cards) {
    const want = isMostlyArabic(card.textContent || '') ? 'rtl' : null
    const have = card.getAttribute('dir')
    if (want && have !== want) card.setAttribute('dir', want)
    if (!want && have === 'rtl' && card.dataset.clarifyRtl) card.removeAttribute('dir')
    if (want) card.dataset.clarifyRtl = '1'
  }
}

export default {
  id: 'clarify-rtl',
  name: 'Clarify RTL',
  register(ctx) {
    let style = document.getElementById(STYLE_ID)
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = CSS
      document.head.appendChild(style)
    }

    let queued = false
    const run = () => {
      queued = false
      markCards(document)
    }
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(run)
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    run()

    ctx.onDispose(() => {
      observer.disconnect()
      document.getElementById(STYLE_ID)?.remove()
      for (const card of document.querySelectorAll(`${CARD}[data-clarify-rtl]`)) {
        card.removeAttribute('dir')
        delete card.dataset.clarifyRtl
      }
    })
  }
}
