import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Attendee, EventItem, Settings } from "./types";
import { fmtDate, fmtTime } from "./utils";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 1,
    color: { dark: "#161a18", light: "#ffffff" },
  });
}

export function qrPayload(attendee: Attendee, event: EventItem): string {
  return `STUBHAUS~${event.slug}~${attendee.code}`;
}

/** Generates a landscape A6-ish ticket PDF. One page per attendee. */
export async function downloadTicketsPDF(attendees: Attendee[], event: EventItem, settings: Settings): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [210, 105] });
  const [r, g, b] = hexToRgb(event.accent || "#e8431f");

  for (let i = 0; i < attendees.length; i += 1) {
    const a = attendees[i];
    if (i > 0) doc.addPage([210, 105], "landscape");

    // paper
    doc.setFillColor(251, 251, 248);
    doc.rect(0, 0, 210, 105, "F");

    // left brand panel
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 62, 105, "F");
    doc.setFillColor(251, 251, 248);
    // notch circles (ticket punch holes)
    doc.circle(62, 0, 4, "F");
    doc.circle(62, 105, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("STUBHAUS", 8, 12);
    doc.setFontSize(19);
    const nameLines = doc.splitTextToSize(event.name, 46);
    doc.text(nameLines, 8, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(event.venue, 8, 26 + nameLines.length * 8 + 4);
    doc.text(event.city, 8, 26 + nameLines.length * 8 + 10);
    doc.setFontSize(11);
    doc.text("ADMIT ONE", 8, 92);
    doc.setDrawColor(255, 255, 255);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(8, 95, 54, 95);
    doc.setLineDashPattern([], 0);

    // perforation
    doc.setDrawColor(160, 160, 150);
    doc.setLineDashPattern([2, 2.5], 0);
    doc.line(62, 6, 62, 99);
    doc.setLineDashPattern([], 0);

    // right side
    doc.setTextColor(22, 26, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(a.name, 72, 20);
    doc.setFontSize(10);
    doc.setTextColor(110, 116, 108);
    doc.setFont("helvetica", "normal");
    doc.text(a.email, 72, 27);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(r, g, b);
    doc.text(a.ticketName.toUpperCase(), 72, 40);

    doc.setTextColor(22, 26, 24);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`${fmtDate(event.start)} · ${fmtTime(event.start)}`, 72, 50);
    doc.text(`${event.venue} — ${event.city}`, 72, 57);
    doc.text(`Order ${a.orderNumber}`, 72, 64);

    doc.setFontSize(11);
    doc.setFont("courier", "bold");
    doc.text(a.code, 72, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 145, 138);
    doc.text("Present this QR at the entrance. One scan per ticket.", 72, 84);
    doc.text(`Issued by ${settings.org} · powered by Stubhaus`, 72, 89);

    // QR
    try {
      const img = await qrDataUrl(qrPayload(a, event));
      doc.addImage(img, "PNG", 150, 18, 50, 50);
    } catch {
      doc.setDrawColor(22, 26, 24);
      doc.rect(150, 18, 50, 50);
      doc.text("QR", 171, 45);
    }
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(22, 26, 24);
    doc.text(a.code, 175, 74, { align: "center" });
  }

  doc.save(`stubhaus-${event.slug}-tickets.pdf`);
}

export async function attendeeQRDataUrl(attendee: Attendee, event: EventItem, size = 280): Promise<string> {
  return QRCode.toDataURL(qrPayload(attendee, event), {
    width: size,
    margin: 1,
    color: { dark: "#161a18", light: "#ffffff" },
  });
}
