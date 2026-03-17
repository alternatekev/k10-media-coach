import { useState, useEffect } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';
import { detectMfr, getMfrColor } from '@lib/manufacturers';
import { stripBrand } from '@lib/formatters';

interface LogoPanelProps {
  idleMode?: boolean;
}

export default function LogoPanel({ idleMode = false }: LogoPanelProps) {
  const { telemetry } = useTelemetry();

  const [logoSvg, setLogoSvg] = useState<string>('');
  const mfr = detectMfr(telemetry.carModel);
  const mfrColor = getMfrColor(mfr);
  const carModelLabel = stripBrand(telemetry.carModel);

  // Load manufacturer logo SVG on mount and when mfr changes
  useEffect(() => {
    if (!idleMode && mfr && mfr !== 'unknown') {
      const svgPath = `./images/logos/${mfr}.svg`;
      fetch(svgPath)
        .then((res) => {
          if (res.ok) {
            return res.text();
          }
          throw new Error(`Failed to load ${mfr} logo`);
        })
        .then((svg) => {
          setLogoSvg(svg);
        })
        .catch(() => {
          setLogoSvg('');
        });
    } else {
      setLogoSvg('');
    }
  }, [mfr, idleMode]);

  // In idle mode, only render the K10 logo
  if (idleMode) {
    return (
      <div className="logo-col">
        <div className="logo-square" id="k10LogoSquare">
          <canvas className="gl-overlay" id="k10LogoGlCanvas" style={{ zIndex: 1 }}></canvas>
          <img
            src="./images/branding/logomark.png"
            alt="K10 Media Broadcaster"
            style={{ width: '75%', height: 'auto', opacity: 1, position: 'relative', zIndex: 2 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="logo-col">
      <div className="logo-square" id="k10LogoSquare">
        <canvas className="gl-overlay" id="k10LogoGlCanvas" style={{ zIndex: 1 }}></canvas>
        <img
          src="./images/branding/logomark.png"
          alt="K10 Media Broadcaster"
          style={{ width: '75%', height: 'auto', opacity: 1, position: 'relative', zIndex: 2 }}
        />
      </div>

      <div
        className="logo-square"
        id="carLogoSquare"
        style={{ '--bg-logo': mfrColor } as React.CSSProperties}
      >
        <div className="car-logo-icon" id="carLogoIcon">
          {logoSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: logoSvg }}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          ) : (
            <svg viewBox="0 0 100 100" style={{ width: '70%', height: '70%' }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M30,50 Q50,30 70,50 Q50,70 30,50" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <span className="car-model-label" id="carModelLabel">{carModelLabel}</span>
      </div>
    </div>
  );
}
