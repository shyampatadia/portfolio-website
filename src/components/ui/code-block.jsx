"use client";

import React from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export const CodeBlock = ({
  language,
  filename,
  code,
  highlightLines = [],
  tabs = [],
}) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [syntaxHighlighter, setSyntaxHighlighter] = React.useState(null);
  const [syntaxTheme, setSyntaxTheme] = React.useState(null);

  const tabsExist = tabs.length > 0;

  React.useEffect(() => {
    let mounted = true;

    async function loadHighlighter() {
      const [highlighterModule, themeModule] = await Promise.all([
        import("react-syntax-highlighter/dist/esm/prism-async-light"),
        import("react-syntax-highlighter/dist/esm/styles/prism/atom-dark"),
      ]);

      if (!mounted) return;

      setSyntaxHighlighter(() => highlighterModule.default);
      setSyntaxTheme(themeModule.default || themeModule.atomDark);
    }

    loadHighlighter();

    return () => {
      mounted = false;
    };
  }, []);

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].code : code;
    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language;
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 p-4 font-mono text-sm shadow-[0_18px_42px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col gap-2">
        {tabsExist ? (
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`code-tab-button px-3 py-2 font-sans text-xs transition-colors ${
                  activeTab === index
                    ? "text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        ) : null}

        {!tabsExist && filename ? (
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0 truncate text-xs text-zinc-400">{filename}</div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="code-copy-button flex shrink-0 items-center justify-center gap-1 font-sans text-xs text-zinc-400 transition-colors hover:text-zinc-200"
              aria-label="Copy code"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </button>
          </div>
        ) : null}
      </div>

      {syntaxHighlighter && syntaxTheme ? (
        React.createElement(
          syntaxHighlighter,
          {
            language: activeLanguage,
            style: syntaxTheme,
            customStyle: {
              margin: 0,
              padding: 0,
              background: "transparent",
              fontSize: "0.875rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            },
            wrapLines: true,
            wrapLongLines: false,
            showLineNumbers: true,
            lineProps: (lineNumber) => ({
              style: {
                backgroundColor: activeHighlightLines.includes(lineNumber)
                  ? "rgba(248,250,252,0.1)"
                  : "transparent",
                display: "block",
                width: "100%",
              },
            }),
            PreTag: "div",
          },
          String(activeCode || ""),
        )
      ) : (
        <pre className="overflow-x-auto pb-1 text-[0.875rem] leading-6 text-zinc-100">
          <code>{String(activeCode || "")}</code>
        </pre>
      )}
    </div>
  );
};
