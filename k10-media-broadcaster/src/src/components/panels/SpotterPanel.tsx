import { useMemo, useEffect, useState } from 'react';
import { useTelemetry } from '@hooks/useTelemetry';

type SpotterSeverity = 'warn' | 'clear' | 'info' | null;

interface SpotterMessage {
  message: string;
  severity: SpotterSeverity;
  id: number;
}

interface SpotterPanelProps {
  posClasses?: string;
  panelStyle?: React.CSSProperties;
}

export default function SpotterPanel({ posClasses, panelStyle }: SpotterPanelProps) {
  const { telemetry } = useTelemetry();
  const [messages, setMessages] = useState<SpotterMessage[]>([]);
  const [nextId, setNextId] = useState(0);

  // Generate spotter message based on gap data
  const spotterState = useMemo(() => {
    const gapAhead = telemetry.gapAhead;
    const gapBehind = telemetry.gapBehind;

    // Closing on car ahead (negative gap means closer)
    if (gapAhead < 0 && gapAhead > -10) {
      const timeGap = Math.abs(gapAhead);
      if (timeGap < 0.5) {
        return {
          message: `Closing — ${timeGap.toFixed(1)}s behind`,
          severity: 'warn' as SpotterSeverity,
        };
      } else if (timeGap < 1.5) {
        return {
          message: `Closing — ${timeGap.toFixed(1)}s behind`,
          severity: 'warn' as SpotterSeverity,
        };
      }
    }

    // Car right (car ahead and visible on right)
    if (gapAhead > 0 && gapAhead < 5) {
      if (gapAhead < 0.5) {
        return {
          message: `Car right — ${gapAhead.toFixed(1)}s`,
          severity: 'warn' as SpotterSeverity,
        };
      } else if (gapAhead < 1.5) {
        return {
          message: `Car right — ${gapAhead.toFixed(1)}s`,
          severity: 'info' as SpotterSeverity,
        };
      }
    }

    // Pulling away (positive gap, increasing)
    if (gapBehind > 0 && gapBehind < 5) {
      return {
        message: `Pulling — ${gapBehind.toFixed(1)}s ahead`,
        severity: 'clear' as SpotterSeverity,
      };
    }

    // Car left (car behind)
    if (gapBehind < 0 && Math.abs(gapBehind) < 5) {
      const timeGap = Math.abs(gapBehind);
      if (timeGap < 0.5) {
        return {
          message: `Car left — ${timeGap.toFixed(1)}s`,
          severity: 'warn' as SpotterSeverity,
        };
      } else if (timeGap < 1.5) {
        return {
          message: `Car left — ${timeGap.toFixed(1)}s`,
          severity: 'info' as SpotterSeverity,
        };
      }
    }

    // Clear state
    if (gapAhead > 5 && gapBehind > 5) {
      return {
        message: 'Clear — you passed',
        severity: 'clear' as SpotterSeverity,
      };
    }

    // Car passed you
    if (gapBehind < -5) {
      return {
        message: 'Car passed you',
        severity: 'warn' as SpotterSeverity,
      };
    }

    return { message: '', severity: null };
  }, [telemetry.gapAhead, telemetry.gapBehind]);

  // Update messages when state changes
  useEffect(() => {
    if (spotterState.severity !== null) {
      // Add new message
      const newMessage: SpotterMessage = {
        message: spotterState.message,
        severity: spotterState.severity,
        id: nextId,
      };

      setMessages((prev) => {
        const updated = [newMessage, ...prev];
        // Keep max 3 messages
        return updated.slice(0, 3);
      });

      setNextId((prev) => prev + 1);

      // Set timer to remove this message after 5 seconds
      const timer = setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [spotterState, nextId]);

  return (
    <div className={`spotter-panel ${posClasses || 'sp-top sp-left'}`} id="spotterPanel" style={panelStyle}>
      <canvas className="sp-gl-canvas" id="spotterGlCanvas"></canvas>
      <div className="sp-stack" id="spotterStack">
        {messages.map((msg, index) => {
          let opacityClass = '';
          if (index === 1) {
            opacityClass = 'style-opacity-55';
          } else if (index === 2) {
            opacityClass = 'style-opacity-30';
          }

          const severityClass = msg.severity ? `sp-${msg.severity}` : '';
          const classes = `sp-inner sp-active ${severityClass} ${opacityClass}`.trim();

          return (
            <div key={msg.id} className={classes}>
              <div className="sp-text">{msg.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
