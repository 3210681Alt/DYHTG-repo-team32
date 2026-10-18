// Moves keyboard and screen reader focus to the page's main heading, waiting (up to ~2 seconds)
// for it to appear if the page is still loading. Returns a function that stops waiting.
export function focusPageHeading() {
  let frame
  let tries = 0

  function tryFocus() {
    const heading = document.querySelector('main h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    } else if (tries++ < 120) {
      frame = requestAnimationFrame(tryFocus)
    }
  }

  tryFocus()
  return () => cancelAnimationFrame(frame)
}
