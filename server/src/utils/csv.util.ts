
import { BadRequestException } from '@nestjs/common';
import { Buffer } from 'buffer';

export class CsvUtil {
  static async parse(buffer: Buffer): Promise<any[]> {
    let text = buffer.toString('utf-8');
    
    // Strip BOM (Byte Order Mark) if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    const [headerLine, ...lines] = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (!headerLine) return [];

    const headers = CsvUtil.parseLine(headerLine).map(h => h.trim());

    return lines.map(line => {
      const values = CsvUtil.parseLine(line);
      const obj: any = {};
      headers.forEach((header, index) => {
        let value: any = values[index]?.trim();
        // Basic type inference
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        
        obj[header] = value;
      });
      return obj;
    });
  }

  static generate(data: any[], columns: string[]): string {
    if (!data.length) return columns.join(',') + '\n';

    const header = columns.join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        const val = row[col] ?? '';
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  private static parseLine(line: string): string[] {
    const result: string[] = [];
    let startValueIndex = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        let val = line.substring(startValueIndex, i);
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        result.push(val);
        startValueIndex = i + 1;
      }
    }
    let lastVal = line.substring(startValueIndex);
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
        lastVal = lastVal.substring(1, lastVal.length - 1).replace(/""/g, '"');
    }
    result.push(lastVal);
    return result;
  }
}
