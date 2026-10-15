import { Icon } from '@/components/ui/Icon';

export function FlowSteps({ steps, current, onSelect, label }: { steps: string[]; current: number; onSelect: (step: number) => void; label: string }) {
  return <ol className="flow-steps" aria-label={label}>{steps.map((step, index) => <li key={step} className={index === current ? 'current' : index < current ? 'done' : ''}><button onClick={() => { if (index < current) onSelect(index); }} disabled={index > current} aria-current={index === current ? 'step' : undefined}><span>{index < current ? <Icon name="check" size={14} /> : index + 1}</span>{step}</button></li>)}</ol>;
}
