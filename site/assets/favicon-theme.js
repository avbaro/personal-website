/* Swap the tab favicon to match the site's light/dark toggle */
(function () {
  var root = document.documentElement;
  var link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  if (!link) return;
  function sync() {
    var href = '/assets/favicon-' + (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light') + '.svg';
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }
  sync();
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
})();
