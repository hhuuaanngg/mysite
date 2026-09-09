export function wrapSelection(
  value,
  start,
  end,
  before,
  after = before,
  placeholder = "文本",
) {
  const selected = value.slice(start, end);

  if (
    start >= before.length &&
    end + after.length <= value.length &&
    value.slice(start - before.length, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    return {
      value:
        value.slice(0, start - before.length) + selected + value.slice(end + after.length),
      start: start - before.length,
      end: start - before.length + selected.length,
    };
  }

  if (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length >= before.length + after.length
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    return {
      value: value.slice(0, start) + inner + value.slice(end),
      start,
      end: start + inner.length,
    };
  }

  const inner = selected || placeholder;
  const next = value.slice(0, start) + before + inner + after + value.slice(end);
  const innerStart = start + before.length;
  return { value: next, start: innerStart, end: innerStart + inner.length };
}

export function lineBounds(value, start, end) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const found = value.indexOf("\n", end);
  const lineEnd = found === -1 ? value.length : found;
  return { lineStart, lineEnd };
}

function replaceBlock(value, start, end, transform) {
  const { lineStart, lineEnd } = lineBounds(value, start, end);
  const block = value.slice(lineStart, lineEnd);
  const nextBlock = transform(block);
  return {
    value: value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
    start: lineStart,
    end: lineStart + nextBlock.length,
  };
}

export function applyHeading(value, start, end, level) {
  const prefix = `${"#".repeat(level)} `;
  return replaceBlock(value, start, end, (block) =>
    block
      .split("\n")
      .map((line) => {
        const stripped = line.replace(/^#{1,6}\s+/, "");
        if (!stripped.trim()) return stripped;
        if (line.startsWith(prefix)) return stripped;
        return prefix + stripped;
      })
      .join("\n"),
  );
}

export function toggleLinePrefix(value, start, end, prefix) {
  return replaceBlock(value, start, end, (block) => {
    const lines = block.split("\n");
    const eligible = lines.filter((line) => line.trim());
    const allOn =
      eligible.length > 0 && eligible.every((line) => line.startsWith(prefix));
    return lines
      .map((line) => {
        if (!line.trim()) return line;
        if (allOn) {
          return line.startsWith(prefix) ? line.slice(prefix.length) : line;
        }
        const stripped = line
          .replace(/^#{1,6}\s+/, "")
          .replace(/^>\s?/, "")
          .replace(/^[-*]\s+/, "");
        return prefix + stripped;
      })
      .join("\n");
  });
}

export function insertSnippet(value, start, end, snippet) {
  const left = value.slice(0, start).replace(/\n+$/, "");
  const right = value.slice(end).replace(/^\n+/, "");
  const prefix = left ? `${left}\n\n` : "";
  const suffix = right ? `\n\n${right}` : "\n";
  const next = `${prefix}${snippet}${suffix}`;
  const caret = prefix.length + snippet.length;
  return { value: next, start: caret, end: caret };
}
