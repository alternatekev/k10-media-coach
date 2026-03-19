using System;

namespace K10MediaBroadcaster.Plugin.Engine
{
    /// <summary>
    /// Tracks F1-style 3-sector split times by dividing the track into thirds
    /// based on LapDistPct. Computes current sector, split times, deltas to
    /// best, and sector performance state (pb/faster/slower).
    /// </summary>
    public class SectorTracker
    {
        // Sector boundaries: S1 = [0, 0.333), S2 = [0.333, 0.667), S3 = [0.667, 1.0)
        private const double S1_END = 0.333;
        private const double S2_END = 0.667;

        // Best sector splits for the session
        private double _bestS1, _bestS2, _bestS3;

        // Current lap sector entry time
        private double _sectorEntryTime;
        private int _prevSector;

        // Last completed sector splits + deltas
        private double _lastS1, _lastS2, _lastS3;
        private double _deltaS1, _deltaS2, _deltaS3;

        // State: 0=none, 1=pb, 2=faster, 3=slower
        private int _stateS1, _stateS2, _stateS3;

        // Track new-lap detection
        private int _prevCompletedLaps;

        /// <summary>Current sector the player is in (1, 2, or 3).</summary>
        public int CurrentSector { get; private set; } = 1;

        /// <summary>Last completed S1 split time (seconds).</summary>
        public double SplitS1 => _lastS1;
        /// <summary>Last completed S2 split time (seconds).</summary>
        public double SplitS2 => _lastS2;
        /// <summary>Last completed S3 split time (seconds).</summary>
        public double SplitS3 => _lastS3;

        /// <summary>Best S1 split time this session.</summary>
        public double BestS1 => _bestS1;
        /// <summary>Best S2 split time this session.</summary>
        public double BestS2 => _bestS2;
        /// <summary>Best S3 split time this session.</summary>
        public double BestS3 => _bestS3;

        /// <summary>Delta to best for last completed S1 (negative = faster).</summary>
        public double DeltaS1 => _deltaS1;
        /// <summary>Delta to best for last completed S2.</summary>
        public double DeltaS2 => _deltaS2;
        /// <summary>Delta to best for last completed S3.</summary>
        public double DeltaS3 => _deltaS3;

        /// <summary>Performance state for S1: 0=none, 1=pb, 2=faster, 3=slower.</summary>
        public int StateS1 => _stateS1;
        /// <summary>Performance state for S2.</summary>
        public int StateS2 => _stateS2;
        /// <summary>Performance state for S3.</summary>
        public int StateS3 => _stateS3;

        /// <summary>
        /// Call every tick with the player's track position and current lap time.
        /// </summary>
        public void Update(double trackPct, double currentLapTime, int completedLaps)
        {
            if (trackPct < 0 || trackPct > 1.01) return;

            int sector = trackPct < S1_END ? 1 : trackPct < S2_END ? 2 : 3;

            // New lap detection: completed laps incremented or sector wrapped 3→1
            if (completedLaps > _prevCompletedLaps || (sector == 1 && _prevSector == 3))
            {
                // Complete S3 before resetting
                if (_prevSector == 3)
                {
                    double splitTime = currentLapTime > 0
                        ? currentLapTime - _sectorEntryTime
                        : 0;
                    if (splitTime > 0.1)
                        RecordSplit(3, splitTime);
                }
                _sectorEntryTime = 0;
                _prevCompletedLaps = completedLaps;
            }

            // Sector transition
            if (sector != _prevSector && _prevSector > 0)
            {
                double splitTime = currentLapTime - _sectorEntryTime;
                if (splitTime > 0.1) // reject tiny/negative glitches
                    RecordSplit(_prevSector, splitTime);
                _sectorEntryTime = currentLapTime;
            }

            // Initialize entry time on first frame
            if (_prevSector == 0)
                _sectorEntryTime = currentLapTime;

            _prevSector = sector;
            CurrentSector = sector;
        }

        private void RecordSplit(int sector, double splitTime)
        {
            switch (sector)
            {
                case 1:
                    _lastS1 = splitTime;
                    if (_bestS1 <= 0 || splitTime < _bestS1)
                    {
                        _bestS1 = splitTime;
                        _deltaS1 = 0;
                        _stateS1 = 1; // pb
                    }
                    else
                    {
                        _deltaS1 = splitTime - _bestS1;
                        _stateS1 = _deltaS1 < 0.01 ? 1 : (_deltaS1 < 0 ? 2 : 3);
                    }
                    break;
                case 2:
                    _lastS2 = splitTime;
                    if (_bestS2 <= 0 || splitTime < _bestS2)
                    {
                        _bestS2 = splitTime;
                        _deltaS2 = 0;
                        _stateS2 = 1;
                    }
                    else
                    {
                        _deltaS2 = splitTime - _bestS2;
                        _stateS2 = _deltaS2 < 0.01 ? 1 : (_deltaS2 < 0 ? 2 : 3);
                    }
                    break;
                case 3:
                    _lastS3 = splitTime;
                    if (_bestS3 <= 0 || splitTime < _bestS3)
                    {
                        _bestS3 = splitTime;
                        _deltaS3 = 0;
                        _stateS3 = 1;
                    }
                    else
                    {
                        _deltaS3 = splitTime - _bestS3;
                        _stateS3 = _deltaS3 < 0.01 ? 1 : (_deltaS3 < 0 ? 2 : 3);
                    }
                    break;
            }
        }

        /// <summary>Reset all sector data (session change, track change).</summary>
        public void Reset()
        {
            _bestS1 = _bestS2 = _bestS3 = 0;
            _lastS1 = _lastS2 = _lastS3 = 0;
            _deltaS1 = _deltaS2 = _deltaS3 = 0;
            _stateS1 = _stateS2 = _stateS3 = 0;
            _sectorEntryTime = 0;
            _prevSector = 0;
            _prevCompletedLaps = 0;
            CurrentSector = 1;
        }
    }
}
