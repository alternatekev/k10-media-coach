/**
 * Track location metadata — country, city, and flag emoji.
 *
 * Keyed by iRacing track_name (API format) AND by Pro Drive trackId.
 * The resolve function checks both, so it works regardless of whether
 * the track name has been consolidated yet.
 */

export interface TrackLocation {
  country: string
  countryCode: string
  flag: string
  city: string
}

const TRACK_LOCATIONS: Record<string, TrackLocation> = {
  // ── By iRacing track_name ──
  'Circuit de Spa-Francorchamps':           { country: 'Belgium',       countryCode: 'BE', flag: '🇧🇪', city: 'Stavelot' },
  'Silverstone Circuit':                    { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Silverstone' },
  'Watkins Glen International':             { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Watkins Glen, NY' },
  'WeatherTech Raceway Laguna Seca':        { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Monterey, CA' },
  'Road America':                           { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Elkhart Lake, WI' },
  'Daytona International Speedway':         { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Daytona Beach, FL' },
  'Indianapolis Motor Speedway':            { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Indianapolis, IN' },
  'Nürburgring Nordschleife':               { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'Suzuka International Racing Course':     { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Suzuka' },
  'Mount Panorama Circuit':                 { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Bathurst' },
  'Circuit of the Americas':                { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Austin, TX' },
  'Circuit des 24 Heures du Mans':          { country: 'France',        countryCode: 'FR', flag: '🇫🇷', city: 'Le Mans' },
  'Brands Hatch Circuit':                   { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Longfield' },
  'Bristol Motor Speedway':                 { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Bristol, TN' },
  'Charlotte Motor Speedway':               { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Concord, NC' },
  'Las Vegas Motor Speedway':               { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Las Vegas, NV' },
  'Michigan International Speedway':        { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Brooklyn, MI' },
  'Martinsville Speedway':                  { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Martinsville, VA' },
  'Talladega Superspeedway':                { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Talladega, AL' },
  'Pocono Raceway':                         { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Long Pond, PA' },
  'Eldora Speedway':                        { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Rossburg, OH' },
  'Knoxville Raceway':                      { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Knoxville, IA' },
  'Long Beach Street Circuit':              { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Long Beach, CA' },
  'Autodromo Internazionale Enzo e Dino Ferrari': { country: 'Italy',  countryCode: 'IT', flag: '🇮🇹', city: 'Imola' },
  'Circuit Park Zandvoort':                 { country: 'Netherlands',   countryCode: 'NL', flag: '🇳🇱', city: 'Zandvoort' },
  'Hungaroring':                            { country: 'Hungary',       countryCode: 'HU', flag: '🇭🇺', city: 'Mogyoród' },
  'Donington Park Racing Circuit':          { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Castle Donington' },
  'Okayama International Circuit':          { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Mimasaka' },
  'Lime Rock Park':                         { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Lakeville, CT' },
  'Sonoma Raceway':                         { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Sonoma, CA' },
  'Barber Motorsports Park':                { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Birmingham, AL' },
  'Virginia International Raceway':         { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Alton, VA' },
  'Oulton Park Circuit':                    { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Tarporley' },
  'Snetterton Circuit':                     { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Snetterton' },
  'Knockhill Racing Circuit':               { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Dunfermline' },
  'Red Bull Ring':                          { country: 'Austria',       countryCode: 'AT', flag: '🇦🇹', city: 'Spielberg' },
  'Autodromo Nazionale Monza':              { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Monza' },
  'Fuji Speedway':                          { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Oyama' },
  'Bahrain International Circuit':          { country: 'Bahrain',       countryCode: 'BH', flag: '🇧🇭', city: 'Sakhir' },
  'Sebring International Raceway':          { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Sebring, FL' },
  'Michelin Raceway Road Atlanta':          { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Braselton, GA' },
  'Hockenheimring':                         { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Hockenheim' },
  'Phillip Island Grand Prix Circuit':      { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Phillip Island' },
  'Misano World Circuit Marco Simoncelli':  { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Misano Adriatico' },
  'Autódromo José Carlos Pace':             { country: 'Brazil',        countryCode: 'BR', flag: '🇧🇷', city: 'São Paulo' },
  'Autódromo Hermanos Rodríguez':           { country: 'Mexico',        countryCode: 'MX', flag: '🇲🇽', city: 'Mexico City' },
  'Adelaide Street Circuit':                { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Adelaide' },
  'Circuito de Navarra':                    { country: 'Spain',         countryCode: 'ES', flag: '🇪🇸', city: 'Los Arcos' },
  'Miami International Autodrome':          { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Miami, FL' },
  'Motorsport Arena Oschersleben':          { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Oschersleben' },
  'St. Petersburg Grand Prix':              { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'St. Petersburg, FL' },
  'Circuit de Barcelona-Catalunya':         { country: 'Spain',         countryCode: 'ES', flag: '🇪🇸', city: 'Montmeló' },
  'Circuit Gilles Villeneuve':              { country: 'Canada',        countryCode: 'CA', flag: '🇨🇦', city: 'Montreal' },
  'Yas Marina Circuit':                     { country: 'UAE',           countryCode: 'AE', flag: '🇦🇪', city: 'Abu Dhabi' },
  'Shanghai International Circuit':         { country: 'China',         countryCode: 'CN', flag: '🇨🇳', city: 'Shanghai' },
  'Mugello Circuit':                        { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Scarperia' },
  'Mid-Ohio Sports Car Course':             { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Lexington, OH' },
  'Canadian Tire Motorsport Park':          { country: 'Canada',        countryCode: 'CA', flag: '🇨🇦', city: 'Bowmanville, ON' },
  'Autodromo Internacional do Algarve':     { country: 'Portugal',      countryCode: 'PT', flag: '🇵🇹', city: 'Portimão' },
  'Circuit Paul Ricard':                    { country: 'France',        countryCode: 'FR', flag: '🇫🇷', city: 'Le Castellet' },
  'Jeddah Corniche Circuit':                { country: 'Saudi Arabia',  countryCode: 'SA', flag: '🇸🇦', city: 'Jeddah' },
  'Lusail International Circuit':           { country: 'Qatar',         countryCode: 'QA', flag: '🇶🇦', city: 'Lusail' },

  // ── By Pro Drive trackId (so lookups work after consolidation too) ──
  'spa-francorchamps':       { country: 'Belgium',       countryCode: 'BE', flag: '🇧🇪', city: 'Stavelot' },
  'silverstone':             { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Silverstone' },
  'watkins-glen':            { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Watkins Glen, NY' },
  'laguna-seca':             { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Monterey, CA' },
  'road-america':            { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Elkhart Lake, WI' },
  'daytona':                 { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Daytona Beach, FL' },
  'indianapolis':            { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Indianapolis, IN' },
  'nurburgring-nordschleife': { country: 'Germany',      countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'suzuka':                  { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Suzuka' },
  'mount-panorama':          { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Bathurst' },
  'circuit-of-americas':     { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Austin, TX' },
  'le-mans':                 { country: 'France',        countryCode: 'FR', flag: '🇫🇷', city: 'Le Mans' },
  'brands-hatch':            { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Longfield' },
  'imola':                   { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Imola' },
  'zandvoort':               { country: 'Netherlands',   countryCode: 'NL', flag: '🇳🇱', city: 'Zandvoort' },
  'hungaroring':             { country: 'Hungary',       countryCode: 'HU', flag: '🇭🇺', city: 'Mogyoród' },
  'donington-park':          { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Castle Donington' },
  'okayama':                 { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Mimasaka' },
  'lime-rock':               { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Lakeville, CT' },
  'sonoma':                  { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Sonoma, CA' },
  'barber-motorsports':      { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Birmingham, AL' },
  'virginia-international':  { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Alton, VA' },
  'oulton-park':             { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Tarporley' },
  'snetterton':              { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Snetterton' },
  'knockhill':               { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Dunfermline' },
  'red-bull-ring':           { country: 'Austria',       countryCode: 'AT', flag: '🇦🇹', city: 'Spielberg' },
  'monza':                   { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Monza' },
  'monza-full':              { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Monza' },
  'monza-chicanes':          { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Monza' },
  'fuji':                    { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Oyama' },
  'bahrain':                 { country: 'Bahrain',       countryCode: 'BH', flag: '🇧🇭', city: 'Sakhir' },
  'sebring':                 { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Sebring, FL' },
  'road-atlanta':            { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Braselton, GA' },
  'hockenheim':              { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Hockenheim' },
  'phillip-island':          { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Phillip Island' },
  'misano':                  { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Misano Adriatico' },
  'interlagos':              { country: 'Brazil',        countryCode: 'BR', flag: '🇧🇷', city: 'São Paulo' },
  'mexico-city':             { country: 'Mexico',        countryCode: 'MX', flag: '🇲🇽', city: 'Mexico City' },
  'adelaide':                { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Adelaide' },
  'navarra':                 { country: 'Spain',         countryCode: 'ES', flag: '🇪🇸', city: 'Los Arcos' },
  'miami':                   { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Miami, FL' },
  'oschersleben':            { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Oschersleben' },
  'st-petersburg':           { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'St. Petersburg, FL' },
  'portimao':                { country: 'Portugal',      countryCode: 'PT', flag: '🇵🇹', city: 'Portimão' },
  'barcelona':               { country: 'Spain',         countryCode: 'ES', flag: '🇪🇸', city: 'Montmeló' },
  'montreal':                { country: 'Canada',        countryCode: 'CA', flag: '🇨🇦', city: 'Montreal' },
  'yas-marina':              { country: 'UAE',           countryCode: 'AE', flag: '🇦🇪', city: 'Abu Dhabi' },
  'shanghai':                { country: 'China',         countryCode: 'CN', flag: '🇨🇳', city: 'Shanghai' },
  'mugello':                 { country: 'Italy',         countryCode: 'IT', flag: '🇮🇹', city: 'Scarperia' },
  'mid-ohio':                { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Lexington, OH' },
  'mosport':                 { country: 'Canada',        countryCode: 'CA', flag: '🇨🇦', city: 'Bowmanville, ON' },
  'paul-ricard':             { country: 'France',        countryCode: 'FR', flag: '🇫🇷', city: 'Le Castellet' },
  'jeddah':                  { country: 'Saudi Arabia',  countryCode: 'SA', flag: '🇸🇦', city: 'Jeddah' },
  'lusail':                  { country: 'Qatar',         countryCode: 'QA', flag: '🇶🇦', city: 'Lusail' },
  'long-beach':              { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Long Beach, CA' },
  'nurburgring-gp':          { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'nurburgring-combined':    { country: 'Germany',       countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'nurburgring-combinedlong': { country: 'Germany',     countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'nurburgring-gpnochicane': { country: 'Germany',      countryCode: 'DE', flag: '🇩🇪', city: 'Nürburg' },
  'cadwell-full-full-circuit': { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Louth' },
  'Cadwell Park':            { country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Louth' },
  'chicago-2023-chicago':    { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Chicago, IL' },
  'Chicago Street Course':   { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Chicago, IL' },
  'crandon-full-crandon-off-road-full': { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Crandon, WI' },
  'Crandon International Raceway': { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Crandon, WI' },
  'Circuit Zolder':          { country: 'Belgium',       countryCode: 'BE', flag: '🇧🇪', city: 'Heusden-Zolder' },
  'Willow Springs International Raceway': { country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Rosamond, CA' },
  'Rudskogen Motorsenter':   { country: 'Norway',        countryCode: 'NO', flag: '🇳🇴', city: 'Rakkestad' },
  'Oran Park Raceway':       { country: 'Australia',     countryCode: 'AU', flag: '🇦🇺', city: 'Oran Park' },
  'Tsukuba Circuit':         { country: 'Japan',         countryCode: 'JP', flag: '🇯🇵', city: 'Shimotsuma' },
}

/**
 * Look up track location by any name — iRacing API name, Pro Drive trackId,
 * DB trackName, or displayName.
 */
export function getTrackLocation(trackName: string): TrackLocation | null {
  // Direct lookup
  if (TRACK_LOCATIONS[trackName]) return TRACK_LOCATIONS[trackName]

  // Try lowercase (for trackId lookups)
  const lower = trackName.toLowerCase()
  if (TRACK_LOCATIONS[lower]) return TRACK_LOCATIONS[lower]

  // Try slug
  const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (TRACK_LOCATIONS[slug]) return TRACK_LOCATIONS[slug]

  // Partial — check if any key is contained in the name
  for (const [key, loc] of Object.entries(TRACK_LOCATIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return loc
    }
  }

  return null
}
