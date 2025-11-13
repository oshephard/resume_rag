import { diffLines } from 'diff';

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
  const changes = diffLines(oldContent, newContent);
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; line: string; lineNumber?: number }> = [];
  
  let oldLineNumber = 1;
  let newLineNumber = 1;

  for (const change of changes) {
    const lines = change.value.endsWith('\n') 
      ? change.value.slice(0, -1).split('\n')
      : change.value.split('\n');
    
    if (change.added) {
      for (const line of lines) {
        result.push({
          type: 'added',
          line: line,
          lineNumber: newLineNumber,
        });
        newLineNumber++;
      }
    } else if (change.removed) {
      for (const line of lines) {
        result.push({
          type: 'removed',
          line: line,
          lineNumber: oldLineNumber,
        });
        oldLineNumber++;
      }
    } else {
      for (const line of lines) {
        result.push({
          type: 'unchanged',
          line: line,
          lineNumber: oldLineNumber,
        });
        oldLineNumber++;
        newLineNumber++;
      }
    }
  }

  return result;
}

