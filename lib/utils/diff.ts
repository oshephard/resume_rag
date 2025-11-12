export type DiffOperation = 
  | { type: 'insert'; section?: string; line?: number; newText: string }
  | { type: 'delete'; section?: string; line?: number; oldText: string }
  | { type: 'replace'; section?: string; line?: number; oldText: string; newText: string };

export function applyDiffOperations(content: string, operations: DiffOperation[]): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let currentLine = 0;

  for (const op of operations) {
    const targetLine = op.line !== undefined ? op.line : currentLine;

    while (currentLine < targetLine && currentLine < lines.length) {
      result.push(lines[currentLine]);
      currentLine++;
    }

    switch (op.type) {
      case 'insert':
        result.push(op.newText);
        break;
      case 'delete':
        if (currentLine < lines.length) {
          currentLine++;
        }
        break;
      case 'replace':
        if (currentLine < lines.length) {
          result.push(op.newText);
          currentLine++;
        } else {
          result.push(op.newText);
        }
        break;
    }
  }

  while (currentLine < lines.length) {
    result.push(lines[currentLine]);
    currentLine++;
  }

  return result.join('\n');
}

export function generateDiffPreview(oldContent: string, newContent: string): Array<{ type: 'added' | 'removed' | 'unchanged'; line: string; lineNumber?: number }> {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diff: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string; lineNumber?: number }> = [];

  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      diff.push({ type: 'added', line: newLines[newIndex], lineNumber: newIndex + 1 });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      diff.push({ type: 'removed', line: oldLines[oldIndex], lineNumber: oldIndex + 1 });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      diff.push({ type: 'unchanged', line: oldLines[oldIndex], lineNumber: oldIndex + 1 });
      oldIndex++;
      newIndex++;
    } else {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (oldIndex + 1 < oldLines.length && oldLines[oldIndex + 1] === newLine) {
        diff.push({ type: 'removed', line: oldLine, lineNumber: oldIndex + 1 });
        oldIndex++;
      } else if (newIndex + 1 < newLines.length && newLines[newIndex + 1] === oldLine) {
        diff.push({ type: 'added', line: newLine, lineNumber: newIndex + 1 });
        newIndex++;
      } else {
        diff.push({ type: 'removed', line: oldLine, lineNumber: oldIndex + 1 });
        diff.push({ type: 'added', line: newLine, lineNumber: newIndex + 1 });
        oldIndex++;
        newIndex++;
      }
    }
  }

  return diff;
}

