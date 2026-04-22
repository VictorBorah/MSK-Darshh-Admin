import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

/**
 * Extracts the content of an HTML element and produces a printable PDF.
 * Forces a white background, black font color, and adjusts scaling for A4 proportionality.
 * 
 * @param element - The HTML element to capture.
 * @param filename - The default filename for the downloaded PDF.
 */
export const generatePdfFromElement = async (
  element: HTMLElement | null,
  filename: string = 'document.pdf'
) => {
  if (!element) {
    toast.error('Could not find content to generate PDF');
    return;
  }

  const toastId = toast.loading('Generating PDF...');

  try {
    // We clone the element to manipulate it without causing layout shifts or flickers on the live screen.
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 1. Apply Print-Friendly Styles
    // We force a standard desktop width (800px). When this 800px image is scaled down 
    // to fit the ~210mm A4 width, the fonts naturally scale down to look like 
    // standard 12px-16px document fonts, completely solving the "massive font" issue!
    clone.style.setProperty('width', '800px', 'important');
    clone.style.setProperty('max-width', 'none', 'important');
    clone.style.setProperty('background-color', '#ffffff', 'important');
    clone.style.setProperty('color', '#000000', 'important');
    
    // To ensure the browser actually paints the clone, we MUST keep it inside the viewport.
    // Putting it at z-index: -9999 hides it behind the application background so the user never sees it.
    clone.style.setProperty('position', 'fixed', 'important');
    clone.style.setProperty('top', '0', 'important');
    clone.style.setProperty('left', '0', 'important');
    clone.style.setProperty('z-index', '-9999', 'important');

    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      // Force text color black
      htmlEl.style.setProperty('color', '#000000', 'important');
      // Force border color light gray to avoid invisible borders on white background
      htmlEl.style.setProperty('border-color', '#d1d5db', 'important');
    });

    document.body.appendChild(clone);

    // 2. Capture the image using html-to-image
    const imgData = await toPng(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node: HTMLElement) => {
        if (node.dataset && node.dataset.html2canvasIgnore === 'true') {
          return false;
        }
        return true;
      }
    });

    // Cleanup clone
    document.body.removeChild(clone);

    // 3. Validate image data
    if (!imgData || imgData === 'data:,') {
      throw new Error('Image data is empty');
    }

    // 4. Build PDF
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Standard margins: 10mm on all sides
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2);
    
    const imgElement = new Image();
    imgElement.src = imgData;
    await new Promise((resolve, reject) => { 
      imgElement.onload = resolve; 
      imgElement.onerror = reject;
    });

    const imgWidth = imgElement.width;
    const imgHeight = imgElement.height;
    
    if (imgWidth === 0 || imgHeight === 0) {
      throw new Error('Captured image has 0 dimensions');
    }

    const ratio = imgWidth / imgHeight;
    const contentHeight = contentWidth / ratio;

    let heightLeft = contentHeight;
    let position = margin;
    let totalPages = 1;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    // Handle multiple pages if content exceeds A4 height
    while (heightLeft >= 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      totalPages++;
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    // Add footer to every page
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150); // off-white grey color
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text('Zyn Construction Netwok version 1.0.0', pdfWidth / 2, pdfHeight - 5, { align: 'center' });
    }

    pdf.save(filename);
    toast.success('PDF generated successfully!', { id: toastId });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    toast.error('Failed to generate PDF. Please try again.', { id: toastId });
  }
};
