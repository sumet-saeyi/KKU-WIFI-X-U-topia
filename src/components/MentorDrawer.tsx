'use client';

import { Tabs } from '@/components/ui/Tabs';
import { useState } from 'react';
import { contractSource } from '@/lib/contractSource';
import { Modal } from './Modal';
import { OnChainInspector } from './OnChainInspector';
import type { ToolCallTrace } from '@/lib/types';

export function MentorDrawer({ open, traces, onClose }: { open: boolean; traces: ToolCallTrace[]; onClose: () => void }) {
  const [tab, setTab] = useState<'architecture' | 'traces' | 'contract'>('architecture');
  const downloadTraces = () => {
    if (typeof window === 'undefined') return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ mode: 'local-demo', traces }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'u-ikigai-traces.json'; link.click(); URL.revokeObjectURL(url);
  };
  return <Modal open={open} onClose={onClose} label="Mentor Architecture View" className="mentor-modal">
    <div className="drawer-head"><div><span className="tech-kicker">FOR TECHNICAL JUDGES</span><h2>Mentor Architecture View</h2><p>The design, runtime traces, and contract behind the human experience.</p></div><button onClick={onClose} aria-label="Close architecture view">×</button></div>
    <Tabs id="architecture" className="drawer-tabs" label="Architecture sections" value={tab} onChange={setTab} items={[{ id: 'architecture', label: '3-chain map' }, { id: 'traces', label: `Tool traces (${traces.length})` }, { id: 'contract', label: 'Smart contract' }]} />
    <div className="drawer-content">
      {tab === 'architecture' && <div className="architecture-view" role="tabpanel" id="architecture-panel-architecture" aria-labelledby="architecture-tab-architecture"><div className="technical-disclosure"><strong>Runtime: local financial simulator</strong><p>Approvals update a browser ledger. No wallet is connected, no transaction is broadcast, and demo receipt references are not blockchain hashes. Live AI changes generated explanations only.</p></div><div className="tech-metrics"><div><small>CONTRACT TARGET</small><strong>Fuji 43113</strong></div><div><small>OFFLINE AI</small><strong>Browser-local</strong></div><div><small>TRANSACTIONS</small><strong>Simulated</strong></div></div><div className="chain-flow">
        <div className="chain-card c-chain"><span>C</span><div><small>CONTRACT IMPLEMENTATION</small><h3>C-Chain · Fuji target</h3><p>The supplied UIkigaiVault records spending caps, income split events, and gift metadata. Deployment and a funded wallet are required for live execution. The supplied contract does not transfer tokens or enforce a gift unlock time.</p></div></div><i>↓</i>
        <div className="chain-card x-chain"><span>X</span><div><small>ARCHITECTURE MAPPING</small><h3>X-Chain · asset rail</h3><p>Proposed asset representation path. There is no live X-Chain integration in this demo.</p></div></div><i>↓</i>
        <div className="chain-card p-chain"><span>P</span><div><small>FUTURE ROADMAP</small><h3>P-Chain · payments L1</h3><p>A future payments L1 could use P-Chain coordination. No L1 is provisioned by this application.</p></div></div>
      </div><div className="session-diagram"><h3>Working demo approval path</h3><div>{['Human intent', 'Prepared action', 'Balance + cap check', 'User approval', 'Local receipt'].map((step, i) => <span key={step}>{i + 1}. {step}</span>)}</div></div><OnChainInspector /></div>}
      {tab === 'traces' && <div className="trace-list" role="tabpanel" id="architecture-panel-traces" aria-labelledby="architecture-tab-traces"><button className="secondary-action" disabled={!traces.length} onClick={downloadTraces}>Download JSON traces</button><p className="trace-mode-note">Guardrail labels follow the specification’s schema. They describe simulator checks, not a verified blockchain session. Latencies are measured for generated responses; synchronous local operations round to 0ms.</p>{!traces.length ? <div className="trace-empty"><span>{'{ }'}</span><h3>No tool calls yet</h3><p>Try a bill, a lesson, or a story to inspect its structured trace.</p></div> : traces.map((trace) => <article key={trace.id} className="trace-card"><div><strong>{trace.toolName}</strong><span>{trace.latencyMs}ms</span></div><p>{trace.outputSummary}</p><dl><dt>time</dt><dd>{trace.timestamp}</dd><dt>guardrail</dt><dd>{trace.guardrailStatus}</dd><dt>target rail</dt><dd>{trace.avalancheChain}</dd><dt>input</dt><dd><code>{JSON.stringify(trace.inputParams, null, 2)}</code></dd></dl></article>)}</div>}
      {tab === 'contract' && <div className="contract-view" role="tabpanel" id="architecture-panel-contract" aria-labelledby="architecture-tab-contract"><div className="code-head"><span><i /> UIkigaiVault.sol</span><small>Source · not deployed</small></div><pre><code>{contractSource}</code></pre></div>}
    </div>
  </Modal>;
}
