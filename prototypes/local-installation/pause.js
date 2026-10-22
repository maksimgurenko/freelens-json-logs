(() => { const button=document.querySelector('[data-spike="pause"]'); if (button?.textContent === 'Pause') button.click(); return button?.textContent; })()
