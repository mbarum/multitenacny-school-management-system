/**
 * Print Utility for SaasLink School Management System
 * Provides 100% overlay-free, clean institutional document printing
 * by rendering the target element in an isolated print frame or dedicated print container.
 */

/**
 * Strips away any modal backdrops, blurred overlays, dark-mode shifts,
 * and page chrome, ensuring the printed document is razor-sharp and professional.
 */
export function printElement(
    elementIdOrRef: string | HTMLElement, 
    options?: { 
        title?: string;
        customStyles?: string;
    }
): void {
    try {
        const targetElement: HTMLElement | null = typeof elementIdOrRef === 'string'
            ? document.getElementById(elementIdOrRef)
            : elementIdOrRef;

        if (!targetElement) {
            console.warn(`Print target element "${elementIdOrRef}" not found, falling back to window.print()`);
            window.print();
            return;
        }

        // Clone the element so we do not disturb the current live React DOM
        const clone = targetElement.cloneNode(true) as HTMLElement;

        // Strip any interactive elements marked with no-print
        const noPrintItems = clone.querySelectorAll('.no-print, button, input[type="file"], [data-no-print="true"]');
        noPrintItems.forEach(el => el.remove());

        // Create an isolated hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.id = 'saaslink-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.zIndex = '-9999';
        iframe.style.pointerEvents = 'none';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
            document.body.removeChild(iframe);
            window.print();
            return;
        }

        // Gather all external link/style elements from the parent document (including Tailwind, fonts, etc.)
        const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(s => s.outerHTML)
            .join('\n');

        const docTitle = options?.title || 'SaasLink Official Institutional Document';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>${docTitle}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                ${styleTags}
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-sizing: border-box !important;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        overflow: visible !important;
                    }
                    /* Remove any modal/shadow/overlay styling from the clone */
                    .financial-a4-sheet, .printable-area, .statement-container, .ledger-container {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .no-print, nav, aside, header, footer:not(.doc-footer), .no-print-backdrop {
                        display: none !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    tr, .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    h1, h2, h3, h4 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    ${options?.customStyles || ''}
                </style>
            </head>
            <body class="bg-white text-slate-900 p-2">
                <div id="print-root">
                    ${clone.outerHTML}
                </div>
            </body>
            </html>
        `);
        doc.close();

        // Allow images, logos, and fonts to load before triggering print
        const triggerFramePrint = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (err) {
                console.error('Error invoking iframe print:', err);
                window.print();
            } finally {
                // Clean up iframe after print dialog completes
                setTimeout(() => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            }
        };

        // If the document has images, wait for them to load
        const images = doc.querySelectorAll('img');
        if (images.length === 0) {
            setTimeout(triggerFramePrint, 250);
        } else {
            let loadedCount = 0;
            const totalImages = images.length;
            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount >= totalImages) {
                    setTimeout(triggerFramePrint, 250);
                }
            };
            images.forEach(img => {
                if (img.complete) {
                    checkAllLoaded();
                } else {
                    img.onload = checkAllLoaded;
                    img.onerror = checkAllLoaded;
                }
            });
            // Safety fallback timeout in case an image hangs
            setTimeout(triggerFramePrint, 1500);
        }
    } catch (e) {
        console.error('printElement error, falling back to window.print():', e);
        window.print();
    }
}
