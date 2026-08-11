const PDFDocument = require('pdfkit');

const bufferFromDoc = (doc) => new Promise((resolve, reject) => {
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  doc.end();
});

const BRAND = '#10b981';
const INK = '#0f172a';
const MUTED = '#475569';
const FAINT = '#94a3b8';

// PDFKit auto-paginates any `.text()` call whose y-position would land past the page's bottom
// margin — even with an explicit x/y — which turns absolute-positioned overlay text (watermarks,
// footers sitting in the margin) into a runaway page-creation loop once combined with a
// 'pageAdded' listener. Suppressing addPage() for the duration of the call sidesteps this
// entirely: the decorative text still draws at its given coordinates, it just can't trigger a
// page break while doing so.
const withoutPagination = (doc, fn) => {
  const realAddPage = doc.addPage.bind(doc);
  doc.addPage = () => doc;
  try {
    fn();
  } finally {
    doc.addPage = realAddPage;
  }
};

// Tiles a faint diagonal "VELAIVAAIPU" wordmark across the current page so a stray screenshot or
// printout of a report is still traceable back to the platform it came from.
const drawWatermark = (doc) => withoutPagination(doc, () => {
  const { width, height } = doc.page;
  doc.save();
  doc.rotate(-40, { origin: [width / 2, height / 2] });
  doc.font('Helvetica-Bold').fontSize(46).fillColor(BRAND).fillOpacity(0.06);
  for (let y = 40; y < height - 40; y += 130) {
    doc.text('VELAIVAAIPU', -width, y, { width: width * 3, align: 'center', lineBreak: false });
  }
  doc.restore();
  doc.fillOpacity(1);
});

// Confidentiality notice + generation timestamp, pinned to the bottom margin of whichever page
// it's called on — this data is private student placement records, not for general distribution.
// The notice line wraps to 2 lines for most college names, so the timestamp's position is
// measured off the actual wrapped height rather than a fixed offset — a fixed offset collided
// with the notice's wrapped second line as soon as it ran to more than one line.
const drawConfidentialFooter = (doc, recipientLabel) => withoutPagination(doc, () => {
  const { width, height, margins } = doc.page;
  const y = height - margins.bottom + 10;
  const footerWidth = width - margins.left - margins.right;
  const noticeText = `CONFIDENTIAL — prepared exclusively for ${recipientLabel}. Contains private student placement data; do not forward, publish, or share.`;
  doc.font('Helvetica').fontSize(7.5).fillColor(FAINT);
  const noticeHeight = doc.heightOfString(noticeText, { width: footerWidth, align: 'center' });
  doc.text(noticeText, margins.left, y, { width: footerWidth, align: 'center' });
  doc.text(
    `Generated ${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Velaivaaipu Job Portal`,
    margins.left, y + noticeHeight + 2, { width: footerWidth, align: 'center' }
  );
});

// Registers watermark + footer on every page of the document, including the implicit first page
// PDFDocument creates on construction (must be wired before any content is written to it).
const decoratePages = (doc, recipientLabel) => {
  const decorate = () => { drawWatermark(doc); drawConfidentialFooter(doc, recipientLabel); };
  decorate();
  doc.on('pageAdded', decorate);
};

// @desc  MoU PDF for a college subscribing to a paid campus plan (spec 8.7)
const generateMouPdf = async (college, plan) => {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });

  doc.fontSize(20).font('Helvetica-Bold').text('MEMORANDUM OF UNDERSTANDING', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica').fillColor('#475569').text('Velaivaaipu Campus Placement Partnership', { align: 'center' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(11).font('Helvetica');
  doc.text(`This Memorandum of Understanding ("MoU") is entered into on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} between:`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Velaivaaipu Job Portal ("Platform")');
  doc.font('Helvetica').text('and');
  doc.font('Helvetica-Bold').text(`${college.name}${college.code ? ` (${college.code})` : ''} ("Institution")`);
  if (college.university) doc.font('Helvetica').text(`Affiliated to: ${college.university}`);
  if (college.location) doc.font('Helvetica').text(`Location: ${college.location}`);
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(13).text('Subscription Plan Details');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(11);
  doc.text(`Plan: ${plan.name}`);
  doc.text(`Price: Rs ${plan.price.toLocaleString('en-IN')} / ${plan.duration}`);
  doc.text(`Student Capacity: ${(() => {
    const f = plan.features?.find(x => x.name === 'Student Capacity');
    return f && f.value > 0 ? f.value : 'Unlimited';
  })()}`);
  doc.text(`Scheduled Placement Reports: ${plan.features?.find(x => x.name === 'Scheduled Placement Reports')?.value || 'Monthly'}`);
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(13).text('Terms');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10.5).list([
    'The Institution will onboard its students onto the Platform for placement assistance and skill assessment.',
    'The Platform will provide the features and reporting cadence entitled under the selected subscription plan.',
    'Subscription auto-renews annually via the registered payment mandate unless disabled by the Institution.',
    'Either party may terminate this arrangement at the end of the current subscription period with written notice.'
  ]);
  doc.moveDown(2);

  doc.fontSize(10).fillColor('#475569').text(`Principal: ${college.principalName || '_______________________'}`);
  doc.text(`Email: ${college.principalEmail || '_______________________'}`);
  doc.moveDown(2);
  doc.text('_______________________', { continued: true }).text('                    ', { continued: true }).text('_______________________');
  doc.text('Authorized Signatory (Institution)', { continued: true }).text('                    ', { continued: true }).text('Authorized Signatory (Velaivaaipu)');

  return bufferFromDoc(doc);
};

