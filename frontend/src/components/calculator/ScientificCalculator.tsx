import { useState, useEffect, useCallback } from 'react';

type AngleMode = 'DEG' | 'RAD';

interface CalcState {
  display: string;
  expression: string;
  memory: number;
  angleMode: AngleMode;
  waitingForOperand: boolean;
  pendingOp: string | null;
  pendingValue: number | null;
}

const PHYSICS_CONSTANTS: { label: string; value: number; unit: string }[] = [
  { label: 'c', value: 3e8, unit: 'מ/ש — מהירות האור' },
  { label: 'g', value: 9.8, unit: 'מ/ש² — תאוצת כבידה' },
  { label: 'G', value: 6.674e-11, unit: 'נ·מ²/ק"ג² — קבוע כבידה' },
  { label: 'h', value: 6.626e-34, unit: 'ג·ש — קבוע פלנק' },
  { label: 'e', value: 1.602e-19, unit: 'ק — מטען אלקטרון' },
  { label: 'k', value: 8.99e9, unit: 'נ·מ²/ק² — קבוע קולון' },
  { label: 'mₑ', value: 9.109e-31, unit: 'ק"ג — מסת אלקטרון' },
  { label: 'mₚ', value: 1.673e-27, unit: 'ק"ג — מסת פרוטון' },
  { label: 'Nₐ', value: 6.022e23, unit: 'mol⁻¹ — אבוגדרו' },
  { label: 'R', value: 8.314, unit: 'ג/mol·K — קבוע גז' },
];

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function fmt(n: number): string {
  if (isNaN(n)) return 'שגיאה';
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}

