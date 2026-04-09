#!/usr/bin/env python3
"""
Convert Sphinx/ReadTheDocs artifacts in Telegen markdown files to
standard Markdown / HTML for the MIRASTACK Jekyll docs site.

Handles:
  - ```{mermaid}     → ```mermaid
  - ```{toctree}     → removed
  - ```{image}       → removed
  - ```{tip|note|warning|important|caution}  → callout div
  - :::{tip|...}     → callout div
  - ::::{tab-set}    → bold-section layout
  - ::::{grid}       → docs-feature-grid HTML
  - {doc}`path`      → [Nice Title](path)
"""

import os, re, glob

# ── Helpers ──────────────────────────────────────────────────────────────────

def title_from_ref(ref):
    name = ref.strip('/').split('/')[-1]
    if not name or name == 'index':
        parts = [p for p in ref.strip('/').split('/') if p]
        name = parts[-2] if len(parts) >= 2 else 'Link'
    name = re.sub(r'[-_]', ' ', name).strip().title()
    for k, v in {'Api':'API','Cli':'CLI','Otlp':'OTLP','Otel':'OTel',
                 'Ebpf':'eBPF','Gpu':'GPU','Snmp':'SNMP','Ecs':'ECS',
                 'Aws':'AWS','Http':'HTTP','Tcp':'TCP','Udp':'UDP'}.items():
        name = name.replace(k, v)
    return name

def clean_doc_refs(text):
    return re.sub(r'\{doc\}`([^`]+)`',
                  lambda m: f'[{title_from_ref(m.group(1))}]({m.group(1)})', text)

# ── Line-based state machine ──────────────────────────────────────────────────

def process_content(content):
    lines = content.split('\n')
    result = []
    i, n = 0, len(lines)
    in_fm = (lines[0].strip() == '---') if lines else False

    while i < n:
        line = lines[i]

        # ── Frontmatter passthrough ──
        if in_fm:
            result.append(line)
            if line.strip() == '---' and i > 0:
                in_fm = False
            i += 1
            continue

        # ── ```{image} → remove block ──
        if re.match(r'^\s*```\{image\}', line):
            i += 1
            while i < n:
                stripped = lines[i].strip()
                if stripped == '```' or (stripped.startswith('```') and not stripped.startswith('```{')):
                    i += 1
                    break
                i += 1
            continue

        # ── ```{toctree} → remove block ──
        if re.match(r'^\s*```\{toctree\}', line):
            i += 1
            while i < n:
                if lines[i].strip() == '```':
                    i += 1
                    break
                i += 1
            continue

        # ── ```{mermaid} → ```mermaid ──
        if re.match(r'^\s*```\{mermaid\}\s*$', line):
            result.append(line.replace('{mermaid}', 'mermaid'))
            i += 1
            continue

        # ── ```{admonition} → callout div ──
        m = re.match(r'^\s*```\{(tip|note|warning|important|caution)\}\s*$', line, re.I)
        if m:
            kind = m.group(1).lower()
            i += 1
            body = []
            while i < n:
                if lines[i].strip() == '```':
                    i += 1
                    break
                body.append(lines[i])
                i += 1
            result.append(f'\n<div class="callout callout-{kind}">\n\n'
                          + '\n'.join(body).strip()
                          + '\n\n</div>\n')
            continue

        # ── :::{admonition} → callout div ──
        m = re.match(r'^(:{3,4})\{(tip|note|warning|important|caution)\}\s*$', line, re.I)
        if m:
            close = m.group(1)
            kind  = m.group(2).lower()
            i += 1
            body = []
            while i < n:
                if lines[i].strip() == close:
                    i += 1
                    break
                body.append(lines[i])
                i += 1
            result.append(f'\n<div class="callout callout-{kind}">\n\n'
                          + '\n'.join(body).strip()
                          + '\n\n</div>\n')
            continue

        # ── ::::{tab-set} → flat sections ──
        m = re.match(r'^(:{4,5})\{tab-set\}', line)
        if m:
            outer_close = m.group(1)
            i += 1
            tab_parts, cur_title, cur_body = [], None, []
            while i < n:
                cur = lines[i]
                if cur.strip() == outer_close:
                    if cur_title is not None:
                        tab_parts.append((cur_title, list(cur_body)))
                    i += 1
                    break
                mi = re.match(r'^:{3,4}\{tab-item\}\s*(.+)$', cur)
                if mi:
                    if cur_title is not None:
                        tab_parts.append((cur_title, list(cur_body)))
                    cur_title, cur_body = mi.group(1).strip(), []
                    i += 1
                    continue
                # skip the lone ::: that closes a tab-item
                if re.match(r'^:{3}$', cur.strip()) and cur_title is not None:
                    i += 1
                    continue
                if cur_title is not None:
                    cur_body.append(cur)
                i += 1
            for title, body_lines in tab_parts:
                body_text = '\n'.join(body_lines).strip()
                result.append(f'\n**{title}**\n\n{body_text}\n')
            continue

        # ── ::::{grid} → docs-feature-grid ──
        m = re.match(r'^(:{3,5})\{grid\}', line)
        if m:
            outer_close = m.group(1)
            i += 1
            cards, cur_title, cur_body = [], None, []
            while i < n:
                cur = lines[i]
                if cur.strip() == outer_close:
                    if cur_title is not None:
                        cards.append((cur_title, list(cur_body)))
                    i += 1
                    break
                mc = re.match(r'^:{3,4}\{grid-item-card\}\s*(.*)$', cur)
                if mc:
                    if cur_title is not None:
                        cards.append((cur_title, list(cur_body)))
                    cur_title, cur_body = mc.group(1).strip(), []
                    i += 1
                    continue
                if re.match(r'^:{3}$', cur.strip()) and cur_title is not None:
                    i += 1
                    continue
                # skip :option: lines at grid root level
                if re.match(r'^:[\w-]+:', cur) and cur_title is None:
                    i += 1
                    continue
                if cur_title is not None:
                    cur_body.append(cur)
                i += 1
            if cards:
                result.append('\n<div class="docs-feature-grid">')
                for title, body_lines in cards:
                    body_text = '\n'.join(body_lines).strip()
                    result.append(
                        f'<div class="docs-feature-card">'
                        f'<div class="docs-feature-card__title">{title}</div>'
                        f'<div class="docs-feature-card__body">{body_text}</div>'
                        f'</div>'
                    )
                result.append('</div>\n')
            continue

        # ── Default passthrough ──
        result.append(line)
        i += 1

    output = '\n'.join(result)
    output = clean_doc_refs(output)
    output = re.sub(r'\n{4,}', '\n\n\n', output)
    return output


# ── Main ──────────────────────────────────────────────────────────────────────

files = sorted(glob.glob('docs/telegen/**/*.md', recursive=True)
               + ['docs/telegen/configuration.md'])
files = list(dict.fromkeys(files))  # deduplicate

changed = []
for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    new_content = process_content(original)
    if new_content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  updated: {filepath}")
        changed.append(filepath)
    else:
        print(f"unchanged: {filepath}")

print(f"\n{len(changed)} files updated.")
