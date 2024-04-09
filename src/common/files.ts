import { readFileSync, writeFileSync } from 'fs';

const LINE_SEPARATOR = '\n';
const TAB_SEPARATOR = '\t';

export interface ReplaceRule {
  pattern: RegExp;
  text: string;
}

export function replaceText(filePath: string, rule: ReplaceRule) {
  const { pattern, text } = rule;
  const content = readFileSync(filePath, 'utf-8');
  if (pattern.test(content)) {
    console.log('replaced > ', pattern, filePath);
    const updated = content.replace(pattern, text);
    writeFileSync(filePath, updated);
  }
}

export function replaceTexts(filePath: string, rules: ReplaceRule[]) {
  rules.forEach((rule) => replaceText(filePath, rule));
}

export function convertArrayToContent(array: string[]): string {
  let content = '';
  for (let i = 0; i < array.length; i++) {
    if (i !== array.length - 1) {
      content += array[i] + LINE_SEPARATOR;
    } else {
      content += array[i];
    }
  }
  return content;
}

export function convertContentToArray(content: string): string[] {
  return content.split(LINE_SEPARATOR);
}

export function convertArray2DToContent(array: string[][]): string {
  let content = '';
  let line = '';
  for (let i = 0; i < array.length; i++) {
    const lineArray = array[i];
    line = '';

    for (let j = 0; j < lineArray.length; j++) {
      const word = lineArray[j];
      if (j !== lineArray.length - 1) {
        line += word + TAB_SEPARATOR;
      } else {
        line += word;
      }
    }

    if (i !== array.length - 1) {
      content += line + LINE_SEPARATOR;
    } else {
      content += line;
    }
  }
  return content;
}

export function convertContentToArray2D(content: string): string[][] {
  const result: string[][] = [];

  const lines = content.split(LINE_SEPARATOR);

  lines.forEach((line) => {
    result.push(line.split(TAB_SEPARATOR));
  });

  return result;
}