export function ScientificCalculator() {
  const [state, setState] = useState<CalcState>({
    display: '0',
    expression: '',
    memory: 0,
    angleMode: 'DEG',
    waitingForOperand: false,
    pendingOp: null,
    pendingValue: null,
  });
  const [showConstants, setShowConstants] = useState(false);

  const inputDigit = useCallback((digit: string) => {
    setState(s => {
      if (s.waitingForOperand) return { ...s, display: digit, waitingForOperand: false };
      if (s.display === '0' && digit !== '.') return { ...s, display: digit };
      if (digit === '.' && s.display.includes('.')) return s;
      return { ...s, display: s.display + digit };
    });
  }, []);

  const applyOp = (a: number, op: string, b: number): number => {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      case 'xʸ': return Math.pow(a, b);
      default: return b;
    }
  };

  const calculate = useCallback(() => {
    setState(s => {
      const cur = parseFloat(s.display);
      if (s.pendingOp && s.pendingValue !== null) {
        const result = applyOp(s.pendingValue, s.pendingOp, cur);
        return { ...s, display: fmt(result), expression: '', pendingOp: null, pendingValue: null, waitingForOperand: true };
      }
      return s;
    });
  }, []);

  const pressOp = useCallback((op: string) => {
    setState(s => {
      const cur = parseFloat(s.display);
      if (s.pendingOp && !s.waitingForOperand) {
        const result = applyOp(s.pendingValue!, s.pendingOp, cur);
        return { ...s, display: fmt(result), expression: `${fmt(result)} ${op}`, pendingOp: op, pendingValue: result, waitingForOperand: true };
      }
      return { ...s, expression: `${fmt(cur)} ${op}`, pendingOp: op, pendingValue: cur, waitingForOperand: true };
    });
  }, []);

  const applyFn = useCallback((fn: string) => {
    setState(s => {
      const x = parseFloat(s.display);
      let result: number;
      const toAngle = s.angleMode === 'DEG' ? toRad : (r: number) => r;
      switch (fn) {
        case 'sin': result = Math.sin(toAngle(x)); break;
        case 'cos': result = Math.cos(toAngle(x)); break;
        case 'tan': result = Math.tan(toAngle(x)); break;
        case 'sin⁻¹': result = s.angleMode === 'DEG' ? (Math.asin(x) * 180) / Math.PI : Math.asin(x); break;
        case 'cos⁻¹': result = s.angleMode === 'DEG' ? (Math.acos(x) * 180) / Math.PI : Math.acos(x); break;
        case 'tan⁻¹': result = s.angleMode === 'DEG' ? (Math.atan(x) * 180) / Math.PI : Math.atan(x); break;
        case '√': result = Math.sqrt(x); break;
        case 'x²': result = x * x; break;
        case 'log': result = Math.log10(x); break;
        case 'ln': result = Math.log(x); break;
        case '10ˣ': result = Math.pow(10, x); break;
        case '1/x': result = 1 / x; break;
        case '+/−': result = -x; break;
        case '%': result = x / 100; break;
        default: result = x;
      }
      return { ...s, display: fmt(result), waitingForOperand: true };
    });
  }, []);

  const clear = () => setState(s => ({
    ...s, display: '0', expression: '', pendingOp: null, pendingValue: null, waitingForOperand: false,
  }));

  const backspace = () => setState(s => {
    if (s.waitingForOperand || s.display.length <= 1) return { ...s, display: '0' };
    return { ...s, display: s.display.slice(0, -1) };
  });

  const memOp = (op: string) => setState(s => {
    const x = parseFloat(s.display);
    switch (op) {
      case 'MC': return { ...s, memory: 0 };
      case 'MR': return { ...s, display: fmt(s.memory), waitingForOperand: true };
      case 'M+': return { ...s, memory: s.memory + x };
      case 'M−': return { ...s, memory: s.memory - x };
      case 'MS': return { ...s, memory: x };
      default: return s;
    }
  });

  const insertConstant = (val: number) => setState(s => ({ ...s, display: fmt(val), waitingForOperand: true }));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ('0123456789'.includes(e.key)) inputDigit(e.key);
      else if (e.key === '.') inputDigit('.');
      else if (e.key === '+') pressOp('+');
      else if (e.key === '-') pressOp('−');
      else if (e.key === '*') pressOp('×');
      else if (e.key === '/') { e.preventDefault(); pressOp('÷'); }
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') clear();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputDigit, pressOp, calculate]);

  const btn = (label: string, action: () => void, cls = '') => (
    <button
      key={label}
      onClick={action}
      className={`rounded-lg text-sm font-medium py-3 transition-all active:scale-95 ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-72 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl select-none" dir="ltr">
      {/* Display */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-gray-400 text-xs h-5 text-left truncate">{state.expression || '\u00A0'}</div>
        <div className="text-white text-3xl font-light text-right truncate mt-1">{state.display}</div>
        <div className="flex justify-between mt-1">
          <button
            onClick={() => setState(s => ({ ...s, angleMode: s.angleMode === 'DEG' ? 'RAD' : 'DEG' }))}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {state.angleMode}
          </button>
          <span className="text-xs text-gray-500">{state.memory !== 0 ? `M=${fmt(state.memory)}` : ''}</span>
        </div>
      </div>

      {/* Physics constants toggle */}
      <button
        onClick={() => setShowConstants(v => !v)}
        className="w-full text-xs text-center py-1.5 bg-gray-800 text-amber-400 hover:bg-gray-700 transition-colors"
      >
        {showConstants ? '▲ הסתר קבועים' : '▼ קבועים פיזיקליים'}
      </button>

      {showConstants && (
        <div className="bg-gray-800 px-3 py-2 max-h-40 overflow-y-auto">
          {PHYSICS_CONSTANTS.map(c => (
            <button
              key={c.label}
              onClick={() => insertConstant(c.value)}
              className="w-full text-right text-xs py-1.5 px-2 rounded hover:bg-gray-700 flex justify-between items-center"
            >
              <span className="text-amber-300 font-mono font-bold">{c.label}</span>
              <span className="text-gray-400 mr-2">{c.unit}</span>
            </button>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="px-3 pb-3 pt-2 grid grid-cols-4 gap-1.5">
        {/* Row 1: trig */}
        {btn('sin', () => applyFn('sin'), 'bg-gray-700 text-cyan-300 col-span-1')}
        {btn('cos', () => applyFn('cos'), 'bg-gray-700 text-cyan-300')}
        {btn('tan', () => applyFn('tan'), 'bg-gray-700 text-cyan-300')}
        {btn('π', () => insertConstant(Math.PI), 'bg-gray-700 text-amber-300')}

        {/* Row 2: inverse + powers */}
        {btn('sin⁻¹', () => applyFn('sin⁻¹'), 'bg-gray-700 text-cyan-400 text-xs')}
        {btn('cos⁻¹', () => applyFn('cos⁻¹'), 'bg-gray-700 text-cyan-400 text-xs')}
        {btn('√', () => applyFn('√'), 'bg-gray-700 text-cyan-300')}
        {btn('x²', () => applyFn('x²'), 'bg-gray-700 text-cyan-300')}

        {/* Row 3: log + power */}
        {btn('log', () => applyFn('log'), 'bg-gray-700 text-purple-300')}
        {btn('ln', () => applyFn('ln'), 'bg-gray-700 text-purple-300')}
        {btn('10ˣ', () => applyFn('10ˣ'), 'bg-gray-700 text-purple-300')}
        {btn('xʸ', () => pressOp('xʸ'), 'bg-gray-700 text-purple-300')}

        {/* Row 4: memory */}
        {btn('MC', () => memOp('MC'), 'bg-gray-700 text-gray-300 text-xs')}
        {btn('MR', () => memOp('MR'), 'bg-gray-700 text-gray-300 text-xs')}
        {btn('M+', () => memOp('M+'), 'bg-gray-700 text-gray-300 text-xs')}
        {btn('M−', () => memOp('M−'), 'bg-gray-700 text-gray-300 text-xs')}

        {/* Row 5 */}
        {btn('AC', clear, 'bg-red-700 hover:bg-red-600 text-white')}
        {btn('+/−', () => applyFn('+/−'), 'bg-gray-600 text-white')}
        {btn('%', () => applyFn('%'), 'bg-gray-600 text-white')}
        {btn('÷', () => pressOp('÷'), 'bg-amber-500 hover:bg-amber-400 text-white')}

        {/* Digits 7-9 + × */}
        {btn('7', () => inputDigit('7'), 'bg-gray-600 text-white')}
        {btn('8', () => inputDigit('8'), 'bg-gray-600 text-white')}
        {btn('9', () => inputDigit('9'), 'bg-gray-600 text-white')}
        {btn('×', () => pressOp('×'), 'bg-amber-500 hover:bg-amber-400 text-white')}

        {/* Digits 4-6 + − */}
        {btn('4', () => inputDigit('4'), 'bg-gray-600 text-white')}
        {btn('5', () => inputDigit('5'), 'bg-gray-600 text-white')}
        {btn('6', () => inputDigit('6'), 'bg-gray-600 text-white')}
        {btn('−', () => pressOp('−'), 'bg-amber-500 hover:bg-amber-400 text-white')}

        {/* Digits 1-3 + + */}
        {btn('1', () => inputDigit('1'), 'bg-gray-600 text-white')}
        {btn('2', () => inputDigit('2'), 'bg-gray-600 text-white')}
        {btn('3', () => inputDigit('3'), 'bg-gray-600 text-white')}
        {btn('+', () => pressOp('+'), 'bg-amber-500 hover:bg-amber-400 text-white')}

        {/* Bottom row */}
        {btn('0', () => inputDigit('0'), 'bg-gray-600 text-white col-span-1')}
        {btn('.', () => inputDigit('.'), 'bg-gray-600 text-white')}
        {btn('⌫', backspace, 'bg-gray-600 text-white')}
        {btn('=', calculate, 'bg-blue-600 hover:bg-blue-500 text-white')}
      </div>
    </div>
  );
}
