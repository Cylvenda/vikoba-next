import * as XLSX from "xlsx"

export type ReportCell = string | number | boolean | null | undefined
export type ReportRow = ReportCell[]

function safeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report"
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function csvEscape(value: ReportCell) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

function xmlEscape(value: ReportCell) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function uint16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff])
}

function uint32(value: number) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ])
}

function joinBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0)
  const output = new Uint8Array(length)
  let offset = 0
  parts.forEach((part) => {
    output.set(part, offset)
    offset += part.length
  })
  return output
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach((file) => {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const checksum = crc32(data)
    const localHeader = joinBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      name,
    ])

    localParts.push(localHeader, data)
    centralParts.push(joinBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ]))
    offset += localHeader.length + data.length
  })

  const localData = joinBytes(localParts)
  const centralDirectory = joinBytes(centralParts)
  const endRecord = joinBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(localData.length),
    uint16(0),
  ])

  return joinBytes([localData, centralDirectory, endRecord])
}

export function exportRowsAsCsv(rows: ReportRow[], fileBaseName: string) {
  const body = rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n")

  downloadBlob(
    new Blob(["\ufeff", body], { type: "text/csv;charset=utf-8" }),
    `${safeFileName(fileBaseName)}.csv`,
  )
}

export function exportRowsAsXlsx(
  rows: ReportRow[],
  fileBaseName: string,
  sheetName = "Financial Report",
) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet["!cols"] = rows.reduce<{ wch: number }[]>((columns, row) => {
    row.forEach((cell, index) => {
      const width = Math.min(48, Math.max(12, String(cell ?? "").length + 2))
      columns[index] = { wch: Math.max(columns[index]?.wch ?? 0, width) }
    })
    return columns
  }, [])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, `${safeFileName(fileBaseName)}.xlsx`, {
    compression: true,
  })
}

