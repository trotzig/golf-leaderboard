import React, { useEffect, useRef, useState } from 'react';

export default function CodeInput({ length, ...props }) {
  const ruler = useRef();
  const [charWidth, setCharWidth] = useState(0);
  const [charHeight, setCharHeight] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    const rect = ruler.current.getBoundingClientRect();
    setCharWidth(rect.width / 4);
    setCharHeight(rect.height);
  }, []);
  return (
    <div
      className="code-input"
      style={{ caretColor: charIndex === 4 ? 'transparent' : undefined }}
    >
      <input
        autoComplete="off"
        pattern="[a-z0-9]+"
        minLength={length}
        maxLength={length}
        className="code-input-input"
        {...props}
        onChange={e => {
          const len = e.target.value.length;
          setCharIndex(len);
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ textIndent: charWidth * 0.33 }}
        autoCorrect="off"
        autoCapitalize="none"
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
