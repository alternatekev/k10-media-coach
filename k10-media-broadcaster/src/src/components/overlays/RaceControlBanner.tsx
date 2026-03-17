import { useMemo, useEffect, useState } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

interface FlagInfo {
  title: string;
  detail: string;
  flagClass: string;
}

export default function RaceControlBanner() {
  const { telemetry } = useTelemetry();
  const [isVisible, setIsVisible] = useState(false);
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Map flag states to titles and details
  const flagInfo = useMemo((): FlagInfo | null => {
    const flag = telemetry.flagState;

    if (flag === 'Yellow') {
      return {
        title: 'CAUTION',
        detail: 'Full course yellow — hold position',
        flagClass: 'rc-yellow',
      };
    }

    if (flag === 'Red') {
      return {
        title: 'RED FLAG',
        detail: 'Session stopped — return to pits',
        flagClass: 'rc-red',
      };
    }

    if (flag === 'Checkered') {
      return {
        title: 'CHECKERED FLAG',
        detail: 'Race complete — cool down lap',
        flagClass: 'rc-checkered',
      };
    }

    if (flag === 'Black') {
      return {
        title: 'BLACK FLAG',
        detail: 'Penalty — report to pit lane immediately',
        flagClass: 'rc-black',
      };
    }

    return null;
  }, [telemetry.flagState]);

  // Show/hide banner based on flag state
  useEffect(() => {
    if (flagInfo) {
      setIsVisible(true);

      // Clear existing timer
      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      // Set new hide timer (8 seconds)
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);

      setHideTimer(timer);
    }
  }, [flagInfo, hideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  if (!flagInfo) {
    return null;
  }

  const bannerClasses = ['rc-banner', flagInfo.flagClass];
  if (isVisible) {
    bannerClasses.push('rc-active');
  }

  return (
    <div className={bannerClasses.join(' ')} id="rcBanner">
      <div className="rc-inner">
        <svg className="rc-icon" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" fill="none"/>
        </svg>
        <div className="rc-content">
          <div className="rc-title">RACE CONTROL</div>
          <div className="rc-detail">{flagInfo.detail}</div>
        </div>
      </div>
    </div>
  );
}
