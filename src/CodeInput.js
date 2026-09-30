import React, { useEffect, useRef, useState } from 'react';

export default function CodeInput({
  length,
  value,
  onChange,
  onComplete = () => {},
  ref,
  ...props
}) {
  const ruler = useRef();
  const internalRef = useRef();
  const inputRef = ref || internalRef;
  const [charWidth, setCharWidth] = useState(0);
  const [charHeight, setCharHeight] = useState(0);
  const [focus, setFocus] = useState(false);
  const charIndex = value.length;

  useEffect(() => {
    const rect = ruler.current.getBoundingClientRect();
    setCharWidth(rect.width / length);
    setCharHeight(rect.height);
    inputRef.current.focus();
  }, []);

  return (
    <div
      className="code-input"
      style={{ caretColor: charIndex === length ? 'transparent' : undefined }}
    >
      <input
        // Lets browsers suggest the code straight from the email
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        minLength={length}
        maxLength={length}
        className="code-input-input"
        {...props}
        value={value}
        onChange={e => {
          const newValue = e.target.value.replace(/\D/g, '').slice(0, length);
          onChange(newValue);
          if (newValue.length === length) {
            onComplete(newValue);
          }
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ textIndent: charWidth * 0.33 }}
        autoCorrect="off"
        autoCapitalize="none"
        ref={inputRef}
      />
      <div className="code-input-boxes">
        {charWidth
          ? Array(length)
              .fill({})
              .map((o, i) => (
                <div
                  key={i}
                  className={`code-input-box ${
                    focus && charIndex === i ? 'code-input-box-active' : ''
                  }`}
                  style={{
                    width: charWidth - 4,
                    height: charHeight + 10,
                    marginRight: 2,
                    marginLeft: 2,
                  }}
                />
              ))
          : null}
      </div>
      <span ref={ruler} className="code-input-ruler">
        {Array(length).fill('1').join('')}
      </span>
    </div>
  );
}
