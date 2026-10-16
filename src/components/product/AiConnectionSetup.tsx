'use client';

import { useState } from 'react';

export function AiConnectionSetup() {
  const [status, setStatus] = useState('Not checked yet. Offline examples and device voices need no account.');
  const [checking, setChecking] = useState(false);
  return <section className="ai-connection-setup">
    <h3>AI integration & connection</h3>
    <p>Live guidance uses U-Bot through <code>/api/agent</code> and <code>/api/companion</code>. The server adapts the supplied Python client: Supabase login, in-memory access/refresh tokens, one authentication retry, and streamed UTF-8 text with status markers removed. Every conversation has a separate session ID. Model suggestions are validated and can only open supported sample reviews; no model can write to the wallet.</p>
    <p>In <code>.env.local</code>, configure <code>UBOT_EMAIL</code> and a rotated <code>UBOT_PASSWORD</code>. Optionally set <code>UBOT_TESTER_ID</code> and <code>UBOT_SUPABASE_ANON_KEY</code>; otherwise the server discovers only the matching public anonymous key from U-Bot’s bundles. An existing <code>UBOT_BEARER_TOKEN</code> is an alternative, but needs renewal after it expires if no login is configured. <code>UBOT_MODE</code> defaults to <code>fast</code>. Restart the server. The app connects automatically; there is no offline-mode switch. Chat uses labeled saved guides if it cannot connect, then retries live AI on the next question.</p>
    <p>Speech uses ElevenLabs, following the supplied <a href="https://docs.google.com/document/d/1mCh5MtOzBw0aJpurQVUmIVFfPMAHW3MjNemE-LNiMto/edit" target="_blank" rel="noreferrer">ElevenLabs Hacker Guide</a>. Set <code>ELEVENLABS_API_KEY</code>; optional voice IDs can be supplied for EN, TH and ES. The default <code>eleven_v3</code> model supports all three. When disconnected or speech is not configured, device voices are used with no speech request. Connected speech failures are labeled and use the device voice instead.</p>
    <button className="secondary-action" disabled={checking} onClick={async () => {
      setChecking(true);
      try {
        const response = await fetch('/api/agent', { cache: 'no-store' });
        const data = await response.json();
        setStatus(response.ok ? `U-Bot credentials: ${data.configured ? 'present' : 'missing'}. ElevenLabs key: ${data.speech?.configured ? 'present' : 'missing'}. Presence is not a verified login or audio generation; try a connected reply and Read aloud to verify access.` : 'Connection status could not be checked. Offline examples remain available.');
      } catch { setStatus('The server could not be reached. Offline examples still run in the browser.'); }
      finally { setChecking(false); }
    }}>{checking ? 'Checking…' : 'Check AI connection'}</button>
    <p role="status">{status}</p>
    <p>Never put passwords, bearer tokens or API keys in browser storage, source control or <code>NEXT_PUBLIC_</code> variables. U-Bot may retain conversations in the configured account; New conversation clears this tab and starts a new provider session, but does not delete provider history. Reading aloud sends the selected text to ElevenLabs. No provider-wide zero-retention claim is made. Public hosting needs authentication and account-level usage controls before exposing these server credentials to requests.</p>
  </section>;
}
