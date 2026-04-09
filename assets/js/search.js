(function() {
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  var lunrIndex, pagesIndex;

  // Initialize lunr
  function initLunr() {
    var request = new XMLHttpRequest();
    request.open('GET', '/search.json', true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        pagesIndex = JSON.parse(request.responseText);

        lunrIndex = lunr(function() {
          this.field('title');
          this.field('content');
          this.ref('url');

          pagesIndex.forEach(function (page) {
            this.add(page);
          }, this);
        });
      }
    };
    request.send();
  }

  // Handle Search Input
  searchInput.addEventListener('keyup', function(e) {
    if (!lunrIndex) return;
    
    var query = e.target.value;
    searchResults.innerHTML = '';

    if (query.length < 2) {
      return;
    }

    var results = lunrIndex.search(query + '^100 ' + query + '*^10 *' + query + '*^1');

    if (results.length > 0) {
      results.forEach(function(result) {
        var page = pagesIndex.find(function(p) { return p.url === result.ref; });
        var li = document.createElement('li');
        li.innerHTML = '<a href="' + page.url + '">' + page.title + '</a>';
        searchResults.appendChild(li);
      });
    } else {
      searchResults.innerHTML = '<li class="no-results">No results found</li>';
    }
  });

  initLunr();
})();
