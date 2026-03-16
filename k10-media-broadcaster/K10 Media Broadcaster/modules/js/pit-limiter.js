// Pit limiter module

  // ═══════════════════════════════════════════════════════════════
  //  PIT LIMITER
  // ═══════════════════════════════════════════════════════════════
  let _wasInPit = false;

  function updatePitLimiter(p, isDemo) {
    const pre = isDemo ? 'K10MediaBroadcaster.Plugin.Demo.DS.' : 'K10MediaBroadcaster.Plugin.DS.';
    const inPitLane = +(p[pre + 'IsInPitLane']) > 0;
    const speedKmh = +(p[pre + 'SpeedKmh']) || 0;
    const pitLimiterOn = +(p[pre + 'PitLimiterOn']) > 0;
    const pitLimitKmh = +(p[pre + 'PitSpeedLimitKmh']) || 0;

    const banner = document.getElementById('pitBanner');
    const speedEl = document.getElementById('pitSpeed');
    const limitEl = document.getElementById('pitLimit');
    const labelEl = banner ? banner.querySelector('.pit-label') : null;
    if (!banner) return;

    if (inPitLane) {
      banner.classList.add('pit-visible');
      document.body.classList.add('pit-mode');

      // Show speed
      if (speedEl) {
        const mph = Math.round(speedKmh * 0.621371);
        speedEl.textContent = mph > 0 ? mph + ' mph' : '';
      }
      // Show pit speed limit
      if (limitEl) {
        if (pitLimitKmh > 0) {
          const limitMph = Math.round(pitLimitKmh * 0.621371);
          limitEl.textContent = '/ ' + limitMph + ' limit';
        } else {
          limitEl.textContent = '';
        }
      }

      // Warning flash when pit limiter is NOT enabled
      if (!pitLimiterOn) {
        banner.classList.add('pit-warning');
        if (labelEl) labelEl.textContent = 'PIT LIMITER OFF';
      } else {
        banner.classList.remove('pit-warning');
        if (labelEl) labelEl.textContent = 'Pit Limiter';
      }
    } else {
      banner.classList.remove('pit-visible', 'pit-warning');
      document.body.classList.remove('pit-mode');
      if (labelEl) labelEl.textContent = 'Pit Limiter';
    }
    _wasInPit = inPitLane;
  }

  // ═══════════════════════════════════════════════════════════════
