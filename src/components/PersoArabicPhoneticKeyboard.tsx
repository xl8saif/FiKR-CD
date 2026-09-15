import React, { useState } from 'react';
import { Delete, Space, Sparkles, Keyboard as KeyboardIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { SpecializedIkCharacter } from '../types';

interface PersoArabicPhoneticKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClear?: () => void;
  specialIkChars?: SpecializedIkCharacter[];
}

interface KeyItem {
  key: string;
  char: string;
  latin: string;
  isIk?: boolean;
  name?: string;
}

export const PersoArabicPhoneticKeyboard: React.FC<PersoArabicPhoneticKeyboardProps> = ({
  onInsertChar,
  onBackspace,
  onSpace,
  onClear,
  specialIkChars = []
}) => {
  const [isShift, setIsShift] = useState(false);
  const [activeTab, setActiveTab] = useState<'phonetic' | 'ik_special' | 'diacritics' | 'digits'>('phonetic');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Top Direct-Access Bar: 5 Indus-Kohistani Glyphs + Frequent Retroflexes / Digraphs (NO SHIFT NEEDED)
  const directQuickGlyphs: KeyItem[] = [
    { key: 'čh', char: 'ڇ', latin: 'čh', isIk: true, name: 'Tcheh' },
    { key: 'ts', char: 'څ', latin: 'ts', isIk: true, name: 'Tse' },
    { key: 'ṣ̌', char: 'ݜ', latin: 'ṣ̌', isIk: true, name: 'Seen 4-dots' },
    { key: 'ṛ', char: 'ڙ', latin: 'ṛ', isIk: true, name: 'Reh 4-dots' },
    { key: 'ṇ', char: 'ݨ', latin: 'ṇ', isIk: true, name: 'Noon tah' },
    { key: 'T', char: 'ٹ', latin: 'ṭ', name: 'Teh retroflex' },
    { key: 'D', char: 'ڈ', latin: 'ḍ', name: 'Dal retroflex' },
    { key: 'R', char: 'ڑ', latin: 'ṛ', name: 'Reh retroflex' },
    { key: 'H', char: 'ھ', latin: 'h', name: 'Do-Chashmi He' },
    { key: 'A', char: 'آ', latin: 'ā', name: 'Alif Madd' },
    { key: 'N', char: 'ں', latin: 'n', name: 'Noon Ghunna' },
  ];

  // Primary Default Rows (Extracted outside of Shift so users can type directly without pressing shift)
  const normalRow1: KeyItem[] = [
    { key: 'q', char: 'ق', latin: 'q' },
    { key: 'w', char: 'و', latin: 'w' },
    { key: 'e', char: 'ع', latin: 'e' },
    { key: 'r', char: 'ر', latin: 'r' },
    { key: 't', char: 'ت', latin: 't' },
    { key: 'y', char: 'ے', latin: 'y' },
    { key: 'u', char: 'ء', latin: 'u' },
    { key: 'i', char: 'ی', latin: 'i' },
    { key: 'o', char: 'ہ', latin: 'o' },
    { key: 'p', char: 'پ', latin: 'p' },
  ];

  const normalRow2: KeyItem[] = [
    { key: 'a', char: 'ا', latin: 'a' },
    { key: 's', char: 'س', latin: 's' },
    { key: 'd', char: 'د', latin: 'd' },
    { key: 'f', char: 'ف', latin: 'f' },
    { key: 'g', char: 'گ', latin: 'g' },
    { key: 'h', char: 'ح', latin: 'h' },
    { key: 'j', char: 'ج', latin: 'j' },
    { key: 'k', char: 'ک', latin: 'k' },
    { key: 'l', char: 'ل', latin: 'l' },
    { key: 'kh', char: 'خ', latin: 'kh' },
  ];

  const normalRow3: KeyItem[] = [
    { key: 'z', char: 'ز', latin: 'z' },
    { key: 'x', char: 'ش', latin: 'sh' },
    { key: 'c', char: 'چ', latin: 'ch' },
    { key: 'v', char: 'ط', latin: 't' },
    { key: 'b', char: 'ب', latin: 'b' },
    { key: 'n', char: 'ن', latin: 'n' },
    { key: 'm', char: 'م', latin: 'm' },
    { key: 's2', char: 'ص', latin: 's' },
    { key: 'z2', char: 'ض', latin: 'z' },
    { key: 'gh', char: 'غ', latin: 'gh' },
  ];

  // Shift Layer: Secondary & Classical Glyphs / Rare Perso-Arabic extensions
  const shiftRow1: KeyItem[] = [
    { key: 'Q', char: 'ظ', latin: 'z' },
    { key: 'W', char: 'ؤ', latin: 'w' },
    { key: 'E', char: 'ٰ', latin: 'ā' },
    { key: 'R', char: 'ڙ', latin: 'ṛ (IK)', isIk: true },
    { key: 'T', char: 'ٹ', latin: 'ṭ' },
    { key: 'Y', char: 'ئ', latin: 'y' },
    { key: 'U', char: 'ء', latin: 'hamza' },
    { key: 'I', char: 'ڑ', latin: 'ṛ' },
    { key: 'O', char: 'ۃ', latin: 'ah' },
    { key: 'P', char: 'ُ', latin: 'u' },
  ];

  const shiftRow2: KeyItem[] = [
    { key: 'A', char: 'آ', latin: 'ā' },
    { key: 'S', char: 'ݜ', latin: 'ṣ̌ (IK)', isIk: true },
    { key: 'D', char: 'ڈ', latin: 'ḍ' },
    { key: 'F', char: 'ْ', latin: 'sukun' },
    { key: 'G', char: 'غ', latin: 'gh' },
    { key: 'H', char: 'ھ', latin: 'h' },
    { key: 'J', char: 'ض', latin: 'z' },
    { key: 'K', char: 'خ', latin: 'kh' },
    { key: 'L', char: 'ص', latin: 's' },
    { key: 'L2', char: 'ث', latin: 'th' },
  ];

  const shiftRow3: KeyItem[] = [
    { key: 'Z', char: 'څ', latin: 'ts (IK)', isIk: true },
    { key: 'X', char: 'ژ', latin: 'zh' },
    { key: 'C', char: 'ڇ', latin: 'čh (IK)', isIk: true },
    { key: 'V', char: 'ظ', latin: 'z' },
    { key: 'B', char: 'ذ', latin: 'dh' },
    { key: 'N', char: 'ݨ', latin: 'ṇ (IK)', isIk: true },
    { key: 'M', char: 'ں', latin: 'n' },
    { key: 'M2', char: 'ّ', latin: 'shaddah' },
    { key: 'M3', char: 'َ', latin: 'a' },
    { key: 'M4', char: 'ِ', latin: 'i' },
  ];

  // Diacritics & Vocalization (ایراب)
  const diacritics = [
    { char: 'َ', name: 'Zabar', latin: 'a' },
    { char: 'ِ', name: 'Zer', latin: 'i' },
    { char: 'ُ', name: 'Pesh', latin: 'u' },
    { char: 'ً', name: 'Do Zabar', latin: 'an' },
    { char: 'ٍ', name: 'Do Zer', latin: 'in' },
    { char: 'ٌ', name: 'Do Pesh', latin: 'un' },
    { char: 'ّ', name: 'Tashdeed', latin: 'geminate' },
    { char: 'ْ', name: 'Sukun', latin: 'silent' },
    { char: 'ٰ', name: 'Khari Zabar', latin: 'aa' },
    { char: 'ٖ', name: 'Khari Zer', latin: 'ee' },
    { char: 'ٗ', name: 'Ulta Pesh', latin: 'oo' },
    { char: 'ٓ', name: 'Maddah', latin: 'madd' },
  ];

  // Perso-Arabic Digits & Punctuation
  const digitsPunctuation = [
    { char: '۰', label: '0' },
    { char: '۱', label: '1' },
    { char: '۲', label: '2' },
    { char: '۳', label: '3' },
    { char: '۴', label: '4' },
    { char: '۵', label: '5' },
    { char: '۶', label: '6' },
    { char: '۷', label: '7' },
    { char: '۸', label: '8' },
    { char: '۹', label: '9' },
    { char: '،', label: '،' },
    { char: '؛', label: '؛' },
    { char: '؟', label: '؟' },
    { char: '۔', label: '۔' },
    { char: '«', label: '«' },
    { char: '»', label: '»' },
    { char: '٪', label: '٪' },
  ];

  const currentRows = isShift
    ? [shiftRow1, shiftRow2, shiftRow3]
    : [normalRow1, normalRow2, normalRow3];

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-lg overflow-hidden text-xs">
      {/* Keyboard Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 gap-2">
        <div className="flex items-center gap-2">
          <KeyboardIcon className="h-4 w-4 text-[#C9A66B] shrink-0" />
          <span className="font-semibold text-zinc-200 text-xs truncate">
            Perso-Arabic & Indus-Kohistani Keyboard
          </span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#C9A66B]/15 text-[#D4B582] border border-[#C9A66B]/30 font-medium">
            {isShift ? '⇧ Shift' : 'Direct Layout'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Mode Switchers */}
          <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('phonetic')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === 'phonetic'
                  ? 'bg-[#C9A66B] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Main
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ik_special')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === 'ik_special'
                  ? 'bg-[#C9A66B] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              IK Glyphs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diacritics')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === 'diacritics'
                  ? 'bg-[#C9A66B] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ایراب
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('digits')}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === 'digits'
                  ? 'bg-[#C9A66B] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ۱۲۳
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title={isCollapsed ? 'Expand Keyboard' : 'Collapse Keyboard'}
            aria-label="Toggle Keyboard"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 sm:p-3 space-y-2">
          {/* Direct Outer Glyphs Bar (Extracted from Shift to Outside: ڇ, څ, ݜ, ڙ, ݨ, ٹ, ڈ, ڑ, ھ, آ, ں) */}
          <div className="rounded-lg bg-zinc-900/90 p-1.5 border border-[#C9A66B]/40 shadow-xs">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#C9A66B]" />
                <span className="text-[10px] font-semibold text-zinc-300">
                  Direct Glyphs (کوئی شفٹ کی ضرورت نہیں):
                </span>
              </div>
              <span className="text-[9px] text-[#D4B582] font-mono">1-Click Insert</span>
            </div>
            
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 sm:gap-1.5" dir="rtl">
              {directQuickGlyphs.map((k) => (
                <button
                  key={k.key + k.char}
                  type="button"
                  onClick={() => onInsertChar(k.char)}
                  title={`${k.name || k.char} (${k.latin})`}
                  className={`flex flex-col items-center justify-center h-11 sm:h-12 rounded-lg transition shadow-xs cursor-pointer select-none active:scale-95 ${
                    k.isIk
                      ? 'bg-[#C9A66B]/25 hover:bg-[#C9A66B] text-white hover:text-zinc-950 border border-[#C9A66B]/60 hover:border-[#C9A66B]'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-700/80'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-kohistani font-bold leading-none">{k.char}</span>
                  <span className={`text-[8px] sm:text-[9px] font-mono leading-tight ${k.isIk ? 'text-[#D4B582]' : 'text-zinc-400'}`}>
                    {k.latin}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Primary Keyboard Layout */}
          {activeTab === 'phonetic' && (
            <div className="space-y-1.5 select-none" dir="rtl">
              {currentRows.map((row, rIdx) => (
                <div key={`row-${rIdx}`} className="flex justify-center gap-1 sm:gap-1.5 w-full">
                  {row.map((item) => {
                    const isSpecialIk = item.isIk;
                    return (
                      <button
                        key={item.key + item.char}
                        type="button"
                        onClick={() => onInsertChar(item.char)}
                        title={`${item.char} (${item.latin})`}
                        className={`flex flex-col items-center justify-center flex-1 min-w-0 h-11 sm:h-12 rounded-lg border transition shadow-xs cursor-pointer active:scale-95 ${
                          isSpecialIk
                            ? 'bg-[#C9A66B]/25 hover:bg-[#C9A66B] text-white hover:text-zinc-950 border-[#C9A66B]/70'
                            : 'bg-zinc-900 hover:bg-zinc-800 active:bg-[#C9A66B] active:text-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-100'
                        }`}
                      >
                        <span className="text-lg sm:text-2xl font-kohistani font-medium leading-none">{item.char}</span>
                        <span className={`text-[8px] sm:text-[9px] font-mono leading-tight truncate ${
                          isSpecialIk ? 'text-[#D4B582]' : 'text-zinc-500'
                        }`}>
                          {item.latin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Bottom Control Row (Shift, Space, Backspace, Punctuation) */}
              <div className="flex items-center justify-between gap-1 sm:gap-1.5 pt-1 w-full">
                {/* Shift Key */}
                <button
                  type="button"
                  onClick={() => setIsShift(!isShift)}
                  className={`flex items-center justify-center gap-1 px-2.5 sm:px-4 h-11 sm:h-12 rounded-lg border text-xs font-bold transition cursor-pointer shrink-0 ${
                    isShift
                      ? 'bg-[#C9A66B] border-[#C9A66B] text-zinc-950 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Toggle Shift (Rare secondary characters & accents)"
                >
                  <span className="text-sm">⇧</span>
                  <span className="hidden xs:inline">Shift</span>
                </button>

                {/* Common Punctuation Directly Outside */}
                <button
                  type="button"
                  onClick={() => onInsertChar('،')}
                  className="w-9 sm:w-11 h-11 sm:h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-lg sm:text-xl font-kohistani transition shrink-0"
                  title="Comma (،)"
                >
                  ،
                </button>
                <button
                  type="button"
                  onClick={() => onInsertChar('؟')}
                  className="w-9 sm:w-11 h-11 sm:h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-lg sm:text-xl font-kohistani transition shrink-0"
                  title="Question Mark (؟)"
                >
                  ؟
                </button>
                <button
                  type="button"
                  onClick={() => onInsertChar('۔')}
                  className="w-9 sm:w-11 h-11 sm:h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-lg sm:text-xl font-kohistani transition shrink-0"
                  title="Full Stop (۔)"
                >
                  ۔
                </button>

                {/* Spacebar */}
                <button
                  type="button"
                  onClick={onSpace}
                  className="flex-1 min-w-[80px] h-11 sm:h-12 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Space"
                >
                  <Space className="h-4 w-4 text-zinc-500" />
                  <span className="hidden sm:inline">Space (فاصلہ)</span>
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={onBackspace}
                  className="flex items-center justify-center gap-1 px-3 sm:px-4 h-11 sm:h-12 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0"
                  title="Backspace"
                >
                  <Delete className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Indus-Kohistani Detailed Glyphs & Guide */}
          {activeTab === 'ik_special' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5" dir="rtl">
                {specialIkChars.map((sc) => (
                  <button
                    key={sc.char + sc.unicode}
                    type="button"
                    onClick={() => onInsertChar(sc.char)}
                    className="p-3 sm:p-4 rounded-xl bg-zinc-900/90 hover:bg-[#C9A66B] text-zinc-100 hover:text-zinc-950 border border-zinc-800 hover:border-[#C9A66B] flex flex-col items-center gap-1.5 transition text-center group cursor-pointer"
                  >
                    <span className="text-3xl sm:text-4xl font-kohistani font-bold leading-tight">{sc.char}</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#D4B582] group-hover:text-zinc-950">
                      {sc.name}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-zinc-400 group-hover:text-zinc-900">
                      {sc.unicode}
                    </span>
                    <span className="text-[10px] sm:text-xs text-zinc-400 group-hover:text-zinc-800 line-clamp-1">
                      {sc.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Diacritics (ایراب) */}
          {activeTab === 'diacritics' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2" dir="rtl">
              {diacritics.map((d) => (
                <button
                  key={d.name + d.char}
                  type="button"
                  onClick={() => onInsertChar(d.char)}
                  className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-[#C9A66B] text-zinc-100 hover:text-zinc-950 border border-zinc-800 hover:border-[#C9A66B] flex flex-col items-center gap-1 transition cursor-pointer group"
                >
                  <span className="text-2xl sm:text-3xl font-kohistani font-bold leading-tight">◌{d.char}</span>
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-950">
                    {d.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-900">
                    /{d.latin}/
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Tab 4: Perso-Arabic Digits & Punctuation */}
          {activeTab === 'digits' && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5 sm:gap-2" dir="rtl">
              {digitsPunctuation.map((dp) => (
                <button
                  key={dp.label + dp.char}
                  type="button"
                  onClick={() => onInsertChar(dp.char)}
                  className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-[#C9A66B] text-zinc-100 hover:text-zinc-950 border border-zinc-800 hover:border-[#C9A66B] flex flex-col items-center gap-0.5 transition cursor-pointer group"
                >
                  <span className="text-xl sm:text-2xl font-kohistani font-bold leading-none">{dp.char}</span>
                  <span className="text-[10px] sm:text-xs font-mono text-zinc-400 group-hover:text-zinc-900">
                    {dp.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
