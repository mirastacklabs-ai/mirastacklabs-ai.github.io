(function() {
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  var lunrIndex, pagesIndex;

  // Determine the correct path to search.json relative to the current origin
  function initLunr() {
    var request = new XMLHttpRequest();
    request.open('GET', '/search.json', true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        try {
          pagesIndex = JSON.parse(request.responseText);
        } catch (e) {
          console.error('search.json parse error:', e);
          return;
        }

        try {
          lunrIndex = lunr(function() {
            this.field('title', { boost: 10 });
            this.field('content');
            this.ref('url');

            pagesIndex.forEach(function(page) {
              this.add(page);
            }, this);
          });
        } catch (e) {
          console.error('Lunr index build error:', e);
        }
      }
    };

    request.onerror = function() {
      console.error('Could not fetch search.json');
    };

    request.send();
  }

  function displayResults(results) {
    searchResults.innerHTML = '';
    if (!results || results.length === 0) {
      var li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      searchResults.appendChild(li);
      return;
    }

    results.slice(0, 12).forEach(function(result) {
      var page = pagesIndex.find(function(p) { return p.url === result.ref; });
      if (!page) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = page.url;
      a.textContent = page.title;
      li.appendChild(a);
      searchResults.appendChild(li);
    });
  }

  searchInput.addEventListener('input', function() {
    var query = this.value.trim();
    searchResults.innerHTML = '';

    if (query.length < 2 || !lunrIndex) return;

    try {
      // Trailing wildcard only — Lunr does not support leading wildcards
      var results = lunrIndex.search(query + '^10 ' + query + '*');
      displayResults(results);
    } catch (e) {
      // If the query itself has special chars, fall back to a plain search
      try {
        var results = lunrIndex.search(query);
        displayResults(results);
      } catch (e2) {
        // query invalid, silently clear
        searchResults.innerHTML = '';
      }
    }
  });

  // Hide results when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.innerHTML = '';
    }
  });

  initLunr();
})();
