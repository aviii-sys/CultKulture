import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Bill, BillItem, ShopSettings } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { formatISTDateNumeric, formatISTTime } from '@/lib/utils/dates';

export interface GeneratePdfOptions {
  bill: Bill;
  items: BillItem[];
  settings?: ShopSettings | null;
}

/**
 * Pure server-side function to generate a professional retail bill / cash memo PDF.
 * Uses bundled TrueType fonts for full Unicode support (including ₹).
 */
export async function generateBillPdfBuffer({
  bill,
  items,
  settings,
}: GeneratePdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Load bundled NotoSans TrueType fonts
  const fontsDir = path.join(process.cwd(), 'src/lib/pdf/fonts');
  const regularFontPath = path.join(fontsDir, 'NotoSans-Regular.ttf');
  const boldFontPath = path.join(fontsDir, 'NotoSans-Bold.ttf');

  const regularFontBytes = fs.readFileSync(regularFontPath);
  const boldFontBytes = fs.readFileSync(boldFontPath);

  const regularFont = await doc.embedFont(regularFontBytes, { subset: true });
  const boldFont = await doc.embedFont(boldFontBytes, { subset: true });

  const isVoided = bill.status === 'voided';

  // Set document metadata
  doc.setTitle(`${isVoided ? 'CANCELLED ' : ''}RETAIL BILL - ${bill.bill_number}`);
  doc.setSubject(`Retail Cash Memo ${bill.bill_number}`);
  doc.setProducer('Cult Kulture POS');
  doc.setCreator('Cult Kulture');

  // A4 Dimensions: 595.28 x 841.89 pt
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = doc.addPage([pageWidth, pageHeight]);

  // Palette
  const darkColor = rgb(0.09, 0.11, 0.15); // Deep Charcoal
  const mutedColor = rgb(0.42, 0.46, 0.52); // Slate Gray
  const borderColor = rgb(0.86, 0.88, 0.91); // Light divider
  const tableHeaderBg = rgb(0.95, 0.96, 0.98); // Light row tint
  const redColor = rgb(0.85, 0.15, 0.15); // Discount / Void
  const accentColor = rgb(0.08, 0.45, 0.72); // Brand Sky/Navy

  const leftMargin = 40;
  const rightMargin = pageWidth - 40;
  const contentWidth = rightMargin - leftMargin;

  let y = pageHeight - 45;

  // --- VOIDED WATERMARK & TOP BANNER ---
  if (isVoided) {
    // Top alert banner
    page.drawRectangle({
      x: leftMargin,
      y: y - 18,
      width: contentWidth,
      height: 24,
      color: rgb(0.99, 0.92, 0.92),
      borderColor: redColor,
      borderWidth: 1,
    });
    const voidBannerText = '*** THIS BILL IS CANCELLED / VOIDED ***';
    const bannerWidth = boldFont.widthOfTextAtSize(voidBannerText, 10);
    page.drawText(voidBannerText, {
      x: leftMargin + (contentWidth - bannerWidth) / 2,
      y: y - 11,
      size: 10,
      font: boldFont,
      color: redColor,
    });
    y -= 34;

    // Diagonal Background Watermark
    page.drawText('CANCELLED / VOIDED', {
      x: 100,
      y: 350,
      size: 42,
      font: boldFont,
      color: rgb(0.95, 0.8, 0.8),
      rotate: degrees(35),
    });
  }

  // --- SHOP HEADER ---
  const shopName = (settings?.shop_name || 'Cult Kulture').trim();
  const shopAddress = (settings?.address || '').trim();
  const shopPhone = (settings?.phone || '').trim();

  // Try embedding logo if URL is a local or fetchable image
  if (settings?.logo_url) {
    try {
      const logoUrl = settings.logo_url;
      let logoBytes: Uint8Array | null = null;
      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        const res = await fetch(logoUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          logoBytes = new Uint8Array(buf);
        }
      } else if (fs.existsSync(logoUrl)) {
        logoBytes = fs.readFileSync(logoUrl);
      }

      if (logoBytes) {
        let embeddedLogo;
        try {
          embeddedLogo = await doc.embedPng(logoBytes);
        } catch {
          embeddedLogo = await doc.embedJpg(logoBytes);
        }
        if (embeddedLogo) {
          const logoDims = embeddedLogo.scaleToFit(120, 50);
          page.drawImage(embeddedLogo, {
            x: leftMargin,
            y: y - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      }
    } catch {
      // Per spec: A missing/broken logo must never cause PDF generation to fail
    }
  }

  // Shop Name & Contact
  page.drawText(shopName, {
    x: leftMargin,
    y: y - 2,
    size: 20,
    font: boldFont,
    color: accentColor,
  });
  y -= 22;

  if (shopAddress) {
    page.drawText(shopAddress, {
      x: leftMargin,
      y: y,
      size: 9,
      font: regularFont,
      color: mutedColor,
    });
    y -= 13;
  }

  if (shopPhone) {
    page.drawText(`Phone: ${shopPhone}`, {
      x: leftMargin,
      y: y,
      size: 9,
      font: regularFont,
      color: mutedColor,
    });
    y -= 13;
  }

  y -= 6;
  // Divider line below header
  page.drawLine({
    start: { x: leftMargin, y: y },
    end: { x: rightMargin, y: y },
    thickness: 1,
    color: borderColor,
  });
  y -= 18;

  // --- DOCUMENT TITLE: RETAIL BILL ---
  const titleText = isVoided ? 'RETAIL BILL (CANCELLED)' : 'RETAIL BILL';
  page.drawText(titleText, {
    x: leftMargin,
    y: y,
    size: 14,
    font: boldFont,
    color: isVoided ? redColor : darkColor,
  });

  const billNumberText = `Bill No: ${bill.bill_number}`;
  const billNumWidth = boldFont.widthOfTextAtSize(billNumberText, 12);
  page.drawText(billNumberText, {
    x: rightMargin - billNumWidth,
    y: y,
    size: 12,
    font: boldFont,
    color: darkColor,
  });
  y -= 20;

  // --- BILL & CUSTOMER METADATA BOX ---
  const metaBoxY = y - 48;
  page.drawRectangle({
    x: leftMargin,
    y: metaBoxY,
    width: contentWidth,
    height: 48,
    color: tableHeaderBg,
    borderColor: borderColor,
    borderWidth: 0.75,
  });

  const istDate = formatISTDateNumeric(bill.created_at);
  const istTime = formatISTTime(bill.created_at);
  const customerName = (bill.customer_name || 'Walk-in Customer').trim();
  const customerPhone = (bill.phone || '').trim();

  // Column 1: Date & Time
  page.drawText(`Date: ${istDate}`, {
    x: leftMargin + 12,
    y: metaBoxY + 30,
    size: 9,
    font: regularFont,
    color: mutedColor,
  });
  page.drawText(`Time: ${istTime}`, {
    x: leftMargin + 12,
    y: metaBoxY + 14,
    size: 9,
    font: regularFont,
    color: mutedColor,
  });

  // Column 2: Customer Name & Phone
  page.drawText(`Customer: ${customerName}`, {
    x: leftMargin + 180,
    y: metaBoxY + 30,
    size: 9,
    font: boldFont,
    color: darkColor,
  });
  if (customerPhone) {
    page.drawText(`Phone: ${customerPhone}`, {
      x: leftMargin + 180,
      y: metaBoxY + 14,
      size: 9,
      font: regularFont,
      color: mutedColor,
    });
  }

  // Column 3: Payment Mode
  const paymentModeText = `Payment: ${bill.payment_mode || 'Cash'}`;
  const paymentWidth = boldFont.widthOfTextAtSize(paymentModeText, 9);
  page.drawText(paymentModeText, {
    x: rightMargin - 12 - paymentWidth,
    y: metaBoxY + 30,
    size: 9,
    font: boldFont,
    color: darkColor,
  });

  if (bill.notes && bill.payment_mode === 'Split') {
    const noteText = bill.notes.slice(0, 30);
    const noteWidth = regularFont.widthOfTextAtSize(noteText, 8);
    page.drawText(noteText, {
      x: rightMargin - 12 - noteWidth,
      y: metaBoxY + 14,
      size: 8,
      font: regularFont,
      color: mutedColor,
    });
  }

  y = metaBoxY - 20;

  // --- ITEMS TABLE ---
  // Columns:
  // Item (185) | Colour (60) | Size (40) | Qty (35) | Rate (65) | Discount (65) | Amount (65)
  const colX = {
    item: leftMargin + 8,
    colour: leftMargin + 195,
    size: leftMargin + 260,
    qty: leftMargin + 305,
    rate: leftMargin + 375, // right aligned
    discount: leftMargin + 440, // right aligned
    amount: rightMargin - 8, // right aligned
  };

  const tableHeaderHeight = 22;
  page.drawRectangle({
    x: leftMargin,
    y: y - tableHeaderHeight,
    width: contentWidth,
    height: tableHeaderHeight,
    color: tableHeaderBg,
    borderColor: borderColor,
    borderWidth: 0.75,
  });

  page.drawText('ITEM', { x: colX.item, y: y - 15, size: 8, font: boldFont, color: darkColor });
  page.drawText('COLOUR', { x: colX.colour, y: y - 15, size: 8, font: boldFont, color: darkColor });
  page.drawText('SIZE', { x: colX.size, y: y - 15, size: 8, font: boldFont, color: darkColor });
  page.drawText('QTY', { x: colX.qty, y: y - 15, size: 8, font: boldFont, color: darkColor });

  // Right-aligned headers
  const rateHeader = 'RATE';
  page.drawText(rateHeader, {
    x: colX.rate - boldFont.widthOfTextAtSize(rateHeader, 8),
    y: y - 15,
    size: 8,
    font: boldFont,
    color: darkColor,
  });

  const discHeader = 'DISCOUNT';
  page.drawText(discHeader, {
    x: colX.discount - boldFont.widthOfTextAtSize(discHeader, 8),
    y: y - 15,
    size: 8,
    font: boldFont,
    color: darkColor,
  });

  const amtHeader = 'AMOUNT';
  page.drawText(amtHeader, {
    x: colX.amount - boldFont.widthOfTextAtSize(amtHeader, 8),
    y: y - 15,
    size: 8,
    font: boldFont,
    color: darkColor,
  });

  y -= tableHeaderHeight;

  // Table Rows
  const rowHeight = 22;
  items.forEach((item, index) => {
    if (index % 2 === 1) {
      page.drawRectangle({
        x: leftMargin,
        y: y - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.985, 0.985, 0.99),
      });
    }

    page.drawLine({
      start: { x: leftMargin, y: y - rowHeight },
      end: { x: rightMargin, y: y - rowHeight },
      thickness: 0.5,
      color: borderColor,
    });

    const textY = y - 15;

    // Item name (truncate if too long)
    let prodName = item.product_name;
    while (prodName.length > 3 && boldFont.widthOfTextAtSize(prodName, 8.5) > 175) {
      prodName = prodName.slice(0, -1);
    }
    if (prodName !== item.product_name) prodName += '…';

    page.drawText(prodName, {
      x: colX.item,
      y: textY,
      size: 8.5,
      font: boldFont,
      color: darkColor,
    });

    page.drawText(item.colour, {
      x: colX.colour,
      y: textY,
      size: 8.5,
      font: regularFont,
      color: mutedColor,
    });

    page.drawText(item.size, {
      x: colX.size,
      y: textY,
      size: 8.5,
      font: boldFont,
      color: darkColor,
    });

    const qtyStr = String(item.qty);
    page.drawText(qtyStr, {
      x: colX.qty + 6,
      y: textY,
      size: 8.5,
      font: boldFont,
      color: darkColor,
    });

    // Rate
    const rateStr = formatIndianRupees(item.unit_selling_price);
    const rateWidth = regularFont.widthOfTextAtSize(rateStr, 8.5);
    page.drawText(rateStr, {
      x: colX.rate - rateWidth,
      y: textY,
      size: 8.5,
      font: regularFont,
      color: darkColor,
    });

    // Discount
    const itemDiscTotal = item.line_discount + (item.allocated_bill_discount || 0);
    const discStr = itemDiscTotal > 0 ? `-${formatIndianRupees(itemDiscTotal)}` : '-';
    const discWidth = regularFont.widthOfTextAtSize(discStr, 8.5);
    page.drawText(discStr, {
      x: colX.discount - discWidth,
      y: textY,
      size: 8.5,
      font: regularFont,
      color: itemDiscTotal > 0 ? redColor : mutedColor,
    });

    // Amount
    const amtStr = formatIndianRupees(item.line_total);
    const amtWidth = boldFont.widthOfTextAtSize(amtStr, 8.5);
    page.drawText(amtStr, {
      x: colX.amount - amtWidth,
      y: textY,
      size: 8.5,
      font: boldFont,
      color: darkColor,
    });

    y -= rowHeight;
  });

  y -= 14;

  // --- TOTALS & SUMMARY SECTION ---
  const summaryBoxWidth = 240;
  const summaryBoxX = rightMargin - summaryBoxWidth;

  const drawSummaryRow = (label: string, value: string, isBold: boolean = false, isDiscount: boolean = false) => {
    const font = isBold ? boldFont : regularFont;
    const color = isDiscount ? redColor : isBold ? darkColor : mutedColor;
    const size = isBold ? 9.5 : 8.5;

    page.drawText(label, {
      x: summaryBoxX,
      y: y,
      size: size,
      font: font,
      color: color,
    });

    const valWidth = font.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: rightMargin - 8 - valWidth,
      y: y,
      size: size,
      font: font,
      color: color,
    });

    y -= 16;
  };

  drawSummaryRow('Gross Sales / Subtotal', formatIndianRupees(bill.subtotal));

  if (bill.total_item_discount > 0) {
    drawSummaryRow('Item Discounts', `-${formatIndianRupees(bill.total_item_discount)}`, false, true);
  }

  if (bill.bill_discount > 0) {
    drawSummaryRow('Bill Discount', `-${formatIndianRupees(bill.bill_discount)}`, false, true);
  }

  if (bill.total_discount > 0) {
    drawSummaryRow('Total Discount', `-${formatIndianRupees(bill.total_discount)}`, false, true);
  }

  // Divider above Grand Total
  page.drawLine({
    start: { x: summaryBoxX, y: y + 8 },
    end: { x: rightMargin, y: y + 8 },
    thickness: 1,
    color: darkColor,
  });

  y -= 4;

  // Grand Total
  const grandTotalLabel = isVoided ? 'TOTAL (CANCELLED)' : 'TOTAL';
  const grandTotalStr = formatIndianRupees(bill.total);
  const totalFont = boldFont;
  const totalSize = 13;

  page.drawText(grandTotalLabel, {
    x: summaryBoxX,
    y: y,
    size: totalSize,
    font: totalFont,
    color: isVoided ? redColor : darkColor,
  });

  const grandTotalWidth = totalFont.widthOfTextAtSize(grandTotalStr, totalSize);
  page.drawText(grandTotalStr, {
    x: rightMargin - 8 - grandTotalWidth,
    y: y,
    size: totalSize,
    font: totalFont,
    color: isVoided ? redColor : darkColor,
  });

  y -= 26;

  // --- FOOTER SECTION ---
  const footerText = (settings?.bill_footer || 'Thank you for shopping with us!').trim();

  // Bottom divider
  page.drawLine({
    start: { x: leftMargin, y: 80 },
    end: { x: rightMargin, y: 80 },
    thickness: 0.75,
    color: borderColor,
  });

  const footerWidth = regularFont.widthOfTextAtSize(footerText, 8.5);
  page.drawText(footerText, {
    x: leftMargin + (contentWidth - footerWidth) / 2,
    y: 62,
    size: 8.5,
    font: regularFont,
    color: mutedColor,
  });

  const subFooter = 'Computer generated retail cash memo. Returns accepted as per store policy.';
  const subWidth = regularFont.widthOfTextAtSize(subFooter, 7);
  page.drawText(subFooter, {
    x: leftMargin + (contentWidth - subWidth) / 2,
    y: 48,
    size: 7,
    font: regularFont,
    color: rgb(0.65, 0.68, 0.73),
  });

  return await doc.save();
}
