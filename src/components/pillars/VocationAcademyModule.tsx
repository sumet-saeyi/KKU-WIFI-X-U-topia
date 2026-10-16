'use client';

import { AgentSourceNote } from '@/components/product/AgentSourceNote';

import { useState } from 'react';
import { makeTrace, stageSafeAnswer } from '@/lib/presetData';
import { money, words } from '@/lib/i18n';
import { ModuleHeader, SectionHeading } from './ModuleParts';
import type { AgentResult, BaseModuleProps } from './moduleTypes';

interface VocationProps extends BaseModuleProps { academyXp: number; completedCourses: string[]; onCompleteCourse: (id: string) => void; }

export function VocationAcademyModule({ language, onSpeak, onTrace, runAgent, notify, stageSafeMode, academyXp, completedCourses, onCompleteCourse }: VocationProps) {
  const [profile, setProfile] = useState('creator');
  const [income, setIncome] = useState(1000);
  const [inflation, setInflation] = useState(5);
  const [openLesson, setOpenLesson] = useState(0);
  const [viewed, setViewed] = useState([0]);
  const [busy, setBusy] = useState(false);
  const [coach, setCoach] = useState<(AgentResult & { language: string; profile: string }) | null>(null);
  const w = (en: string, th: string, es: string) => words(language, en, th, es);
  const completed = completedCourses.includes('academy-intro');
  const profiles = [
    { id: 'creator', icon: '✦', title: w('Creator & freelancer', 'ครีเอเตอร์และฟรีแลนซ์', 'Creador y freelancer'), text: w('Make your work travel further.', 'ให้ผลงานของคุณไปได้ไกลขึ้น', 'Haz que tu trabajo llegue más lejos.') },
    { id: 'merchant', icon: '⌂', title: w('Local entrepreneur', 'เจ้าของธุรกิจท้องถิ่น', 'Emprendedor local'), text: w('Welcome customers from anywhere.', 'ต้อนรับลูกค้าจากทุกที่', 'Recibe clientes de cualquier lugar.') },
    { id: 'family', icon: '♡', title: w('Family saver', 'ผู้ออมเพื่อครอบครัว', 'Ahorrador en familia'), text: w('Plan for everyday peace of mind.', 'วางแผนเพื่อความอุ่นใจทุกวัน', 'Planifica la tranquilidad cotidiana.') },
  ];
  const lessons = [
    { term: w('Non-custodial account', 'บัญชีที่คุณดูแลเอง', 'Cuenta bajo tu control'), human: w('A digital safe that only you can open.', 'ตู้เซฟดิจิทัลที่มีแค่คุณเปิดได้', 'Una caja fuerte digital que solo tú puedes abrir.'), example: w('You keep control. A payment needs your approval.', 'คุณยังควบคุมเงิน การจ่ายต้องผ่านการยืนยันของคุณ', 'Tú mantienes el control. Cada pago necesita tu aprobación.') },
    { term: w('Stablecoin', 'เงินดิจิทัลอิงสกุลเงิน', 'Moneda digital estable'), human: w('Digital money designed to follow a familiar currency.', 'เงินดิจิทัลที่ออกแบบให้มูลค่าตามสกุลที่คุ้นเคย', 'Dinero digital diseñado para seguir una moneda conocida.'), example: w('Think of digital dollars you can use across borders.', 'นึกถึงดอลลาร์ดิจิทัลที่ใช้ข้ามพรมแดนได้', 'Piensa en dólares digitales que puedes usar entre países.') },
    { term: w('Tokenized real-world asset', 'สินทรัพย์จริงในรูปดิจิทัล', 'Activo real digitalizado'), human: w('A small digital share tied to something real.', 'ส่วนเล็ก ๆ ในรูปดิจิทัลที่ผูกกับสิ่งของจริง', 'Una pequeña participación digital vinculada a algo real.'), example: w('For example, $10 linked to gold instead of a whole gold bar.', 'เช่น มูลค่า $10 ที่ผูกกับทอง แทนการซื้อทองทั้งแท่ง', 'Por ejemplo, $10 vinculados al oro en vez de comprar un lingote.') },
  ];
  const coachText = coach?.language === language && coach.profile === profile ? coach.text : coach?.source === 'stage-safe' ? stageSafeAnswer(`coach-${profile}`, language) : '';
  const askCoach = async () => {
    setBusy(true);
    try {
      const start = performance.now();
      const result = await runAgent(`coach-${profile}`, `Explain practical money choices for a ${profile} with monthly income ${income} USD. Use the selected language.`);
      setCoach({ ...result, language, profile });
      const trace = makeTrace('vocation', 'plainLanguageCoach', { profile, income, language, source: result.source }, 'Returned a lesson with its actual source.');
      trace.latencyMs = Math.round(performance.now() - start);
      onTrace(trace);
    } catch (error) { notify((error as Error).message); } finally { setBusy(false); }
  };
  const complete = () => {
    if (viewed.length !== 3 || completed) return;
    onCompleteCourse('academy-intro');
    onTrace(makeTrace('vocation', 'completeAcademySandbox', { profile, lessonsViewed: viewed.length }, 'Awarded 50 XP once and added 4 harmony points.'));
  };
  return <div className="module vocation-module">
    <ModuleHeader pillar="vocation" language={language} title={w('Grow a little, every day', 'เติบโตทีละนิดทุกวัน', 'Crece un poco, cada día')} description={w('Useful skills. Clear explanations. A little more confidence with your money.', 'ทักษะที่ใช้ได้ คำอธิบายชัดเจน และความมั่นใจเรื่องเงินที่เพิ่มขึ้น', 'Habilidades útiles. Explicaciones claras. Más confianza con tu dinero.')} badge={`${academyXp} XP`} />
    <section className="module-section"><SectionHeading step="1" title={w('Which sounds like you?', 'แบบไหนใกล้เคียงคุณ', '¿Cuál se parece a ti?')} /><div className="choice-grid profile-grid">{profiles.map((item) => <button key={item.id} aria-pressed={profile === item.id} className={`choice-card ${profile === item.id ? 'active' : ''}`} onClick={() => setProfile(item.id)}><span className="choice-icon">{item.icon}</span><strong>{item.title}</strong><small>{item.text}</small><i>{profile === item.id ? '✓' : ''}</i></button>)}</div></section>
    <section className="module-section"><SectionHeading step="2" title={w('Three ideas, in human language', 'สามเรื่องง่าย ๆ ในภาษาคน', 'Tres ideas en palabras sencillas')} description={w('Open each lesson to complete your introduction.', 'เปิดอ่านแต่ละบทเพื่อเรียนบทนำให้จบ', 'Abre cada lección para completar tu introducción.')} /><div className="lesson-stack">{lessons.map((lesson, index) => <button key={index} aria-expanded={openLesson === index} className={`lesson-card ${openLesson === index ? 'open' : ''}`} onClick={() => { setOpenLesson(index); setViewed((current) => [...new Set([...current, index])]); }}><span>{viewed.includes(index) ? '✓' : index + 1}</span><div><small>{w('YOU MAY HEAR', 'คำที่อาจได้ยิน', 'QUIZÁ ESCUCHES')}</small><strong>{lesson.term}</strong>{openLesson === index && <div className="human-meaning"><small>{w('WHAT IT MEANS FOR YOU', 'ความหมายสำหรับคุณ', 'LO QUE SIGNIFICA PARA TI')}</small><p>{lesson.human}</p><em>{lesson.example}</em></div>}</div><b>{openLesson === index ? '−' : '+'}</b></button>)}</div>
      <div className="inline-actions"><button className="secondary-action" onClick={() => onSpeak(lessons.map((lesson) => `${lesson.human} ${lesson.example}`).join(' '))}>◉ {w('Listen to the summary', 'ฟังสรุปบทเรียน', 'Escuchar el resumen')}</button><button className="secondary-action" disabled={busy} onClick={askCoach}>✦ {busy ? w('Thinking…', 'กำลังคิด…', 'Pensando…') : w('Ask my coach', 'ถามโค้ชของฉัน', 'Preguntar a mi guía')}</button></div>
      {coachText && <div className="coach-answer" aria-live="polite"><span>◉</span><p><AgentSourceNote source={coach?.language === language && coach.profile === profile ? coach.source : 'stage-safe'} language={language} />{coachText}</p><button onClick={() => onSpeak(coachText)}>{w('Listen', 'ฟัง', 'Escuchar')}</button></div>}
    </section>
    <details className="calculator-disclosure"><summary>{w('Explore your fee & savings calculator', 'ลองเครื่องคำนวณค่าธรรมเนียมและเงินออม', 'Explora tu calculadora de comisiones y ahorro')}</summary><section className="module-section calculator"><SectionHeading step="3" title={w('Keep more of what you earn', 'เก็บรายได้ไว้ได้มากขึ้น', 'Conserva más de lo que ganas')} description={w('Explore a fee and purchasing-power example.', 'ลองคำนวณค่าธรรมเนียมและกำลังซื้อ', 'Explora un ejemplo de comisiones y poder de compra.')} /><label className="range-label" htmlFor="monthly-income"><span>{w('Monthly income or transfer', 'รายรับหรือยอดโอนต่อเดือน', 'Ingreso o transferencia mensual')}</span><strong>{money(income, language)}</strong></label><input id="monthly-income" type="range" min="100" max="3000" step="100" value={income} onChange={(event) => setIncome(Number(event.target.value))} />
      <div className="comparison"><div className="old-way"><small>{w('ILLUSTRATIVE 14% FEE', 'ค่าธรรมเนียมตัวอย่าง 14%', 'COMISIÓN ILUSTRATIVA DEL 14%')}</small><strong>−{money(income * .14, language)}</strong><p>{w('Lost to the transfer cost in this example.', 'เสียไปกับค่าโอนในตัวอย่างนี้', 'Costo de transferencia en este ejemplo.')}</p></div><div className="new-way"><small>{w('0% TRANSFER FEE EXAMPLE', 'ตัวอย่างค่าโอน 0%', 'EJEMPLO CON 0% DE COMISIÓN')}</small><strong>{money(income * .14, language)}</strong><p>{w('More stays available for your life.', 'เหลือไว้ใช้กับชีวิตได้มากขึ้น', 'Más dinero disponible para tu vida.')}</p></div></div>
      <label className="range-label inflation-label" htmlFor="inflation"><span>{w('Annual inflation example', 'ตัวอย่างเงินเฟ้อต่อปี', 'Ejemplo de inflación anual')}</span><strong>{inflation}%</strong></label><input id="inflation" type="range" min="0" max="20" value={inflation} onChange={(event) => setInflation(Number(event.target.value))} /><p className="calculator-note">{w('After one year,', 'หลังผ่านไปหนึ่งปี', 'Tras un año,')} {money(income, language)} {w('would buy about', 'จะมีกำลังซื้อประมาณ', 'compraría aproximadamente')} {money(income / (1 + inflation / 100), language)} {w('of today’s goods. Compare currencies and savings choices with your coach.', 'ของสินค้าในวันนี้ ลองเปรียบเทียบสกุลเงินและทางเลือกออมกับโค้ช', 'de los bienes de hoy. Compara monedas y opciones de ahorro con tu guía.')}</p>
    </section></details>
    <button className={`primary-action vocation-action ${completed ? 'completed' : ''}`} onClick={complete} disabled={viewed.length < 3 || completed}><span>{completed ? '✓' : '✦'}</span><span><strong>{completed ? w('Completed · 50 XP earned', 'เรียนจบแล้ว · รับ 50 XP', 'Completado · 50 XP ganados') : w('Complete my learning sandbox', 'เรียนบททดลองให้สำเร็จ', 'Completar mi aprendizaje')}</strong><small>{completed ? w('Your progress is saved.', 'บันทึกความคืบหน้าแล้ว', 'Tu progreso está guardado.') : `${viewed.length}/3 · ${w('Read all three lessons · +50 XP, +4 harmony', 'อ่านครบสามบท · +50 XP, +4 สมดุล', 'Lee las tres lecciones · +50 XP, +4 equilibrio')}`}</small></span><b>→</b></button>
  </div>;
}
