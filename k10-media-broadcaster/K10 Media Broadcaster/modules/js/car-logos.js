// CAR MANUFACTURER LOGOS

  // ═══ CAR MANUFACTURER LOGOS (loaded from images/logos/) ═══
  const CAR_LOGO_KEYS = ['bmw','mclaren','mazda','nissan','dallara','ferrari','porsche','audi',
    'mercedes','lamborghini','chevrolet','ford','toyota','hyundai','cadillac','astonmartin',
    'lotus','honda','honda_white','generic','none'];
  const carLogos = {};
  async function loadCarLogos() {
    const results = await Promise.allSettled(
      CAR_LOGO_KEYS.map(async key => {
        const resp = await fetch('images/logos/' + key + '.svg');
        if (resp.ok) carLogos[key] = await resp.text();
      })
    );
  }


  const carLogoOrder = ['bmw', 'mclaren', 'mazda', 'nissan', 'dallara', 'ferrari', 'porsche', 'audi', 'mercedes', 'lamborghini', 'chevrolet', 'ford', 'toyota', 'hyundai', 'cadillac', 'astonmartin', 'lotus', 'honda'];
  let currentCarLogoIdx = 0;
  let _currentCarLogo = '';

  // ── Manufacturer brand colors for logo background tinting ──
  // White/mono logos → low-opacity brand-colored background.
  // Colored logos (BMW, Chevy, Ford, Lotus) → keep black bg to preserve logo colors.
  // Honda → red bg with white-fill logo swap (honda_white key).
  const _mfrBrandColors = {
    bmw:         'hsla(204, 100%, 45%, 0.85)',   // BMW blue (#0066B1)
    mclaren:     'hsla(24, 100%, 52%, 0.85)',    // Papaya orange
    mazda:       'hsla(0, 90%, 44%, 0.85)',       // Soul Red
    nissan:      'hsla(0, 85%, 50%, 0.85)',       // Red
    dallara:     'hsla(210, 85%, 48%, 0.85)',     // Blue
    ferrari:     'hsla(0, 90%, 48%, 0.85)',       // Rosso Corsa
    porsche:     'hsla(0, 0%, 50%, 0.80)',        // Silver grey
    audi:        'hsla(0, 0%, 50%, 0.80)',        // Silver
    mercedes:    'hsla(175, 65%, 42%, 0.82)',     // Petronas teal
    lamborghini: 'hsla(48, 90%, 48%, 0.82)',      // Gold
    chevrolet:   'hsla(40, 62%, 38%, 0.85)',      // Chevy gold (#977124)
    ford:        'hsla(237, 100%, 28%, 0.85)',    // Ford blue (#00095B)
    toyota:      'hsla(0, 85%, 48%, 0.85)',       // Red
    hyundai:     'hsla(216, 85%, 45%, 0.85)',     // Blue
    cadillac:    'hsla(0, 0%, 50%, 0.80)',        // Silver
    astonmartin: 'hsla(155, 70%, 38%, 0.85)',     // Racing green
    lotus:       'hsla(57, 100%, 50%, 0.85)',     // Lotus yellow (#FFF200)
    honda:       'hsla(0, 90%, 42%, 0.90)'        // Red bg (white logo)
  };
  // Default bg for logos not in _mfrBrandColors (keeps original dark bg)
  const _defaultLogoBg = 'hsla(0, 0%, 12%, 1.0)';

  // Sample car names for demo cycle (brand logo is already shown, so just the model)
  const _demoModels = {
    bmw:'M4 GT3', mclaren:'720S GT3', mazda:'MX-5 Cup', nissan:'GTP ZX-T',
    dallara:'IR-04', ferrari:'296 GT3', porsche:'911 GT3 R', audi:'R8 LMS',
    mercedes:'AMG GT3', lamborghini:'Huracán GT3', chevrolet:'Corvette Z06',
    ford:'Mustang GT3', toyota:'GR86', hyundai:'Elantra N TC',
    cadillac:'V-Series.R', astonmartin:'Vantage GT3', lotus:'Emira GT4',
    honda:'Civic Type R'
  };

  function cycleCarLogo() {
    currentCarLogoIdx = (currentCarLogoIdx + 1) % carLogoOrder.length;
    const key = carLogoOrder[currentCarLogoIdx];
    console.log('[K10] Logo cycle:', key);
    // Honda special case: use white-fill logo on red bg
    const svg = (key === 'honda') ? carLogos.honda_white : carLogos[key];
    document.getElementById('carLogoIcon').innerHTML = svg;
    document.getElementById('carModelLabel').textContent = _demoModels[key] || '';
    // Apply brand-colored background (or default dark bg)
    const sq = document.getElementById('carLogoSquare');
    sq.style.background = _mfrBrandColors[key] || _defaultLogoBg;
    _currentCarLogo = ''; // reset so setCarLogo always fires on first real data
  }

  // Strip brand name from model string so label shows just the model
  // e.g. "BMW M4 GT3" → "M4 GT3", "Porsche 911 GT3 R" → "911 GT3 R"
  const _brandStrips = [
    'aston martin', 'astonmartin', 'lamborghini', 'mercedes-benz', 'mercedes',
    'chevrolet', 'mclaren', 'ferrari', 'porsche', 'hyundai', 'cadillac',
    'dallara', 'nissan', 'toyota', 'mazda', 'honda', 'lotus', 'ford',
    'audi', 'bmw'
  ];
  function stripBrand(model) {
    if (!model) return '';
    let s = model.trim();
    const l = s.toLowerCase();
    for (const b of _brandStrips) {
      if (l.startsWith(b)) { s = s.substring(b.length).trim(); break; }
    }
    return s;
  }

  // Set car logo by manufacturer key + optional model string
  function setCarLogo(key, modelName) {
    if (key === _currentCarLogo && modelName === undefined) return;
    _currentCarLogo = key;
    // Honda special case: white-fill logo on red background
    const svg = (key === 'honda') ? (carLogos.honda_white || carLogos.honda) : (carLogos[key] || carLogos.generic);
    document.getElementById('carLogoIcon').innerHTML = svg;
    document.getElementById('carModelLabel').textContent = stripBrand(modelName);
    // Apply brand-colored background for white/mono logos, default dark bg otherwise
    const sq = document.getElementById('carLogoSquare');
    sq.style.background = _mfrBrandColors[key] || _defaultLogoBg;
  }

  // ═══ TACHOMETER ═══