export function exportRowsAsDocx(
  rows: ReportRow[],
  fileBaseName: string,
  title: string,
) {
  const isBlankRow = (row: ReportRow) => row.length === 0 || row.every((cell) => String(cell ?? "").trim() === "")
  const meaningfulRows = rows.filter((row, index) => !(index === 0 && row.length === 1))
  const blocks: ReportRow[][] = []
  let currentBlock: ReportRow[] = []

  meaningfulRows.forEach((row) => {
    if (isBlankRow(row)) {
      if (currentBlock.length > 0) blocks.push(currentBlock)
      currentBlock = []
      return
    }
    currentBlock.push(row)
  })
  if (currentBlock.length > 0) blocks.push(currentBlock)

  const metadataRows = blocks.shift() ?? []
  const maximumColumns = Math.max(1, ...blocks.flatMap((block) => block.map((row) => row.length)))
  const landscape = maximumColumns >= 5
  const contentWidth = landscape ? 14200 : 9600

  const cellWidth = (columnIndex: number, columnCount: number) => {
    if (columnCount === 6) {
      return [1800, 1700, 3900, 2200, 1400, 2200][columnIndex]
    }
    if (columnCount === 2) return [Math.round(contentWidth * 0.58), Math.round(contentWidth * 0.42)][columnIndex]
    return Math.floor(contentWidth / Math.max(columnCount, 1))
  }

  const renderCell = (cell: ReportCell, columnIndex: number, columnCount: number, header: boolean, shaded: boolean) => {
    const numeric = typeof cell === "number"
    const value = numeric ? cell.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(cell ?? "")
    const alignment = header ? "center" : numeric ? "right" : columnCount >= 5 && columnIndex === 2 ? "both" : "left"
    const fill = header ? "17324D" : shaded ? "F3F6F8" : "FFFFFF"
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${cellWidth(columnIndex, columnCount)}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:vAlign w:val="center"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="${alignment}"/><w:spacing w:before="40" w:after="40" w:line="260" w:lineRule="auto"/></w:pPr>
        <w:r>
          <w:rPr>${header ? "<w:b/><w:color w:val=\"FFFFFF\"/>" : numeric ? "<w:b/><w:color w:val=\"17324D\"/>" : ""}<w:sz w:val="19"/></w:rPr>
          <w:t xml:space="preserve">${xmlEscape(value)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`
  }

  const renderTable = (block: ReportRow[]) => {
    const headerRow = block[0] ?? []
    const rawHeading = String(headerRow[0] ?? "Report Details")
    const sectionHeading = ({
      "Summary": "Financial Summary",
      "Muhtasari": "Muhtasari wa Fedha",
      "Category": "Cash Movement by Category",
      "Aina": "Mzunguko wa Fedha kwa Aina",
      "Transaction Date": "Transaction Ledger",
      "Tarehe ya Muamala": "Rejista ya Miamala",
    } as Record<string, string>)[rawHeading] ?? rawHeading
    const columnCount = Math.max(1, ...block.map((row) => row.length))
    const normalizedRows = block.map((row) => [...row, ...Array(Math.max(0, columnCount - row.length)).fill("")])
    const tableRows = normalizedRows.map((row, rowIndex) => (
      `<w:tr>
        <w:trPr>${rowIndex === 0 ? "<w:tblHeader/>" : ""}<w:cantSplit/></w:trPr>
        ${row.map((cell, columnIndex) => renderCell(cell, columnIndex, columnCount, rowIndex === 0, rowIndex > 0 && rowIndex % 2 === 0)).join("")}
      </w:tr>`
    )).join("")

    return `<w:p>
      <w:pPr><w:keepNext/><w:spacing w:before="260" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="D04A02"/><w:sz w:val="25"/></w:rPr><w:t>${xmlEscape(sectionHeading)}</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${contentWidth}" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>
        <w:tblBorders><w:top w:val="single" w:color="AAB7C4" w:sz="6"/><w:left w:val="single" w:color="AAB7C4" w:sz="6"/><w:bottom w:val="single" w:color="AAB7C4" w:sz="6"/><w:right w:val="single" w:color="AAB7C4" w:sz="6"/><w:insideH w:val="single" w:color="D7DEE5" w:sz="4"/><w:insideV w:val="single" w:color="D7DEE5" w:sz="4"/></w:tblBorders>
      </w:tblPr>
      ${tableRows}
    </w:tbl>`
  }

  const metadataTable = metadataRows.length > 0
    ? `<w:tbl>
        <w:tblPr><w:tblW w:w="${contentWidth}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:shd w:val="clear" w:fill="F3F6F8"/><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr>
        ${metadataRows.map((row) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>
          <w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="17324D"/></w:rPr><w:t>${xmlEscape(row[0])}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="${contentWidth - 2200}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="both"/></w:pPr><w:r><w:t>${xmlEscape(row.slice(1).join(" "))}</w:t></w:r></w:p></w:tc>
        </w:tr>`).join("")}
      </w:tbl>`
    : ""

  const reportSections = blocks.map(renderTable).join("")

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="17324D"/><w:sz w:val="38"/></w:rPr><w:t>${xmlEscape(title)}</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="280"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="D04A02"/><w:sz w:val="18"/><w:spacing w:val="30"/></w:rPr><w:t>VICOBA COMMUNITY HUB</w:t></w:r></w:p>
    ${metadataTable}
    ${reportSections}
    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="320"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="667788"/><w:sz w:val="16"/></w:rPr><w:t>Generated securely by VICOBA Community Hub</w:t></w:r></w:p>
    <w:sectPr><w:pgSz w:w="${landscape ? "16838" : "11906"}" w:h="${landscape ? "11906" : "16838"}" w:orient="${landscape ? "landscape" : "portrait"}"/><w:pgMar w:top="850" w:right="700" w:bottom="850" w:left="700"/></w:sectPr>
  </w:body>
</w:document>`

  const generatedAt = new Date().toISOString()
  const archive = createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      name: "word/document.xml",
      content: documentXml,
    },
    {
      name: "word/_rels/document.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(title)}</dc:title><dc:creator>VICOBA Community Hub</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:modified></cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>VICOBA Community Hub</Application><AppVersion>1.0</AppVersion></Properties>`,
    },
  ])

  downloadBlob(
    new Blob([archive], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    `${safeFileName(fileBaseName)}.docx`,
  )
}