// @desc  Skill/campus-drive assessment certificate, co-branded with the college when Campus Pro+ (spec 8.5)
const generateCertificatePdf = ({ studentName, skill, score, total, certCode, college, hasCoBranding }) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#10b981');
  doc.moveDown(2);

  doc.fontSize(28).font('Helvetica-Bold').fillColor('#0f172a').text('CERTIFICATE OF ACHIEVEMENT', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor('#475569').text('Velaivaaipu Job Portal', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor('#334155').text('This certifies that', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#065f46').text(studentName || 'Candidate', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(13).font('Helvetica').fillColor('#334155').text(
    `has successfully passed the "${skill}" skill assessment with a score of ${score}/${total}`,
    { align: 'center' }
  );

  if (hasCoBranding && college?.name) {
    doc.moveDown(0.8);
    doc.fontSize(12).font('Helvetica-Oblique').fillColor('#0f172a').text(`In partnership with ${college.name}`, { align: 'center' });
  }

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#64748b').text(`Certificate Code: ${certCode}`, { align: 'center' });
  doc.text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });

  return bufferFromDoc(doc);
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];

// Hand-drawn pie chart — pdfkit has no charting API, so slices are approximated with short line
// segments around the arc and filled as a closed path.
const drawPieChart = (doc, { x, y, radius, data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return;
  let angle = -Math.PI / 2;
  data.forEach((d, i) => {
    if (d.value <= 0) return;
    const slice = (d.value / total) * Math.PI * 2;
    const end = angle + slice;
    const steps = Math.max(2, Math.ceil((slice / (Math.PI * 2)) * 80));
    doc.moveTo(x, y);
    for (let s = 0; s <= steps; s++) {
      const a = angle + (slice * s) / steps;
      doc.lineTo(x + radius * Math.cos(a), y + radius * Math.sin(a));
    }
    doc.closePath().fill(CHART_COLORS[i % CHART_COLORS.length]);
    angle = end;
  });
};

const drawLegend = (doc, x, y, data) => {
  data.filter(d => d.value > 0).forEach((d, i) => {
    const rowY = y + i * 15;
    doc.rect(x, rowY, 9, 9).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(`${d.label}: ${d.value}`, x + 14, rowY - 1);
  });
};

// Hand-drawn vertical bar chart, bars scaled to the tallest value.
const drawBarChart = (doc, { x, y, width, height, data }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const barWidth = width / Math.max(1, data.length);
  data.forEach((d, i) => {
    const barHeight = (d.value / max) * height;
    const barX = x + i * barWidth + barWidth * 0.15;
    const barY = y + height - barHeight;
    doc.rect(barX, barY, barWidth * 0.7, Math.max(barHeight, 1)).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5).text(String(d.value), barX - 5, barY - 11, { width: barWidth * 0.7 + 10, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label, barX - 8, y + height + 4, { width: barWidth * 0.7 + 16, align: 'center' });
  });
};

// Simple paginated table: header row repeats on every new page.
const drawTable = (doc, { startY, columns, rows, title }) => {
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = 18;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  let y = startY;

  const drawHeaderRow = () => {
    doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#0f172a');
    let colX = doc.page.margins.left;
    columns.forEach(col => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(col.label, colX + 4, y + 5, { width: col.width - 6, ellipsis: true });
      colX += col.width;
    });
    y += rowHeight;
  };

  if (title) {
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13).text(title, doc.page.margins.left, y);
    y = doc.y + 8;
  }
  drawHeaderRow();

  rows.forEach((row, i) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeaderRow();
    }
    if (i % 2 === 1) doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#f8fafc');
    let colX = doc.page.margins.left;
    columns.forEach(col => {
      doc.fillColor('#1e293b').font('Helvetica').fontSize(8).text(String(row[col.key] ?? '—'), colX + 4, y + 5, { width: col.width - 6, height: rowHeight - 4, ellipsis: true });
      colX += col.width;
    });
    y += rowHeight;
  });

  return y;
};

