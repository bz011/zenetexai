import { module2Questions } from "./module2Questions";
import { module3Questions } from "./module3Questions";
import { module4Questions } from "./module4Questions";
import { module5Questions } from "./module5Questions";
import { module6Questions } from "./module6Questions";

const modules = [
  ["Module 2", module2Questions],
  ["Module 3", module3Questions],
  ["Module 4", module4Questions],
  ["Module 5", module5Questions],
  ["Module 6", module6Questions],
] as const;

let totalQuestions = 0;
let ok = true;

for (const [name, questions] of modules) {
  console.log(`\n=== ${name}: ${questions.length} questions ===`);
  if (questions.length !== 10) {
    console.log(`  !!! expected 10, got ${questions.length}`);
    ok = false;
  }
  questions.forEach((q, i) => {
    const errs: string[] = [];
    if (!q.questionEn?.trim()) errs.push("missing questionEn");
    if (!q.questionAr?.trim()) errs.push("missing questionAr");
    if (!q.explanationEn?.trim()) errs.push("missing explanationEn");
    if (!q.explanationAr?.trim()) errs.push("missing explanationAr");
    if (q.options.length !== 4) errs.push(`expected 4 options, got ${q.options.length}`);
    q.options.forEach(([en, ar], oi) => {
      if (!en?.trim()) errs.push(`option ${oi} missing EN`);
      if (!ar?.trim()) errs.push(`option ${oi} missing AR`);
    });
    if (![0, 1, 2, 3].includes(q.correctIndex)) errs.push(`invalid correctIndex ${q.correctIndex}`);
    if (errs.length > 0) {
      console.log(`  Q${i + 1}: ${errs.join("; ")}`);
      ok = false;
    }
  });
  totalQuestions += questions.length;

  const letters = "ABCD";
  const dist = questions.map((q) => letters[q.correctIndex]).join(",");
  const counts = { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>;
  questions.forEach((q) => counts[letters[q.correctIndex]]++);
  console.log(`  correct-letter sequence: ${dist}`);
  console.log(`  distribution: A=${counts.A} B=${counts.B} C=${counts.C} D=${counts.D}`);
}

console.log(`\n=== TOTAL questions across all 5 modules: ${totalQuestions} (expect 50) ===`);
if (totalQuestions !== 50) ok = false;

if (!ok) {
  console.log("\n!!! MANIFEST VALIDATION FAILED - see errors above.");
  process.exit(1);
}
console.log("\nManifest validation PASSED: 50 questions, 4 options each, all fields populated, correct-index valid.");
