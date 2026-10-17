import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export function cleanMarksheetFileName(str: string): string {
  return str.replace(/[/\\:*?"<>|]/g, "").trim();
}

export async function exportMarksheetAsPdf({
  element,
  competitionTitle,
  subject,
}: {
  element: HTMLElement;
  competitionTitle: string;
  subject: string;
}): Promise<void> {
  const compName = cleanMarksheetFileName(competitionTitle || "Competition");
  const subjName = cleanMarksheetFileName(subject || "Subject");
  const fileName = `${compName} ${subjName} Answers.pdf`;

  // 1. Preload & convert all images inside element to base64 data URLs to guarantee rendering
  const images = Array.from(element.querySelectorAll("img"));
  const originalSources = images.map((img) => img.src);

  try {
    await Promise.all(
      images.map(async (img) => {
        try {
          if (!img.src || img.src.startsWith("data:")) return;
          const sep = img.src.includes("?") ? "&" : "?";
          const cacheBustUrl = `${img.src}${sep}cors_t=${Date.now()}`;
          const res = await fetch(cacheBustUrl, { mode: "cors" });
          if (!res.ok) return;
          const blob = await res.blob();
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                img.src = reader.result as string;
              }
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          });
        } catch {
          // Continue if single image fetch fails
        }
      })
    );

    // Wait for all images to decode and render in DOM
    await Promise.all(
      images.map((img) => img.decode().catch(() => {}))
    );

    // Capture element to high-res canvas (scale: 2 for razor-sharp text, formulas, and diagrams)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const rootRect = element.getBoundingClientRect();
    const scaleX = canvas.width / (rootRect.width || 1);
    const scaleY = canvas.height / (rootRect.height || 1);

    // Query all question cards
    const questionCards = Array.from(
      element.querySelectorAll(".question-card")
    ) as HTMLElement[];

    const questionCount = questionCards.length;

    // 2. Initialize A4 Landscape PDF (297mm x 210mm) with internal stream compression enabled
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const maroonColor: [number, number, number] = [77, 0, 0];
    const maroonLight: [number, number, number] = [128, 0, 0];

    // ----------------------------------------------------
    // PAGE 1: COVER PAGE (TEXT ONLY, CENTERED)
    // ----------------------------------------------------
    // Top Maroon Accent Bar
    doc.setFillColor(...maroonColor);
    doc.rect(0, 0, pageWidth, 6, "F");

    // Elegant Background Inner Frame
    doc.setDrawColor(240, 215, 215);
    doc.setLineWidth(0.6);
    doc.roundedRect(18, 16, pageWidth - 36, pageHeight - 32, 3, 3, "D");

    // Decorative Inner Border
    doc.setDrawColor(248, 235, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(22, 20, pageWidth - 44, pageHeight - 40, 2, 2, "D");

    // Competition Tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...maroonLight);
    doc.text(compName ? compName.toUpperCase() : "INFINITAS '26", pageWidth / 2, 95, { align: "center" });

    // Main Subject Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...maroonColor);
    doc.text(`${subjName.toUpperCase()} ANSWERS`, pageWidth / 2, 115, { align: "center" });

    // ----------------------------------------------------
    // PAGES 2 to N+1: ONE QUESTION PER LANDSCAPE PAGE (CENTERED, NO HEADER/FOOTER)
    // ----------------------------------------------------
    const maxCardWidthMm = 255;
    const maxCardHeightMm = 180;

    for (let qIdx = 0; qIdx < questionCount; qIdx++) {
      doc.addPage();
      const card = questionCards[qIdx];

      // Compute precise bounding box slice of this single question card
      const cardRect = card.getBoundingClientRect();
      const startX = Math.max(0, (cardRect.left - rootRect.left) * scaleX);
      const startY = Math.max(0, (cardRect.top - rootRect.top) * scaleY);
      const sliceWidth = Math.min(canvas.width - startX, Math.max(1, cardRect.width * scaleX));
      const sliceHeight = Math.min(canvas.height - startY, Math.max(1, cardRect.height * scaleY));

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = Math.round(sliceWidth);
      pageCanvas.height = Math.round(sliceHeight);
      const ctx = pageCanvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          Math.round(startX),
          Math.round(startY),
          Math.round(sliceWidth),
          Math.round(sliceHeight),
          0,
          0,
          Math.round(sliceWidth),
          Math.round(sliceHeight)
        );
      }

      // High resolution crisp JPEG
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);

      // Compute rendered dimensions on PDF
      let cardWidthMm = maxCardWidthMm;
      let cardHeightMm = (sliceHeight * cardWidthMm) / sliceWidth;

      // If card height exceeds available vertical height, scale it down proportionally
      if (cardHeightMm > maxCardHeightMm) {
        const scaleDown = maxCardHeightMm / cardHeightMm;
        cardWidthMm = cardWidthMm * scaleDown;
        cardHeightMm = maxCardHeightMm;
      }

      // Perfectly center horizontally & vertically on the landscape page
      const posX = (pageWidth - cardWidthMm) / 2;
      const posY = (pageHeight - cardHeightMm) / 2;

      // Place Question Card directly in the center of the page
      doc.addImage(imgData, "JPEG", posX, posY, cardWidthMm, cardHeightMm, undefined, "FAST");
    }

    // ----------------------------------------------------
    // FINAL PAGE: END PAGE
    // ----------------------------------------------------
    doc.addPage();

    // Top Maroon Accent Bar
    doc.setFillColor(...maroonColor);
    doc.rect(0, 0, pageWidth, 6, "F");

    // Elegant Background Frame
    doc.setDrawColor(240, 215, 215);
    doc.setLineWidth(0.6);
    doc.roundedRect(18, 16, pageWidth - 36, pageHeight - 32, 3, 3, "D");

    // Center Website Link
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...maroonColor);
    doc.text("ncsciencesociety.com", pageWidth / 2, 105, { align: "center" });

    // Copyright / All rights reserved
    const currentYear = new Date().getFullYear();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`© ${currentYear} Nalanda College Science Society. All rights reserved.`, pageWidth / 2, 155, { align: "center" });

    // 3. Save PDF
    doc.save(fileName);
  } finally {
    // Restore original image URLs on DOM elements
    images.forEach((img, i) => {
      if (originalSources[i]) {
        img.src = originalSources[i];
      }
    });
  }
}
