import DOMPurify from 'dompurify'

// Job descriptions are HTML written by other companies, so they are cleaned before we show them:
// no scripts, no event handlers, no forms or embedded pages.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Links in a description open in a new tab and can't control our page
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function cleanDescription(html) {
  const fragment = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe', 'select', 'textarea'],
    FORBID_ATTR: ['style', 'class', 'id'],
  })

  // The page already has its own <h1>, so headings inside the description start at <h3>
  fragment.querySelectorAll('h1, h2').forEach((heading) => {
    const smaller = document.createElement('h3')
    smaller.append(...heading.childNodes)
    heading.replaceWith(smaller)
  })

  // Some descriptions put things straight inside a list (like <ul><ul>), which screen readers
  // announce wrongly. Move them into the list item before, or into a new list item.
  fragment.querySelectorAll('ul, ol').forEach((list) => {
    for (const child of [...list.childNodes]) {
      if (child.nodeName === 'LI') continue
      if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) continue
      const previous = child.previousElementSibling
      if (previous && previous.nodeName === 'LI') {
        previous.append(child)
      } else {
        const item = document.createElement('li')
        child.replaceWith(item)
        item.append(child)
      }
    }
  })

  const wrapper = document.createElement('div')
  wrapper.append(fragment)
  return wrapper.innerHTML
}
