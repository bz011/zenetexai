/**
 * Question-image public URL construction (Sprint 9.1 root-cause fix).
 *
 * question_images.image_path stores an OBJECT KEY within Supabase Storage
 * (e.g. "question_images/Q000009.png"), not a browser-resolvable URL. Every
 * question renderer was previously doing <img src={image_path}> directly -
 * the browser resolved that as a path RELATIVE TO THE CURRENT PAGE, which
 * silently 404s no matter what the current route is. This is the one
 * place that turns a stored object key into the real public Storage URL;
 * every image-rendering component must go through it rather than using
 * image_path as a src directly.
 */

const QUESTION_IMAGE_BUCKET = "question-images";

export function getQuestionImagePublicUrl(imagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const cleanPath = imagePath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${QUESTION_IMAGE_BUCKET}/${cleanPath}`;
}

export { QUESTION_IMAGE_BUCKET };
