/**
 * Downloadable PDF for an already-issued certificate.
 *
 * Ownership is enforced by RLS, not application logic: the SELECT below
 * uses the normal RLS-respecting server client, and course_certificates'
 * only SELECT policy (migration 028) is `user_id = auth.uid() OR
 * admin/instructor` — a request for another student's certificate id
 * simply finds no row and gets a 404, the same way an unowned
 * learning_assessment_attempts row already does elsewhere in this app.
 *
 * Uses pdf-lib (pure JS, no native binaries/headless-browser dependency) —
 * chosen specifically to avoid the Puppeteer/Chromium cold-start and
 * bundle-size risk that would come with HTML-to-PDF rendering on Vercel's
 * serverless runtime.
 */

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: cert, error } = await supabase
    .from("course_certificates")
    .select("certificate_number, student_name, issued_at, courses(title_en)")
    .eq("id", id)
    .single();

  if (error || !cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const row = cert as unknown as { certificate_number: string; student_name: string; issued_at: string; courses: { title_en: string } | null };
  const courseTitle = row.courses?.title_en ?? "PMP Mastery Program";
  const issuedDate = new Date(row.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape, points
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.11, 0.13, 0.29);
  const indigo = rgb(0.31, 0.27, 0.9);
  const slate = rgb(0.35, 0.38, 0.45);
  const lightSlate = rgb(0.55, 0.58, 0.64);

  function centerText(text: string, y: number, font = regular, size = 12, color = navy) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  }

  // Border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: indigo, borderWidth: 2 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: lightSlate, borderWidth: 0.75 });

  centerText("ZENTEXAI ACADEMY", height - 90, bold, 16, indigo);
  centerText("Certificate of Completion", height - 125, bold, 28, navy);

  page.drawLine({ start: { x: width / 2 - 80, y: height - 150 }, end: { x: width / 2 + 80, y: height - 150 }, thickness: 1, color: lightSlate });

  centerText("This certifies that", height - 190, regular, 13, slate);
  centerText(row.student_name, height - 230, bold, 26, navy);
  centerText("has successfully completed the", height - 265, regular, 13, slate);
  centerText(courseTitle, height - 292, bold, 17, indigo);
  centerText("offered by ZentexAI Academy.", height - 315, regular, 13, slate);

  const bottomY = 110;
  page.drawText(`Issued on: ${issuedDate}`, { x: 70, y: bottomY, size: 10, font: regular, color: slate });
  page.drawText(`Certificate Number: ${row.certificate_number}`, { x: 70, y: bottomY - 16, size: 10, font: regular, color: slate });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zentexai.com"}/verify/${row.certificate_number}`;
  page.drawText(`Verify at: ${verifyUrl}`, { x: 70, y: bottomY - 32, size: 9, font: italic, color: lightSlate });

  const instructorX = width - 280;
  page.drawLine({ start: { x: instructorX, y: bottomY + 28 }, end: { x: instructorX + 210, y: bottomY + 28 }, thickness: 0.75, color: lightSlate });
  page.drawText("Zaid Al-Badareen, PMP®", { x: instructorX, y: bottomY + 12, size: 11, font: bold, color: navy });
  page.drawText("Founder & Lead Instructor — ZentexAI", { x: instructorX, y: bottomY - 2, size: 9, font: regular, color: slate });

  centerText(
    "This certificate recognizes completion of the ZentexAI Academy PMP Mastery Program.",
    62,
    italic,
    8,
    lightSlate
  );
  centerText("It is not a PMP® or PMI® certification and does not represent PMI-issued credentials or exam eligibility.", 50, italic, 8, lightSlate);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ZentexAI-Certificate-${row.certificate_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
