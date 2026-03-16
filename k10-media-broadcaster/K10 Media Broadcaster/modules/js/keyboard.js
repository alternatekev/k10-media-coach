// Global keyboard shortcuts

  // ═══ GLOBAL KEYBOARD SHORTCUTS ═══
  document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+M — reset track map
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      if (typeof resetTrackMap === 'function') resetTrackMap();
    }
  });
