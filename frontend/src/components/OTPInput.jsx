import { useRef } from 'react';

export default function OTPInput({ value, onChange }) {
  const refs = useRef([]);

  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  const update = (index, digit) => {
    const cleanDigit = digit.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleanDigit || ' ';
    onChange(next.join('').replace(/\s/g, ''));

    if (cleanDigit && index < 5) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit.trim()}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className="h-12 w-12 rounded-lg border border-app-border bg-app-bg text-center text-lg font-bold text-app-text outline-none ring-app-accent focus:ring-2"
          maxLength={1}
        />
      ))}
    </div>
  );
}
