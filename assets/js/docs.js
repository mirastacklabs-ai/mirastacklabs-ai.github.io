document.addEventListener("DOMContentLoaded", function() {
  /* 
   * 1. Sidebar Nav Hierarchy Toggles
   */
  const expanders = document.querySelectorAll('.nav-list-expander');
  expanders.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      const childList = this.parentElement.querySelector('ul.nav-list-child, ul.nav-list-grandchild');
      if (childList) {
        childList.style.display = expanded ? 'none' : 'block';
      }
    });
  });

  /* 
   * 2. Copy Code Buttons inside the Code Snippets
   */
  const codeBlocks = document.querySelectorAll('div.highlighter-rouge, figure.highlight');
  codeBlocks.forEach(block => {
    block.style.position = 'relative';
    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.setAttribute('aria-label', 'Copy code');
    // Basic SVG icon for copy.
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" class="mira-icon-copy">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" class="mira-icon-check" style="display:none;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    block.appendChild(btn);

    btn.addEventListener('click', () => {
      // Find the raw text, typically in the inner code block
      const codeNode = block.querySelector('code');
      if (codeNode) {
        navigator.clipboard.writeText(codeNode.innerText).then(() => {
          btn.classList.add('copied');
          btn.querySelector('.mira-icon-copy').style.display = 'none';
          btn.querySelector('.mira-icon-check').style.display = 'block';
          
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('.mira-icon-copy').style.display = 'block';
            btn.querySelector('.mira-icon-check').style.display = 'none';
          }, 2000);
        });
      }
    });
  });

  /* 
   * 3. Prev / Next Pagination Logic 
   * Reads from the sidebar so the order is fully dynamic.
   */
  const links = Array.from(document.querySelectorAll('.docs-sidebar a.nav-list-link'));
  
  // Clean URL functions just for strict comparison
  const normalizeUrl = url => {
    let u = new URL(url, window.location.origin);
    return u.pathname.replace(/\/$/, '');
  };

  const currentNormal = normalizeUrl(window.location.href);
  let currentIndex = -1;

  for (let i = 0; i < links.length; i++) {
    const linkNormal = normalizeUrl(links[i].href);
    if (linkNormal === currentNormal) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex !== -1) {
    const prevWrapper = document.getElementById('docs-prev');
    const nextWrapper = document.getElementById('docs-next');

    // Make Prev Link
    if (currentIndex > 0) {
      const prevLink = links[currentIndex - 1];
      prevWrapper.href = prevLink.href;
      prevWrapper.querySelector('.pagination-title').innerText = prevLink.innerText;
      prevWrapper.classList.remove('is-hidden');
    }

    // Make Next Link
    if (currentIndex < links.length - 1) {
      const nextLink = links[currentIndex + 1];
      nextWrapper.href = nextLink.href;
      nextWrapper.querySelector('.pagination-title').innerText = nextLink.innerText;
      nextWrapper.classList.remove('is-hidden');
    }
  }
});