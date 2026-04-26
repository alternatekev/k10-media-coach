using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace RaceCorProDrive.Plugin.Calc
{
    // ───────────────────────────────────────────────────────────────
    //  CALC CLIENT — wraps web-api /api/v1/calc/* endpoints.
    //  Spec: prodrive-server/docs/native-app-integration.md
    //
    //  Replaces every locally-implemented calc engine in the plugin.
    //  HttpClient is long-lived per the doc's recommendation; do not
    //  instantiate per-call.
    // ───────────────────────────────────────────────────────────────
    public sealed class CalcClient : IDisposable
    {
        private static readonly Uri DefaultBaseUri = new Uri("https://api.prodrive.racecor.io");

        private readonly HttpClient _http;
        private readonly bool _ownsHttpClient;
        private string _bearerToken;

        private static readonly JsonSerializerSettings _jsonSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore,
            DateFormatHandling = DateFormatHandling.IsoDateFormat,
            DateTimeZoneHandling = DateTimeZoneHandling.Utc
        };

        public CalcClient() : this(DefaultBaseUri, TimeSpan.FromSeconds(10)) { }

        public CalcClient(Uri baseAddress, TimeSpan timeout)
        {
            _http = new HttpClient
            {
                BaseAddress = baseAddress ?? DefaultBaseUri,
                Timeout = timeout
            };
            _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _ownsHttpClient = true;
        }

        // For tests / shared HttpClient reuse.
        public CalcClient(HttpClient http)
        {
            _http = http ?? throw new ArgumentNullException(nameof(http));
            _ownsHttpClient = false;
        }

        // Bearer is optional today (web-api is open). When Phase 9b
        // lands, set this once on construction and every request picks
        // it up — no per-call plumbing.
        public void SetBearerToken(string token)
        {
            _bearerToken = token;
        }

        // ─── 1. Driver DNA ───────────────────────────────────────
        public Task<DriverDnaResponse> FetchDriverDnaAsync(
            IEnumerable<DnaSession> sessions,
            IEnumerable<DnaRating> ratings,
            CancellationToken ct = default)
            => PostAsync<DriverDnaResponse>("/api/v1/calc/dna",
                new { sessions = sessions ?? new List<DnaSession>(), ratings = ratings ?? new List<DnaRating>() },
                ct);

        // ─── 2. Mastery (tracks + cars) ──────────────────────────
        public Task<MasteryResponse> FetchMasteryAsync(
            IEnumerable<MasterySession> sessions,
            CancellationToken ct = default)
            => PostAsync<MasteryResponse>("/api/v1/calc/mastery",
                new { sessions = sessions ?? new List<MasterySession>() },
                ct);

        // ─── 3. Notable moments ──────────────────────────────────
        public Task<MomentsResponse> FetchMomentsAsync(
            IEnumerable<MomentSession> sessions,
            IEnumerable<MomentRating> ratings,
            CancellationToken ct = default)
            => PostAsync<MomentsResponse>("/api/v1/calc/moments",
                new { sessions = sessions ?? new List<MomentSession>(), ratings = ratings ?? new List<MomentRating>() },
                ct);

        // ─── 4. Scatter buckets ──────────────────────────────────
        public Task<ScatterResponse> FetchScatterAsync(
            IEnumerable<ScatterSession> sessions,
            string timeZone = null,
            CancellationToken ct = default)
        {
            var body = string.IsNullOrEmpty(timeZone)
                ? (object)new { sessions = sessions ?? new List<ScatterSession>() }
                : new { sessions = sessions ?? new List<ScatterSession>(), timeZone };
            return PostAsync<ScatterResponse>("/api/v1/calc/scatter", body, ct);
        }

        // ─── 5. When-engine ──────────────────────────────────────
        public Task<WhenResponse> FetchWhenAsync(
            IEnumerable<object> sessions,        // RaceSession shape; opaque pass-through
            IEnumerable<object> ratings,         // RatingHistoryEntry shape; opaque pass-through
            string timeZone = null,
            CancellationToken ct = default)
        {
            var body = string.IsNullOrEmpty(timeZone)
                ? (object)new { sessions = sessions ?? new List<object>(), ratings = ratings ?? new List<object>() }
                : new { sessions = sessions ?? new List<object>(), ratings = ratings ?? new List<object>(), timeZone };
            return PostAsync<WhenResponse>("/api/v1/calc/when", body, ct);
        }

        // ─── 6. Race-Now verdict ─────────────────────────────────
        // Recommended cadence: once on plugin start, then once every
        // 5–10 minutes (or on hour rollover). Verdict only changes on
        // hour boundaries; faster polling is wasted.
        public Task<RaceNowResponse> FetchRaceNowAsync(
            object profile,                      // WhenProfile from /calc/when, or null
            DateTimeOffset? now = null,
            string timeZone = null,
            IEnumerable<RaceNowSessionInput> sessions = null,
            CancellationToken ct = default)
        {
            var body = new Dictionary<string, object> { ["profile"] = profile };
            if (now.HasValue) body["now"] = now.Value.UtcDateTime;
            if (!string.IsNullOrEmpty(timeZone)) body["timeZone"] = timeZone;
            if (sessions != null) body["sessions"] = sessions;
            return PostAsync<RaceNowResponse>("/api/v1/calc/race-now", body, ct);
        }

        // ─── 7. Race summary ─────────────────────────────────────
        public Task<RaceSummaryResponse> FetchRaceSummaryAsync(
            RaceSummaryRequest request,
            CancellationToken ct = default)
            => PostAsync<RaceSummaryResponse>("/api/v1/calc/race-summary",
                request ?? new RaceSummaryRequest(),
                ct);

        // ─── 8. Next race ideas ──────────────────────────────────
        public Task<NextRaceIdeasResponse> FetchNextRaceIdeasAsync(
            NextRaceIdeasRequest request,
            CancellationToken ct = default)
            => PostAsync<NextRaceIdeasResponse>("/api/v1/calc/next-race-ideas",
                request ?? new NextRaceIdeasRequest(),
                ct);

        // ─── Core POST helper ────────────────────────────────────
        private async Task<T> PostAsync<T>(string path, object body, CancellationToken ct)
        {
            var json = JsonConvert.SerializeObject(body, _jsonSettings);
            using (var content = new StringContent(json, Encoding.UTF8, "application/json"))
            using (var req = new HttpRequestMessage(HttpMethod.Post, path) { Content = content })
            {
                if (!string.IsNullOrEmpty(_bearerToken))
                {
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _bearerToken);
                }

                using (var resp = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false))
                {
                    if (!resp.IsSuccessStatusCode)
                    {
                        var preview = "";
                        try { preview = await resp.Content.ReadAsStringAsync().ConfigureAwait(false); } catch { }
                        if (preview.Length > 500) preview = preview.Substring(0, 500);
                        throw new CalcClientException(path, (int)resp.StatusCode, preview);
                    }

                    var stream = await resp.Content.ReadAsStringAsync().ConfigureAwait(false);
                    return JsonConvert.DeserializeObject<T>(stream, _jsonSettings);
                }
            }
        }

        public void Dispose()
        {
            if (_ownsHttpClient)
            {
                _http.Dispose();
            }
        }
    }

    public sealed class CalcClientException : Exception
    {
        public string Path { get; }
        public int StatusCode { get; }
        public string ResponseBodyPreview { get; }

        public CalcClientException(string path, int statusCode, string preview)
            : base($"calc-client {path} {statusCode}: {preview}")
        {
            Path = path;
            StatusCode = statusCode;
            ResponseBodyPreview = preview;
        }
    }
}
