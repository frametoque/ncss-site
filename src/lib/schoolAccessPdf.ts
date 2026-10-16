import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SubjectGroup } from "./quizSubjects";

export interface CategoryItem {
  id: string;
  name: string;
}

interface ExportSubjectParams {
  competitionTitle: string;
  subjectGroup: SubjectGroup<CategoryItem>;
  schoolRows: { schoolName: string; accessCode: string }[];
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

/**
 * Adds branded header to PDF document
 */
function drawHeader(
  doc: jsPDF,
  competitionTitle: string,
  docSubtitle: string,
  orientation: "portrait" | "landscape"
) {
  const pageWidth = orientation === "landscape" ? 297 : 210;

  // Top Maroon Accent Bar
  doc.setFillColor(77, 0, 0); // Maroon #4d0000
  doc.rect(0, 0, pageWidth, 5, "F");

  // Inline Title & Subtitle on a single line
  const titleText = competitionTitle.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(77, 0, 0);
  doc.text(titleText, 14, 15);

  const titleWidth = doc.getTextWidth(titleText);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(156, 163, 175); // Gray 400
  doc.text(" | ", 14 + titleWidth, 15);
  const sepWidth = doc.getTextWidth(" | ");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81); // Gray 700
  doc.text(docSubtitle, 14 + titleWidth + sepWidth, 15);

  // Thin dividing line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(14, 19, pageWidth - 14, 19);
}

/**
 * Adds page numbers and footer to all pages
 */
function drawFooter(doc: jsPDF, orientation: "portrait" | "landscape") {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = orientation === "landscape" ? 297 : 210;
  const pageHeight = orientation === "landscape" ? 210 : 297;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }
}

/**
 * Export Subject-Specific PDF (Portrait)
 */
export function exportSubjectAccessCodesPdf({
  competitionTitle,
  subjectGroup,
  schoolRows,
}: ExportSubjectParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  drawHeader(
    doc,
    competitionTitle,
    `${subjectGroup.subject} | School Quiz Access Codes`,
    "portrait"
  );
  const startY = 24;

  const headRow = ["#", "School Name", "Access Code"];
  const validRows = schoolRows.filter((row) => {
    const sName = (row.schoolName || "").trim().toLowerCase();
    return sName !== "" && !sName.includes("test");
  });
  const bodyRows = validRows.map((row, idx) => [
    (idx + 1).toString(),
    row.schoolName || "Unnamed School",
    row.accessCode ? row.accessCode.toUpperCase() : "-",
  ]);

  autoTable(doc, {
    startY: startY,
    head: [headRow],
    body: bodyRows,
    margin: { left: 14, right: 14, top: 18, bottom: 14 },
    theme: "grid",
    headStyles: {
      fillColor: [77, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      cellPadding: 3,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [253, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 115, fontStyle: "bold" },
      2: {
        cellWidth: 52,
        halign: "center",
        fontStyle: "bold",
        textColor: [77, 0, 0],
        fontSize: 10,
      },
    },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 1) {
        doc.setFillColor(77, 0, 0);
        doc.rect(0, 0, 210, 4, "F");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `${competitionTitle} | ${subjectGroup.subject} Access Codes`,
          14,
          10
        );
      }
    },
  });

  drawFooter(doc, "portrait");

  const fileName = `${sanitizeFilename(competitionTitle)}_${sanitizeFilename(
    subjectGroup.subject
  )}_Access_Codes.pdf`;
  doc.save(fileName);
}
