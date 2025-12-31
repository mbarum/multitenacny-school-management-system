
import { BadRequestException } from '@nestjs/common';
import { Buffer } from 'buffer';

export class FileValidator {
  static validateImageSignature(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;

    // Convert first 4 bytes to hex
    const header = buffer.toString('hex', 0, 4);

    switch (header) {
      case '89504e47': // PNG
      case 'ffd8ffe0': // JPG
      case 'ffd8ffe1':
      case 'ffd8ffe2':
      case 'ffd8ffe3':
      case 'ffd8ffe8':
      case '47494638': // GIF
      case '52494646': // WEBP (RIFF)
        return true;
      default:
        return false;
    }
  }

  static validatePdfSignature(buffer: Buffer): boolean {
      if (!buffer || buffer.length < 4) return false;
      const header = buffer.toString('hex', 0, 4);
      return header === '25504446'; // %PDF
  }
}
