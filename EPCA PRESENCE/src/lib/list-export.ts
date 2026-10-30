import { SITE } from "@/constants/site";
import { getCategory, getCompetition, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/roster";
import type { Application } from "@/types/domain";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportMeta {
  title: string;
  subtitle?: string;
  extra?: string;
}

export interface GroupedList {
  categoryCode: string;
  categoryName: string;
  filiereName: string;
  students: Application[];
}

const NAVY: [number, number, number] = [11, 31, 58];
const GOLD: [number, number, number] = [196, 160, 74];
const GREEN: [number, number, number] = [0, 158, 96];
const YELLOW: [number, number, number] = [252, 209, 22];
const BLUE: [number, number, number] = [58, 117, 196];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function loadLogoDataUrl() {
  for (const path of ["/logo-epca.png", "/logo-epca.png"]) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size < 80) continue;
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      /* try next path */
    }
  }
  return null;
}

export function groupApplicationsForExport(applications: Application[]): GroupedList[] {
  const ordered = [...applications].sort((a, b) => {
    const catA = getCategory(a.categoryId)?.sortOrder ?? 99;
    const catB = getCategory(b.categoryId)?.sortOrder ?? 99;
    if (catA !== catB) return catA - catB;
    const filA = getFiliere(a.filiereId)?.name ?? "";
    const filB = getFiliere(b.filiereId)?.name ?? "";
    if (filA !== filB) return filA.localeCompare(filB, "fr");
    return fullName(a).localeCompare(fullName(b), "fr");
  });

  const groups: GroupedList[] = [];
  for (const item of ordered) {
    const category = getCategory(item.categoryId);
    const filiere = getFiliere(item.filiereId);
    const categoryCode = category?.code ?? "—";
    const categoryName = category?.name ?? "Catégorie";
    const filiereName = filiere?.name ?? "Filière";
    const last = groups[groups.length - 1];
    if (last && last.categoryCode === categoryCode && last.filiereName === filiereName) {
      last.students.push(item);
    } else {
      groups.push({ categoryCode, categoryName, filiereName, students: [item] });
    }
  }
  return groups;
}

export async function exportListPdf(applications: Application[], meta: ExportMeta) {
  const groups = groupApplicationsForExport(applications);
  const printed = formatDate(new Date().toISOString().slice(0, 10));
  const logo = await loadLogoDataUrl();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawChrome = (pageNumber: number, pageCount: number) => {
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth / 3, 4, "F");
    doc.setFillColor(...YELLOW);
    doc.rect(pageWidth / 3, 0, pageWidth / 3, 4, "F");
    doc.setFillColor(...BLUE);
    doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, 4, "F");

    if (pageNumber === 1) {
      if (logo) {
        try {
          doc.addImage(logo, "PNG", 14, 10, 18, 18);
        } catch {
          /* logo illisible */
        }
      }
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(SITE.name.toUpperCase(), logo ? 36 : 14, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 97, 112);
      doc.text(`${SITE.country}  ·  Document officiel`, logo ? 36 : 14, 20);
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(meta.title, 14, 32, { maxWidth: pageWidth - 28 });
      const details = [meta.subtitle, meta.extra].filter(Boolean).join("  ·  ");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 97, 112);
      if (details) doc.text(details, 14, 38, { maxWidth: pageWidth - 28 });
    } else {
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${SITE.shortName}  —  ${meta.title}`, 14, 12, { maxWidth: pageWidth - 28 });
    }

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(14, pageNumber === 1 ? 42 : 16, pageWidth - 14, pageNumber === 1 ? 42 : 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 97, 112);
    doc.text(
      `${SITE.shortName}  ·  ${printed}  ·  ${applications.length} nom(s)`,
      14,
      pageHeight - 8,
    );
    doc.text(`Page ${pageNumber} / ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
  };

  const body: Array<Array<string | { content: string; colSpan?: number; styles?: Record<string, unknown> }>> = [];
  for (const group of groups) {
    body.push([
      {
        content: `Catégorie ${group.categoryCode} — ${group.categoryName}    ·    Filière ${group.filiereName}`,
        colSpan: 3,
        styles: {
          fillColor: GOLD,
          textColor: NAVY,
          fontStyle: "bold",
          fontSize: 9.5,
          cellPadding: 3,
        },
      },
    ]);
    group.students.forEach((student, index) => {
      body.push([String(index + 1), fullName(student), student.number]);
    });
  }

  autoTable(doc, {
    startY: 46,
    margin: { top: 22, left: 14, right: 14, bottom: 16 },
    head: [["N°", "Nom et prénoms", "N° de dossier"]],
    body: body.length ? body : [["—", "Aucun nom à afficher", ""]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: 2.4,
      textColor: NAVY,
      lineColor: [214, 208, 197],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 52, fontSize: 8, font: "courier" },
    },
    alternateRowStyles: { fillColor: [246, 243, 236] },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawChrome(page, pageCount);
  }

  doc.save(`${SITE.shortName}-${slugify(meta.title) || "liste"}.pdf`);
}

function xmlCell(value: string, type: "String" | "Number" = "String", style?: string, merge?: number) {
  const mergeAttr = merge ? ` ss:MergeAcross="${merge}"` : "";
  const styleAttr = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttr}${mergeAttr}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function xmlRow(cells: string, height?: number) {
  const heightAttr = height ? ` ss:Height="${height}"` : "";
  return `<Row${heightAttr}>${cells}</Row>`;
}