// @desc  Comprehensive placement summary PDF — full student roster, drive-wise hiring, and
//        department/status charts. This is the on-demand "Download Summary Report" export,
//        distinct from the lighter auto-generated periodic report above.
const generateSummaryReportPdf = (college, { stats, departments, drives, students }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  decoratePages(doc, college.name);
  doc.x = doc.page.margins.left;
  doc.y = doc.page.margins.top;

  // ── Cover / summary ──────────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text('Placement Summary Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#475569').text(college.name, { align: 'center' });
  doc.fontSize(9).text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10).fillColor('#1e293b');
  doc.text(`Total Students: ${stats.totalStudents}   |   Total Campus Drives: ${drives.length}`);
  doc.text(`Registered: ${stats.registered}   Active: ${stats.active}   Applied: ${stats.applied}   Shortlisted: ${stats.shortlisted}`);
  doc.text(`Interviewing: ${stats.interviewing}   Placed: ${stats.placed}   Opted Out: ${stats.opted_out}`);
  doc.text(`Success Rate: ${stats.successRate}%   Average Placement Package: Rs ${stats.averageLPA || 0} LPA`);
  doc.moveDown(1.5);

  // ── Pie chart: placement status distribution ────────────────────────────
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Placement Status Distribution');
  const pieData = [
    { label: 'Placed', value: stats.placed },
    { label: 'Interviewing', value: stats.interviewing },
    { label: 'Shortlisted', value: stats.shortlisted },
    { label: 'Applied', value: stats.applied },
    { label: 'Active', value: stats.active },
    { label: 'Registered', value: stats.registered },
    { label: 'Opted Out', value: stats.opted_out }
  ];
  const pieCenterY = doc.y + 75;
  if (pieData.some(d => d.value > 0)) {
    drawPieChart(doc, { x: doc.page.margins.left + 75, y: pieCenterY, radius: 65, data: pieData });
    drawLegend(doc, doc.page.margins.left + 175, pieCenterY - 60, pieData);
  } else {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No student records yet.');
  }
  doc.y = pieCenterY + 90;

  // ── Bar chart: department-wise student counts ───────────────────────────
  if (doc.y > 620) doc.addPage();
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Department-wise Student Count', doc.page.margins.left, doc.y);
  const barY = doc.y + 15;
  if (departments.length > 0) {
    drawBarChart(doc, { x: doc.page.margins.left, y: barY, width: 480, height: 110, data: departments.map(d => ({ label: d.name, value: d.count })) });
    doc.y = barY + 140;
  } else {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No department records yet.');
  }

  // ── Campus drives & hiring summary ───────────────────────────────────────
  doc.addPage();
  drawTable(doc, {
    startY: doc.page.margins.top,
    title: 'Campus Drives & Hiring Summary',
    columns: [
      { key: 'title', label: 'Drive', width: 150 },
      { key: 'batchYear', label: 'Batch', width: 45 },
      { key: 'companies', label: 'Companies', width: 145 },
      { key: 'registered', label: 'Registered', width: 65 },
      { key: 'hired', label: 'Hired', width: 65 }
    ],
    rows: drives.length > 0 ? drives : []
  });
  if (drives.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No campus drives created yet.', doc.page.margins.left, doc.y + 8);
  }

  // ── Full student roster ──────────────────────────────────────────────────
  doc.addPage();
  drawTable(doc, {
    startY: doc.page.margins.top,
    title: `Student Details (${students.length})`,
    columns: [
      { key: 'name', label: 'Name', width: 100 },
      { key: 'email', label: 'Email', width: 130 },
      { key: 'department', label: 'Dept', width: 45 },
      { key: 'batchYear', label: 'Batch', width: 40 },
      { key: 'rollNumber', label: 'Roll No.', width: 55 },
      { key: 'status', label: 'Status', width: 55 },
      { key: 'phone', label: 'Phone', width: 65 }
    ],
    rows: students
  });
  if (students.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No students registered yet.', doc.page.margins.left, doc.y + 8);
  }

  return bufferFromDoc(doc);
};

