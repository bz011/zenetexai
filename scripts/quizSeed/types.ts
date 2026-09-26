/**
 * Shared shape for the 50 FINAL-APPROVED Module 2-6 quiz questions
 * (see moduleNQuestions.ts files). Each module file exports exactly 10 of
 * these, in Q1..Q10 order — that order becomes order_index 0..9 at seed
 * time. `options` is exactly 4 entries in A/B/C/D order; `correctIndex` is
 * the 0-based index into `options` of the single correct answer, matching
 * the FINAL approved correct-answer letter for that question.
 */
export interface QuizQuestionSeed {
  questionEn: string;
  questionAr: string;
  options: [en: string, ar: string][];
  correctIndex: 0 | 1 | 2 | 3;
  explanationEn: string;
  explanationAr: string;
}
