import { useState } from 'react';
import GlassPanel from '../components/ui/GlassPanel';

const NAV = ['Introduction', 'Authentication', 'WRITE API', 'READ API', 'Examples', 'Errors', 'Rate Limits'];

const CodeBlock = ({ children }) => (
  <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-black/40 p-4 text-xs leading-relaxed text-ink font-tabular">
    <code>{children}</code>
  </pre>
);

export default function ApiDocumentation() {
  const [section, setSection] = useState('Introduction');

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
        {NAV.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${section === s ? 'glass-panel-strong text-ink' : 'text-muted hover:text-ink'}`}
          >
            {s}
          </button>
        ))}
      </nav>

      <GlassPanel className="flex-1 p-6">
        {section === 'Introduction' && (
          <div>
            <h1 className="text-xl font-semibold text-ink">EdgeX API</h1>
            <p className="mt-2 text-sm text-muted">EdgeX exposes exactly two universal sensor data endpoints. Every device and every metric — regardless of type — flows through these same two routes.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4"><p className="font-tabular text-sm text-cyan">POST /api/v1/write</p><p className="mt-1 text-xs text-muted">Machine → Platform ingestion</p></div>
              <div className="rounded-xl border border-violet/20 bg-violet/5 p-4"><p className="font-tabular text-sm text-violet">GET /api/v1/read</p><p className="mt-1 text-xs text-muted">Platform → User retrieval</p></div>
            </div>
          </div>
        )}

        {section === 'Authentication' && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Authentication</h2>
            <p className="mt-2 text-sm text-muted">WRITE requests authenticate with a per-device API key. READ requests authenticate as a logged-in user (JWT) whose permissions determine what's returned.</p>
            <CodeBlock>{`Authorization: Bearer edgex_live_xxxxxxxxxxxxxxxxxxxxxxxx`}</CodeBlock>
          </div>
        )}

        {section === 'WRITE API' && (
          <div>
            <h2 className="text-lg font-semibold text-ink">POST /api/v1/write</h2>
            <p className="mt-2 text-sm text-muted">Send any set of metric:value pairs. New metrics are auto-provisioned as sensors on first sighting.</p>
            <CodeBlock>{`POST /api/v1/write
Authorization: Bearer edgex_live_xxxxxxxx

{
  "data": {
    "temperature": 28.6,
    "humidity": 64.2
  },
  "metadata": { "battery": 92, "signal": -61 }
}`}</CodeBlock>
            <p className="mt-4 text-sm text-muted">Response</p>
            <CodeBlock>{`{
  "success": true,
  "message": "Data received",
  "deviceId": "EDGE-001",
  "timestamp": "2026-08-19T09:00:00.000Z"
}`}</CodeBlock>
          </div>
        )}

        {section === 'READ API' && (
          <div>
            <h2 className="text-lg font-semibold text-ink">GET /api/v1/read</h2>
            <p className="mt-2 text-sm text-muted">Query readings across your accessible devices.</p>
            <CodeBlock>{`GET /api/v1/read?deviceId=EDGE-001&sensor=temperature&from=2026-08-01&limit=100
Authorization: Bearer <user JWT>`}</CodeBlock>
          </div>
        )}

        {section === 'Examples' && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-medium text-ink">ESP32 (Arduino)</p>
              <CodeBlock>{`const char* API_KEY = "edgex_live_xxxxxxxx";
const char* SERVER_URL = "https://your-domain.com/api/v1/write";

// POST { "data": { "temperature": 28.6 } } with header
// Authorization: Bearer <API_KEY>`}</CodeBlock>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Python</p>
              <CodeBlock>{`import requests

requests.post(
    "https://your-domain.com/api/v1/write",
    headers={"Authorization": "Bearer edgex_live_xxxxxxxx"},
    json={"data": {"temperature": 28.6, "humidity": 64.2}},
)`}</CodeBlock>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">cURL</p>
              <CodeBlock>{`curl -X POST https://your-domain.com/api/v1/write \\
  -H "Authorization: Bearer edgex_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"temperature": 28.6}}'`}</CodeBlock>
            </div>
          </div>
        )}

        {section === 'Errors' && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Error format</h2>
            <CodeBlock>{`{
  "success": false,
  "error": { "code": "INVALID_API_KEY", "message": "The API key is invalid or revoked." }
}`}</CodeBlock>
          </div>
        )}

        {section === 'Rate Limits' && (
          <div>
            <h2 className="text-lg font-semibold text-ink">Rate limits</h2>
            <p className="mt-2 text-sm text-muted">WRITE ingestion, login, OTP requests, and password resets each have independent limits, configurable via environment variables on the server.</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
