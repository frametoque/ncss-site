import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface QuizSubmissionItem {
  schoolName: string;
  medium: string;
  score: number;
  totalQuestions: number;
  totalTimeLeft?: number;
  createdAt: string;
  actualRank?: number;
}

export interface QuizPdfColumnsConfig {
  rank: boolean;
  schoolName: boolean;
  medium: boolean;
  score: boolean;
  submittedAt: boolean;
}

export type QuizPdfScope = "all" | "top10" | "top20" | "custom";

export interface QuizSubmissionsPdfOptions {
  showTopInfoBar?: boolean;
  scope?: QuizPdfScope;
  customLimit?: number;
  columns?: Partial<QuizPdfColumnsConfig>;
}

export interface ExportQuizSubmissionsPdfParams {
  competitionTitle: string;
  subjectName: string;
  mediumFilter?: string; // e.g. "ALL" or "Sinhala Medium"
  submissions: QuizSubmissionItem[];
  options?: QuizSubmissionsPdfOptions;
}

/**
 * Formats medium label by removing the word "Medium" (e.g. "English Medium" -> "English").
 */
export function formatMediumLabel(medium?: string | null): string {
  if (!medium) return "-";
  return medium.replace(/\s+Medium$/i, "").trim();
}

/**
 * Checks whether a schoolName corresponds to a TEST user/account.
 * Follows repository-wide convention: case-insensitive check for "test" or empty name.
 */
export function isTestUser(schoolName?: string | null): boolean {
  if (!schoolName) return true;
  const s = schoolName.trim().toLowerCase();
  return s === "" || s.includes("test");
}

function cleanPdfFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "").trim();
}

function formatColomboDateTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toLocaleString("en-US", {
      timeZone: "Asia/Colombo",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

function formatShortDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toLocaleString("en-US", {
      timeZone: "Asia/Colombo",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

interface ColDef {
  id: keyof QuizPdfColumnsConfig;
  header: string;
  baseWidth: number;
  halign: "left" | "center" | "right";
  fontStyle?: "bold" | "normal";
  fontSize?: number;
  textColor?: [number, number, number];
  isFlex?: boolean;
}

const ALL_COL_DEFS: ColDef[] = [
  { id: "rank", header: "Rank", baseWidth: 18, halign: "center", fontStyle: "bold" },
  { id: "schoolName", header: "School Name", baseWidth: 88, halign: "left", fontStyle: "bold", isFlex: true },
  { id: "medium", header: "Medium", baseWidth: 22, halign: "center" },
  { id: "score", header: "Score", baseWidth: 28, halign: "center", fontStyle: "bold", textColor: [77, 0, 0] },
  { id: "submittedAt", header: "Submitted At", baseWidth: 26, halign: "center", fontSize: 7.5, textColor: [107, 114, 128] },
];

/**
 * Exports quiz submissions as a branded PDF leaderboard, excluding TEST users.
 * Supports configurable top info bar, scope (all, top 10, top 20), and column selection.
 */
export function exportQuizSubmissionsPdf({
  competitionTitle,
  subjectName,
  mediumFilter = "ALL",
  submissions,
  options,
}: ExportQuizSubmissionsPdfParams): { success: boolean; count: number; error?: string } {
  // 1. Strict filtering: Always exclude TEST users
  const nonTestSubmissions = submissions.filter((sub) => !isTestUser(sub.schoolName));

  // 2. Sort overall submissions: score DESC, then totalTimeLeft DESC, then createdAt ASC
  const sortedOverall = [...nonTestSubmissions].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const aTime = a.totalTimeLeft || 0;
    const bTime = b.totalTimeLeft || 0;
    if (aTime !== bTime) return bTime - aTime;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Assign overall rank across ALL mediums if not already assigned
  const overallWithRank = sortedOverall.map((sub, idx) => ({
    ...sub,
    actualRank: sub.actualRank ?? (idx + 1),
  }));

  // 3. Medium filtering (if a specific medium is selected)
  const isAllMediums = !mediumFilter || mediumFilter === "ALL";
  const targetSubmissions = isAllMediums
    ? overallWithRank
    : overallWithRank.filter(
        (sub) => (sub.medium || "").trim().toLowerCase() === mediumFilter.trim().toLowerCase()
      );

  if (targetSubmissions.length === 0) {
    return {
      success: false,
      count: 0,
      error: "No genuine submissions found to export (excluding test users).",
    };
  }

  // 4. Apply scope ("all" | "top10" | "top20" | "custom")
  const scope = options?.scope || "all";
  const customLimit = options?.customLimit && options.customLimit > 0 ? options.customLimit : 10;
  let sorted = targetSubmissions;
  if (scope === "top10") {
    sorted = targetSubmissions.slice(0, 10);
  } else if (scope === "top20") {
    sorted = targetSubmissions.slice(0, 20);
  } else if (scope === "custom") {
    sorted = targetSubmissions.slice(0, customLimit);
  }

  // 5. Resolve options
  const showTopInfoBar = options?.showTopInfoBar ?? true;
  const columnsConfig: QuizPdfColumnsConfig = {
    rank: options?.columns?.rank ?? true,
    schoolName: options?.columns?.schoolName ?? true,
    medium: options?.columns?.medium ?? (isAllMediums ? true : false),
    score: options?.columns?.score ?? true,
    submittedAt: options?.columns?.submittedAt ?? true,
  };

  const activeCols = ALL_COL_DEFS.filter((col) => columnsConfig[col.id]);
  if (activeCols.length === 0) {
    return {
      success: false,
      count: 0,
      error: "No columns selected for PDF export. Please select at least one column.",
    };
  }

  // 6. Initialize A4 portrait document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 14;
  const marginRight = 14;
  const usableWidth = pageWidth - marginLeft - marginRight; // 182mm

  // Top Maroon Accent Bar
  doc.setFillColor(77, 0, 0); // Maroon #4d0000
  doc.rect(0, 0, pageWidth, 5, "F");

  // Inline Title & Subtitle
  const compUpper = (competitionTitle || "COMPETITION").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(77, 0, 0);
  doc.text(compUpper, marginLeft, 14);

  const titleWidth = doc.getTextWidth(compUpper);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(156, 163, 175);
  doc.text(" | ", marginLeft + titleWidth, 14);
  const sepWidth = doc.getTextWidth(" | ");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  const scopeTag =
    scope === "top10"
      ? "Top 10"
      : scope === "top20"
      ? "Top 20"
      : scope === "custom"
      ? `Top ${customLimit}`
      : "";
  const scopeSuffix = scopeTag ? ` (${scopeTag})` : "";
  const subHeading = `${subjectName} Quiz Submissions Leaderboard${scopeSuffix}`;
  doc.text(subHeading, marginLeft + titleWidth + sepWidth, 14);

  // Thin dividing line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, 18, pageWidth - marginRight, 18);

  // Top info bar (compact metadata card)
  let tableStartY = 22;

  if (showTopInfoBar) {
    const metaY = 21;
    const metaHeight = 11;
    doc.setFillColor(253, 248, 248); // Soft maroon tint
    doc.setDrawColor(240, 215, 215);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginLeft, metaY, usableWidth, metaHeight, 1.5, 1.5, "FD");

    const mediumLabel = isAllMediums ? "All Mediums" : mediumFilter;
    const highestScore = sorted[0]?.score ?? 0;
    const totalQuestions = sorted[0]?.totalQuestions ?? 0;
    const topAccuracy = totalQuestions > 0 ? Math.round((highestScore / totalQuestions) * 100) : 0;
    const exportTime = formatColomboDateTime(new Date());

    const colW = usableWidth / 4;

    // Meta Col 1: Medium
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("MEDIUM", marginLeft + 3, metaY + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(77, 0, 0);
    doc.text(mediumLabel, marginLeft + 3, metaY + 8.5);

    // Meta Col 2: Total Schools / Scope count
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    const countLabel = scope === "all" ? "TOTAL SCHOOLS" : `DISPLAYED (${scopeTag.toUpperCase()})`;
    doc.text(countLabel, marginLeft + colW + 3, metaY + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    doc.text(
      `${sorted.length}${scope !== "all" ? ` of ${targetSubmissions.length}` : ""}`,
      marginLeft + colW + 3,
      metaY + 8.5
    );

    // Meta Col 3: Highest Score
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("TOP SCORE", marginLeft + colW * 2 + 3, metaY + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // Gold amber
    doc.text(`${highestScore}/${totalQuestions} (${topAccuracy}%)`, marginLeft + colW * 2 + 3, metaY + 8.5);

    // Meta Col 4: Generated Date
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("GENERATED", marginLeft + colW * 3 + 3, metaY + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text(exportTime, marginLeft + colW * 3 + 3, metaY + 8.5);

    tableStartY = metaY + metaHeight + 4;
  }

  // 7. Calculate Column Styles & Proportional Widths
  const hasFlex = activeCols.some((c) => c.isFlex);
  const columnStyles: Record<number, any> = {};

  if (hasFlex) {
    const nonFlexTotal = activeCols
      .filter((c) => !c.isFlex)
      .reduce((sum, c) => sum + c.baseWidth, 0);
    const flexWidth = Math.max(30, usableWidth - nonFlexTotal);

    activeCols.forEach((col, idx) => {
      const width = col.isFlex ? flexWidth : col.baseWidth;
      columnStyles[idx] = {
        cellWidth: width,
        halign: col.halign,
        ...(col.fontStyle ? { fontStyle: col.fontStyle } : {}),
        ...(col.fontSize ? { fontSize: col.fontSize } : {}),
        ...(col.textColor ? { textColor: col.textColor } : {}),
      };
    });
  } else {
    const totalBase = activeCols.reduce((sum, c) => sum + c.baseWidth, 0);
    const scale = usableWidth / totalBase;

    activeCols.forEach((col, idx) => {
      columnStyles[idx] = {
        cellWidth: col.baseWidth * scale,
        halign: col.halign,
        ...(col.fontStyle ? { fontStyle: col.fontStyle } : {}),
        ...(col.fontSize ? { fontSize: col.fontSize } : {}),
        ...(col.textColor ? { textColor: col.textColor } : {}),
      };
    });
  }

  // 8. Prepare Table Rows
  const headRow = activeCols.map((c) => c.header);

  const bodyRows = sorted.map((sub, idx) => {
    const rank = sub.actualRank ?? (idx + 1);
    const remainder10 = rank % 10;
    const remainder100 = rank % 100;
    const rankLabel =
      remainder10 === 1 && remainder100 !== 11
        ? `${rank}st`
        : remainder10 === 2 && remainder100 !== 12
        ? `${rank}nd`
        : remainder10 === 3 && remainder100 !== 13
        ? `${rank}rd`
        : `${rank}th`;
    const pct = sub.totalQuestions > 0 ? Math.round((sub.score / sub.totalQuestions) * 100) : 0;
    const scoreText = sub.totalQuestions > 0 ? `${sub.score} / ${sub.totalQuestions} (${pct}%)` : `${sub.score}`;
    const dateFormatted = formatShortDate(sub.createdAt);

    return activeCols.map((col) => {
      switch (col.id) {
        case "rank":
          return rankLabel;
        case "schoolName":
          return sub.schoolName || "Unnamed School";
        case "medium":
          return formatMediumLabel(sub.medium);
        case "score":
          return scoreText;
        case "submittedAt":
          return dateFormatted;
        default:
          return "";
      }
    });
  });

  const rankColIndex = activeCols.findIndex((c) => c.id === "rank");

  // 9. Draw Table
  autoTable(doc, {
    startY: tableStartY,
    head: [headRow],
    body: bodyRows,
    margin: { left: marginLeft, right: marginRight, top: 16, bottom: 14 },
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
      cellPadding: 2.8,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      valign: "middle",
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [253, 248, 248],
    },
    columnStyles,
    didParseCell: (data) => {
      // Highlight top 3 podium in the Rank column based on true rank
      if (rankColIndex !== -1 && data.section === "body" && data.column.index === rankColIndex) {
        const rankVal = String(data.cell.raw);
        if (rankVal === "1st") {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [146, 64, 14];
          data.cell.styles.fontStyle = "bold";
        } else if (rankVal === "2nd") {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [51, 65, 85];
          data.cell.styles.fontStyle = "bold";
        } else if (rankVal === "3rd") {
          data.cell.styles.fillColor = [254, 235, 215];
          data.cell.styles.textColor = [154, 52, 18];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawPage: () => {
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      if (pageNum > 1) {
        doc.setFillColor(77, 0, 0);
        doc.rect(0, 0, pageWidth, 4, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `${compUpper} | ${subjectName} Submissions Leaderboard${scopeSuffix}`,
          marginLeft,
          10
        );
      }
    },
  });

  // 10. Draw Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 10, pageWidth - marginRight, pageHeight - 10);

    doc.text("ncsciencesociety.com", marginLeft, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 6, {
      align: "right",
    });
  }

  // 11. Save PDF
  const compPart = cleanPdfFilename(competitionTitle);
  const subjPart = cleanPdfFilename(subjectName);
  const medPart = isAllMediums ? "" : ` ${cleanPdfFilename(mediumFilter)}`;
  const scopePart =
    scope === "top10"
      ? " Top 10"
      : scope === "top20"
      ? " Top 20"
      : scope === "custom"
      ? ` Top ${customLimit}`
      : "";
  const fileName = `${compPart} ${subjPart}${medPart}${scopePart} Submissions.pdf`;

  doc.save(fileName);

  return {
    success: true,
    count: sorted.length,
  };
}
