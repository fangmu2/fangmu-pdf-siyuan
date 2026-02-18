// src/utils/markdownGenerator.ts
import type { PDFAnnotation, AnnotationGroup, AnnotationColor } from '../types/annotaion';

/**
 * 颜色到标签的映射
 */
const COLOR_LABELS: Record<AnnotationColor, string> = {
  red: '🔴 关键内容',
  yellow: '🟡 普通高亮',
  green: '🟢 重要概念',
  blue: '🔵 方法/数据',
  purple: '🟣 评论/思考'
};

/**
 * 将标注导出为Markdown格式
 */
export function generateMarkdown(
  annotations: PDFAnnotation[],
  options: {
    groupBy: 'color' | 'page' | 'none';
    includeNotes: boolean;
    includeLocation: boolean;
    pdfName?: string;
  } = {
    groupBy: 'color',
    includeNotes: true,
    includeLocation: true
  }
): string {
  const lines: string[] = [];

  // 标题
  if (options.pdfName) {
    lines.push(`# ${options.pdfName} 摘录\n`);
  } else {
    lines.push(`# PDF 摘录\n`);
  }

  lines.push(`> 共 ${annotations.length} 条标注\n`);

  // 分组
  const groups = groupAnnotations(annotations, options.groupBy);

  // 按组生成
  for (const group of groups) {
    lines.push(`\n## ${group.title}\n`);

    for (const ann of group.annotations) {
      // 标注文本
      let line = `- ${ann.text}`;

      // 位置信息
      if (options.includeLocation) {
        line += ` *(P${ann.page})*`;
      }

      lines.push(line);

      // 笔记
      if (options.includeNotes && ann.note) {
        lines.push(`  - 📝 ${ann.note}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * 分组标注
 */
function groupAnnotations(
  annotations: PDFAnnotation[],
  groupBy: 'color' | 'page' | 'none'
): AnnotationGroup[] {
  if (groupBy === 'none') {
    return [{
      title: '所有标注',
      annotations: annotations
    }];
  }

  const groups: AnnotationGroup[] = [];
  const groupMap = new Map<string, PDFAnnotation[]>();

  // 分组
  for (const ann of annotations) {
    let key: string;
    let title: string;

    if (groupBy === 'color') {
      key = ann.color;
      title = COLOR_LABELS[ann.color] || ann.color;
    } else {
      key = `page-${ann.page}`;
      title = `第 ${ann.page} 页`;
    }

    const group = groupMap.get(key) || [];
    group.push(ann);
    groupMap.set(key, group);
  }

  // 转换为数组
  for (const [key, items] of groupMap) {
    let title: string;

    if (groupBy === 'color') {
      title = COLOR_LABELS[key as AnnotationColor] || key;
    } else {
      const pageNum = parseInt(key.replace('page-', ''));
      title = `第 ${pageNum} 页`;
    }

    groups.push({
      title,
      color: groupBy === 'color' ? key as AnnotationColor : undefined,
      page: groupBy === 'page' ? parseInt(key.replace('page-', '')) : undefined,
      annotations: items
    });
  }

  // 排序
  if (groupBy === 'color') {
    const colorOrder: AnnotationColor[] = ['red', 'green', 'blue', 'yellow', 'purple'];
    groups.sort((a, b) => {
      return colorOrder.indexOf(a.color!) - colorOrder.indexOf(b.color!);
    });
  } else if (groupBy === 'page') {
    groups.sort((a, b) => a.page! - b.page!);
  }

  return groups;
}

/**
 * 导出为思源Markdown格式
 * 包含块引用，可以直接粘贴到思源中
 */
export function generateSiyuanMarkdown(annotations: PDFAnnotation[]): string {
  const lines: string[] = [];

  lines.push('# PDF 标注导出\n');

  for (const ann of annotations) {
    // 使用思源的块引用语法
    lines.push(`- ((${ann.blockId} "${ann.text}"))`);

    if (ann.note) {
      lines.push(`  - ${ann.note}`);
    }
  }

  return lines.join('\n');
}