export function exportListExcel(applications: Application[], meta: ExportMeta) {
  const groups = groupApplicationsForExport(applications);
  const printed = formatDate(new Date().toISOString().slice(0, 10));
  const rows: string[] = [
    xmlRow(
      [
        xmlCell("", "String", "FlagGreen"),
        xmlCell("", "String", "FlagYellow"),
        xmlCell("", "String", "FlagYellow"),
        xmlCell("", "String", "FlagBlue"),
        xmlCell("", "String", "FlagBlue"),
      ].join(""),
      8,
    ),
    xmlRow(xmlCell(SITE.name.toUpperCase(), "String", "School", 4), 22),
    xmlRow(xmlCell(meta.title, "String", "Title", 4), 26),
    xmlRow(
      xmlCell([meta.subtitle ?? SITE.country, meta.extra, printed].filter(Boolean).join("  ·  "), "String", "Meta", 4),
      18,
    ),
    xmlRow("", 8),
    xmlRow(
      ["N°", "Nom et prénoms", "N° de dossier", "Catégorie", "Filière"]
        .map((label) => xmlCell(label, "String", "Header"))
        .join(""),
      20,
    ),
  ];

  for (const group of groups) {
    rows.push(
      xmlRow(
        xmlCell(
          `Catégorie ${group.categoryCode} — ${group.categoryName}  ·  Filière ${group.filiereName}`,
          "String",
          "Group",
          4,
        ),
        20,
      ),
    );
    group.students.forEach((student, index) => {
      const zebra = index % 2 === 1 ? "Zebra" : "Data";
      rows.push(
        xmlRow(
          [
            xmlCell(String(index + 1), "Number", "Num"),
            xmlCell(fullName(student), "String", zebra),
            xmlCell(student.number, "String", "Mono"),
            xmlCell(group.categoryCode, "String", zebra),
            xmlCell(group.filiereName, "String", zebra),
          ].join(""),
          18,
        ),
      );
    });
  }

  rows.push(xmlRow("", 10));
  rows.push(
    xmlRow(
      xmlCell(
        `Document généré par le portail ${SITE.shortName} — ${applications.length} nom(s) — ${printed}`,
        "String",
        "Meta",
        4,
      ),
      16,
    ),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(meta.title)}</Title>
    <Author>${escapeXml(SITE.shortName)}</Author>
    <Company>${escapeXml(SITE.name)}</Company>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0B1F3A"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="FlagGreen"><Interior ss:Color="#009E60" ss:Pattern="Solid"/></Style>
    <Style ss:ID="FlagYellow"><Interior ss:Color="#FCD116" ss:Pattern="Solid"/></Style>
    <Style ss:ID="FlagBlue"><Interior ss:Color="#3A75C4" ss:Pattern="Solid"/></Style>
    <Style ss:ID="School"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#5A6170"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Title"><Font ss:FontName="Cambria" ss:Size="16" ss:Bold="1" ss:Color="#0B1F3A"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
    <Style ss:ID="Meta"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#5A6170"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
    <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B1F3A" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C4A04A"/></Borders></Style>
    <Style ss:ID="Group"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0B1F3A"/><Interior ss:Color="#EAD9B0" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Data"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0B1F3A"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E0D2"/></Borders></Style>
    <Style ss:ID="Zebra"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0B1F3A"/><Interior ss:Color="#F6F3EC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E0D2"/></Borders></Style>
    <Style ss:ID="Num"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0B1F3A"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E0D2"/></Borders></Style>
    <Style ss:ID="Mono"><Font ss:FontName="Consolas" ss:Size="10" ss:Color="#1C4270"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7E0D2"/></Borders></Style>
  </Styles>
  <Worksheet ss:Name="Liste officielle">
    <Table ss:DefaultRowHeight="18">
      <Column ss:Width="36"/>
      <Column ss:Width="240"/>
      <Column ss:Width="150"/>
      <Column ss:Width="80"/>
      <Column ss:Width="170"/>
      ${rows.join("\n")}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Layout x:Orientation="Portrait"/>
        <Header x:Margin="0.2"/>
        <Footer x:Margin="0.2" x:Data="&amp;C${escapeXml(SITE.shortName)} — liste officielle"/>
        <PageMargins x:Bottom="0.5" x:Left="0.5" x:Right="0.5" x:Top="0.5"/>
      </PageSetup>
      <FitToPage/>
      <Print>
        <ValidPrinterInfo/>
        <PaperSizeIndex>9</PaperSizeIndex>
        <FitWidth>1</FitWidth>
        <FitHeight>0</FitHeight>
      </Print>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>6</SplitHorizontal>
      <TopRowBottomPane>6</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([`\uFEFF${xml}`], { type: "application/vnd.ms-excel;charset=utf-8" }),
    `${SITE.shortName}-${slugify(meta.title) || "liste"}.xls`,
  );
}

export function publicationSubtitle(competitionId: string, dropOffDate?: string | null, venue?: string) {
  const competition = getCompetition(competitionId)?.name ?? "";
  const date = dropOffDate ? formatDate(dropOffDate) : "";
  return [competition, date, venue].filter(Boolean).join(" · ");
}
