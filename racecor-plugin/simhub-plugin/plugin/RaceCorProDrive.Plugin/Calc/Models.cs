using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace RaceCorProDrive.Plugin.Calc
{
    // ───────────────────────────────────────────────────────────────
    //  DTOs for /api/v1/calc/* request and response shapes.
    //
    //  Field ordering and naming match the contract in
    //  prodrive-server/docs/native-app-integration.md. Newtonsoft camel-cases
    //  property names via the contract resolver in CalcClient.
    //
    //  Heavily-nested or evolving response shapes (TrackMastery,
    //  WhenProfile, ComposureReport, IRacingSchedule, etc.) are kept as
    //  JObject so additive server changes don't require client redeploys.
    //  Cast to a strong type at the call site if you need it.
    // ───────────────────────────────────────────────────────────────

    // ─── 1. Driver DNA ───────────────────────────────────────────────

    public sealed class DnaSession
    {
        public int? FinishPosition { get; set; }
        public int? IncidentCount { get; set; }
        public IDictionary<string, object> Metadata { get; set; }
        public string CarModel { get; set; }
        public string TrackName { get; set; }
        public string GameName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public sealed class DnaRating
    {
        public double IRating { get; set; }
        public double? PrevIRating { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public sealed class DriverDnaResponse
    {
        public DriverDnaScores Dna { get; set; }
        public DriverDnaArchetype Archetype { get; set; }
        public List<DriverDnaInsight> Insights { get; set; }
        public int SampleSize { get; set; }
        public double Confidence { get; set; }
    }

    public sealed class DriverDnaScores
    {
        public double Consistency { get; set; }
        public double Racecraft { get; set; }
        public double Cleanness { get; set; }
        public double Endurance { get; set; }
        public double Adaptability { get; set; }
        public double Improvement { get; set; }
        public double WetWeather { get; set; }
        public double Experience { get; set; }
    }

    public sealed class DriverDnaArchetype
    {
        public string Major { get; set; }
        public string Variant { get; set; }
        public string MajorDescription { get; set; }
        public string VariantDescription { get; set; }
    }

    public sealed class DriverDnaInsight
    {
        public string Dimension { get; set; }
        public string Label { get; set; }
        public double Value { get; set; }
        public string Description { get; set; }
        public string Trend { get; set; } // "improving" | "declining" | "stable"
    }

    // ─── 2. Mastery ──────────────────────────────────────────────────

    public sealed class MasterySession
    {
        public string Id { get; set; }
        public string CarModel { get; set; }
        public string Manufacturer { get; set; } = "";
        public string TrackName { get; set; }
        public int? FinishPosition { get; set; }
        public int IncidentCount { get; set; }
        public IDictionary<string, object> Metadata { get; set; }
        public DateTime CreatedAt { get; set; }
        public string GameName { get; set; } = "iracing";
    }

    public sealed class MasteryResponse
    {
        // TrackMastery + CarAffinity shapes are large and additive — kept as
        // raw JObject so server-side additions don't break existing clients.
        public List<JObject> Tracks { get; set; }
        public List<JObject> Cars { get; set; }
    }

    // ─── 3. Moments ──────────────────────────────────────────────────

    public sealed class MomentSession
    {
        public string Id { get; set; }
        public string CarModel { get; set; }
        public string TrackName { get; set; }
        public int? FinishPosition { get; set; }
        public int IncidentCount { get; set; }
        public IDictionary<string, object> Metadata { get; set; }
        public DateTime CreatedAt { get; set; }
        public string GameName { get; set; }
        public string SessionType { get; set; }
    }

    public sealed class MomentRating
    {
        public double IRating { get; set; }
        public double PrevIRating { get; set; }
        public string PrevLicense { get; set; }
        public string License { get; set; }
        public string SessionType { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public sealed class MomentsResponse
    {
        public List<JObject> Moments { get; set; }
    }

    // ─── 4. Scatter ──────────────────────────────────────────────────

    public sealed class ScatterSession
    {
        public DateTime Date { get; set; }
        public double IRatingDelta { get; set; }
        public double SrDelta { get; set; }
        public int Incidents { get; set; }
    }

    public sealed class ScatterResponse
    {
        public List<ScatterBucket> Buckets { get; set; }
    }

    public sealed class ScatterBucket
    {
        public int Day { get; set; }    // 0=Sun, 6=Sat (JS convention)
        public int Hour { get; set; }   // 0–23 in requested time zone
        public int Count { get; set; }
        public double IrDeltaSum { get; set; }
        public double SrDeltaSum { get; set; }
        public int IncidentsSum { get; set; }
        public double AvgIncidents { get; set; }
    }

    // ─── 5. When-engine ──────────────────────────────────────────────

    public sealed class WhenResponse
    {
        public JObject Profile { get; set; }     // WhenProfile
        public List<JObject> Insights { get; set; }
        public WhenPanelView Panel { get; set; }
    }

    public sealed class WhenPanelView
    {
        public WhenPanelSide Strengths { get; set; }
        public WhenPanelSide WatchOut { get; set; }
    }

    public sealed class WhenPanelSide
    {
        public string Paragraph { get; set; }
        public List<string> Bullets { get; set; }
    }

    // ─── 6. Race-Now verdict ─────────────────────────────────────────

    public sealed class RaceNowSessionInput
    {
        public string TrackName { get; set; }
        public string CarModel { get; set; }
        public string Category { get; set; }
        public int? IncidentCount { get; set; }
        public int? CompletedLaps { get; set; }
    }

    public sealed class RaceNowResponse
    {
        public RaceNowEvaluation Evaluation { get; set; }
        public List<RaceNowAlternative> Alternatives { get; set; }
    }

    public sealed class RaceNowEvaluation
    {
        public string Verdict { get; set; }   // "good" | "marginal" | "risky" | "insufficient"
        public string Detail { get; set; }
        public JObject Stats { get; set; }
    }

    public sealed class RaceNowAlternative
    {
        public string Label { get; set; }
        public string TrackName { get; set; }
        public string CarModel { get; set; }
        public string Reason { get; set; }
    }

    // ─── 7. Race summary ─────────────────────────────────────────────

    public sealed class RaceSummaryRequest
    {
        public WireSession Session { get; set; }
        public List<JObject> Laps { get; set; } = new List<JObject>();
        public JObject Behavior { get; set; }
        public RaceSummaryTrackHistory TrackHistory { get; set; }
        public RaceSummaryRatingContext RatingContext { get; set; }
    }

    public sealed class WireSession
    {
        public string Id { get; set; }
        public string CarModel { get; set; }
        public string Manufacturer { get; set; }
        public string TrackName { get; set; }
        public int? FinishPosition { get; set; }
        public int IncidentCount { get; set; }
        public string SessionType { get; set; }
        public string Category { get; set; }
        public IDictionary<string, object> Metadata { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public sealed class RaceSummaryTrackHistory
    {
        public List<WireSession> Sessions { get; set; }
        public int? BestPosition { get; set; }
        public double? AvgPosition { get; set; }
        public double AvgIncidents { get; set; }
        public int TotalRaces { get; set; }
    }

    public sealed class RaceSummaryRatingContext
    {
        public double? PreRaceIRating { get; set; }
        public double? PostRaceIRating { get; set; }
        public double? PreRaceSR { get; set; }
        public double? PostRaceSR { get; set; }
        public double? IrDelta { get; set; }
        public double? SrDelta { get; set; }
    }

    public sealed class RaceSummaryResponse
    {
        public RaceSummary Summary { get; set; }
    }

    public sealed class RaceSummary
    {
        public string Headline { get; set; }
        public string Subheadline { get; set; }
        public string OverallVerdict { get; set; }   // "excellent" | "good" | "mixed" | "tough" | "learning"
        public List<JObject> Strengths { get; set; }
        public List<JObject> Improvements { get; set; }
        public JObject LapAnalysis { get; set; }
        public JObject ComposureReport { get; set; }
        public JObject TrackContext { get; set; }
        public JObject RatingImpact { get; set; }
    }

    // ─── 8. Next race ideas ──────────────────────────────────────────

    public sealed class NextRaceIdeasRequest
    {
        public List<JObject> Sessions { get; set; } = new List<JObject>();
        public List<JObject> Ratings { get; set; } = new List<JObject>();
        public List<DriverRating> DriverRatings { get; set; } = new List<DriverRating>();
        public List<JObject> Schedule { get; set; } = new List<JObject>();
        public List<string> ActiveCategories { get; set; }
        public string TimeZone { get; set; }
    }

    public sealed class DriverRating
    {
        public string Category { get; set; }       // "road" | "oval" | "dirt_oval" | "dirt_road" | "formula"
        public double IRating { get; set; }
        public string SafetyRating { get; set; }   // e.g. "3.45"
        public string License { get; set; }        // "A" | "B" | "C" | "D" | "R"
    }

    public sealed class NextRaceIdeasResponse
    {
        public List<NextRaceIdea> Suggestions { get; set; }
    }

    public sealed class NextRaceIdea
    {
        public string SeriesName { get; set; }
        public string TrackName { get; set; }
        public string TrackConfig { get; set; }
        public string Category { get; set; }
        public string LicenseClass { get; set; }
        public bool IsOfficial { get; set; }
        public bool IsFixed { get; set; }
        public double Score { get; set; }
        public NextRaceStrategy Strategy { get; set; }
        public string Commentary { get; set; }
        public DateTime NextStartTime { get; set; }
        public List<string> CarClassNames { get; set; }
        public int SeasonId { get; set; }
        public int SeriesId { get; set; }
        public int? RaceLapLimit { get; set; }
        public int? RaceTimeLimit { get; set; }
        public JObject ScoreBreakdown { get; set; }
    }

    public sealed class NextRaceStrategy
    {
        public string Type { get; set; }   // "pitlane" | "conservative" | "careful" | "form" | "steady"

        // Strategy carries free-form fields per type — keep extras opaque.
        [JsonExtensionData]
        public IDictionary<string, JToken> Extra { get; set; }
    }
}