// A small rounded stat card — used to lay the summary numbers out as a scannable grid instead of
// a wall of "Label: N" text lines.
const drawStatCard = (doc, { x, y, width, value, label, accent }) => {
  const height = 52;
  doc.roundedRect(x, y, width, height, 8).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.rect(x, y, 3, height).fill(accent || BRAND);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(17).text(String(value), x + 12, y + 9, { width: width - 20 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(label, x + 12, y + 32, { width: width - 20 });
};

// @desc  Auto-generated placement report PDF (spec 8.6)
const generatePlacementReportPdf = (college, stats, periodLabel) => {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  decoratePages(doc, college.name);

  // ── Letterhead ────────────────────────────────────────────────────────────
  const pageWidth = doc.page.width;
  doc.rect(0, 0, pageWidth, 74).fill(BRAND);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(17).text('VELAIVAAIPU', doc.page.margins.left, 22);
  doc.font('Helvetica').fontSize(8.5).fillColor('#d1fae5').text('Campus Placement Intelligence', doc.page.margins.left, 44);

  const tagWidth = 96, tagHeight = 21;
  const tagX = pageWidth - doc.page.margins.right - tagWidth;
  doc.roundedRect(tagX, 22, tagWidth, tagHeight, 4).fill('#7f1d1d');
  doc.fillColor('#fecaca').font('Helvetica-Bold').fontSize(8.5).text('CONFIDENTIAL', tagX, 28.5, { width: tagWidth, align: 'center' });

  doc.x = doc.page.margins.left;
  doc.y = 96;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text('Placement Report', { align: 'center' });
  doc.font('Helvetica').fontSize(11.5).fillColor(MUTED).text(college.name, { align: 'center' });
  doc.fontSize(9.5).fillColor(FAINT).text(periodLabel, { align: 'center' });
  doc.moveDown(1.5);

  // ── Summary stat grid ────────────────────────────────────────────────────
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Summary', doc.page.margins.left, doc.y);
  doc.moveDown(0.5);

  const cards = [
    { value: stats.totalStudents, label: 'Total Students', accent: BRAND },
    { value: stats.registered, label: 'Registered', accent: '#3b82f6' },
    { value: stats.active, label: 'Active', accent: '#3b82f6' },
    { value: stats.applied, label: 'Applied', accent: '#8b5cf6' },
    { value: stats.interviewing, label: 'Interviewing', accent: '#f59e0b' },
    { value: stats.placed, label: 'Placed', accent: '#10b981' },
    { value: stats.opted_out, label: 'Opted Out', accent: '#ef4444' },
    { value: `${stats.successRate}%`, label: 'Success Rate', accent: '#06b6d4' },
    { value: `Rs ${stats.averageLPA || 0} LPA`, label: 'Avg. Placement Salary', accent: '#ec4899' },
  ];
  const cols = 3, gap = 10;
  const cardWidth = (pageWidth - doc.page.margins.left - doc.page.margins.right - gap * (cols - 1)) / cols;
  const gridStartY = doc.y;
  cards.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    drawStatCard(doc, {
      x: doc.page.margins.left + col * (cardWidth + gap),
      y: gridStartY + row * (52 + gap),
      width: cardWidth,
      value: c.value,
      label: c.label,
      accent: c.accent
    });
  });
  doc.y = gridStartY + Math.ceil(cards.length / cols) * (52 + gap) + 10;
  doc.x = doc.page.margins.left;

  // ── Department breakdown ─────────────────────────────────────────────────
  const departments = stats.departments || [];
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Department Breakdown', doc.page.margins.left, doc.y);
  doc.moveDown(0.8);

  if (departments.length > 0) {
    const barAreaY = doc.y;
    drawBarChart(doc, {
      x: doc.page.margins.left,
      y: barAreaY,
      width: pageWidth - doc.page.margins.left - doc.page.margins.right,
      height: 100,
      data: departments.map(d => ({ label: d.name, value: d.count }))
    });
    doc.y = barAreaY + 130;
  } else {
    doc.fillColor(FAINT).font('Helvetica').fontSize(9.5).text('No department records yet.');
  }

  return bufferFromDoc(doc);
};

module.exports = { generateMouPdf, generateCertificatePdf, generatePlacementReportPdf, generateSummaryReportPdf };
