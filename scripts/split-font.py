"""漢字フォントを、よく使う順に分けたファイルにする（画面で使う文字を含むファイルだけが読み込まれる）

使い方（開発時だけ。Python 3 と次のパッケージが必要）:
  pip install fonttools brotli wordfreq
  python scripts/split-font.py

- 元のフォント: scripts/fonts/techo-mincho-kanji-full.woff2（しっぽり明朝 Bold の JIS第1水準の漢字）
- 出力: src/assets/fonts/techo-mincho-kanji-NN.woff2 と src/assets/fonts/kanji.css（@font-face と unicode-range）
- 00 はアプリの画面の文字（src 内の文字列）。01 以降は、日本語でよく使われる順（wordfreq）に分ける
- 画面の文言を変えて新しい漢字が増えても、01 以降のどれかに入っているので表示は崩れない（読み込むファイルが1つ増えるだけ）
"""
import pathlib
import re

from fontTools import subset
from fontTools.ttLib import TTFont
from wordfreq import get_frequency_dict

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_FONT = ROOT / 'scripts/fonts/techo-mincho-kanji-full.woff2'
OUT_DIR = ROOT / 'src/assets/fonts'
CHUNK_SIZES = [150, 200, 250, 300, 400]  # 01 から順の文字数。残りは 500 文字ずつ

KANJI = re.compile(r'[一-鿿]')


def ui_chars():
    chars = set()
    for p in list((ROOT / 'src').rglob('*.js')) + list((ROOT / 'src').rglob('*.jsx')) + [ROOT / 'index.html', ROOT / 'public/manifest.webmanifest']:
        if '.test.' in p.name or p.name == 'constants.local.js':
            continue
        chars.update(KANJI.findall(p.read_text(encoding='utf-8')))
    return chars


def ranges(codes):
    codes = sorted(codes)
    out = []
    start = prev = codes[0]
    for c in codes[1:]:
        if c == prev + 1:
            prev = c
            continue
        out.append((start, prev))
        start = prev = c
    out.append((start, prev))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)


def main():
    available = {chr(c) for c in TTFont(SRC_FONT).getBestCmap() if 0x4E00 <= c <= 0x9FFF}
    freq = {}
    for word, f in get_frequency_dict('ja').items():
        for ch in KANJI.findall(word):
            freq[ch] = freq.get(ch, 0) + f

    first = sorted(ui_chars() & available)
    rest = sorted(available - set(first), key=lambda ch: (-freq.get(ch, 0), ch))
    chunks = [first]
    sizes = iter(CHUNK_SIZES)
    while rest:
        n = next(sizes, 500)
        chunks.append(rest[:n])
        rest = rest[n:]

    for old in OUT_DIR.glob('techo-mincho-kanji-*.woff2'):
        old.unlink()
    css = ['/* scripts/split-font.py で作成。手で編集しない */']
    for i, chars in enumerate(chunks):
        name = f'techo-mincho-kanji-{i:02d}.woff2'
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        font = subset.load_font(str(SRC_FONT), opts)
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=[ord(c) for c in chars])
        sub.subset(font)
        subset.save_font(font, str(OUT_DIR / name), opts)
        css.append('@font-face {\n'
                   '  font-family: "Techo Mincho"; font-weight: 700; font-display: swap;\n'
                   f'  src: url("./{name}") format("woff2");\n'
                   f'  unicode-range: {ranges(ord(c) for c in chars)};\n'
                   '}')
        print(f'{name}: {len(chars)} 文字, {(OUT_DIR / name).stat().st_size // 1024} KB')
    (OUT_DIR / 'kanji.css').write_text('\n'.join(css) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
