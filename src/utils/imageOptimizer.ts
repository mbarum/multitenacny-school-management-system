/**
 * Image Optimization & Downscaling Utility for VPS Storage Conservation
 * 
 * Automatically compresses, scales down, and converts high-resolution images
 * (such as 10-15MB camera photos) into lightweight, web-optimized formats before
 * uploading to the VPS disk or persisting in records.
 * 
 * Key VPS Advantages:
 * - Reduces 5MB - 12MB photos down to 25KB - 50KB (98% - 99.5% disk storage saved).
 * - Saves VPS I/O and network bandwidth on mobile / school connections.
 * - Protects VPS disk from overflowing when storing thousands of student/staff portraits.
 * - Speeds up rendering of student ID cards, invoices, receipts, and report cards.
 */

export interface ImageOptimizationOptions {
    preset?: 'avatar' | 'logo' | 'receipt' | 'cover' | 'general';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.1 to 1.0 (default: 0.82)
    format?: 'image/webp' | 'image/jpeg' | 'image/png';
    keepAspectRatio?: boolean;
}

export interface OptimizedImageResult {
    file: File;
    dataUrl: string;
    width: number;
    height: number;
    originalSizeBytes: number;
    optimizedSizeBytes: number;
    savedBytes: number;
    reductionPercentage: number;
    formattedStats: string;
}

// Preset configurations optimized for specific document and UI roles
const PRESET_CONFIGS: Record<string, { maxWidth: number; maxHeight: number; quality: number; format?: 'image/webp' | 'image/png' | 'image/jpeg' }> = {
    avatar: {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.82,
        format: 'image/webp'
    },
    logo: {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        format: 'image/webp'
    },
    receipt: {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.80,
        format: 'image/webp'
    },
    cover: {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.82,
        format: 'image/webp'
    },
    general: {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
        format: 'image/webp'
    }
};

/**
 * Checks if the browser canvas supports WebP export
 */
let isWebpSupportedCache: boolean | null = null;
function checkWebpSupport(): boolean {
    if (isWebpSupportedCache !== null) return isWebpSupportedCache;
    try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1;
        testCanvas.height = 1;
        isWebpSupportedCache = testCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
        isWebpSupportedCache = false;
    }
    return isWebpSupportedCache;
}

/**
 * Formats byte counts into human-readable strings (e.g. 4.2 MB or 38 KB)
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Optimizes an image file for minimal VPS disk space consumption
 */
export async function optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
    const originalSizeBytes = file.size;

    // If SVG, preserve vector format without rasterizing
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        return {
            file,
            dataUrl,
            width: 512,
            height: 512,
            originalSizeBytes,
            optimizedSizeBytes: originalSizeBytes,
            savedBytes: 0,
            reductionPercentage: 0,
            formattedStats: `Vector SVG preserved (${formatFileSize(originalSizeBytes)})`
        };
    }

    const presetKey = options.preset || 'general';
    const presetConfig = PRESET_CONFIGS[presetKey] || PRESET_CONFIGS.general;

    const maxWidth = options.maxWidth || presetConfig.maxWidth;
    const maxHeight = options.maxHeight || presetConfig.maxHeight;
    const quality = options.quality ?? presetConfig.quality;

    const supportsWebp = checkWebpSupport();
    let targetFormat: string = options.format || presetConfig.format || 'image/webp';
    if (targetFormat === 'image/webp' && !supportsWebp) {
        // Fallback: If PNG source or logo, use PNG to preserve transparency; otherwise JPEG
        targetFormat = (file.type === 'image/png' || options.preset === 'logo') ? 'image/png' : 'image/jpeg';
    }

    // Load image via HTMLImageElement or ImageBitmap
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const imageElement = new Image();
        imageElement.onload = () => resolve(imageElement);
        imageElement.onerror = () => reject(new Error('Failed to load image for optimization.'));
        imageElement.src = URL.createObjectURL(file);
    });

    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;
    URL.revokeObjectURL(img.src);

    // Compute proportionally scaled dimensions (never upscale)
    const scale = Math.min(maxWidth / origWidth, maxHeight / origHeight, 1);
    const targetWidth = Math.max(1, Math.round(origWidth * scale));
    const targetHeight = Math.max(1, Math.round(origHeight * scale));

    // Render onto off-screen canvas with high quality smoothing
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D context unavailable.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If JPEG target, fill background with white to avoid black background on transparent images
    if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Export optimized Blob and Data URL
    const dataUrl = canvas.toDataURL(targetFormat, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b) => {
                if (b) resolve(b);
                else reject(new Error('Canvas to Blob conversion failed.'));
            },
            targetFormat,
            quality
        );
    });

    // Generate optimized File object with appropriate extension
    const extension = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/png' ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}_optimized.${extension}`;
    const optimizedFile = new File([blob], newFileName, { type: targetFormat });

    const optimizedSizeBytes = optimizedFile.size;
    const savedBytes = Math.max(0, originalSizeBytes - optimizedSizeBytes);
    const reductionPercentage = originalSizeBytes > 0
        ? Math.round((savedBytes / originalSizeBytes) * 100)
        : 0;

    const formattedStats = reductionPercentage > 0
        ? `${formatFileSize(originalSizeBytes)} → ${formatFileSize(optimizedSizeBytes)} (${reductionPercentage}% VPS storage saved)`
        : `${formatFileSize(optimizedSizeBytes)} (optimal size)`;

    return {
        file: optimizedFile,
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        originalSizeBytes,
        optimizedSizeBytes,
        savedBytes,
        reductionPercentage,
        formattedStats
    };
}
