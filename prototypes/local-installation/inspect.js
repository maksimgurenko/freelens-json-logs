// PROTOTYPE: visible installation state and public SDK contribution probe.
({at: new Date().toISOString(), url: location.href, body: document.body.innerText,
  controls: [...document.querySelectorAll('button,input,.MenuItem,.Icon')].map(e => ({
    tag: e.tagName, text: e.innerText, title: e.getAttribute('title'),
    placeholder: e.getAttribute('placeholder'), disabled: e.disabled,
    html: e.outerHTML.slice(0, 800)
  }))})
