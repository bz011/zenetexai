import { redirect } from "next/navigation";

// Sprint 10: the old single-course, instant-free "enroll" flow (which only
// wrote to `enrollments`, never granted an `entitlements` row) is superseded
// by the public product page, which now owns the actual enroll/purchase
// decision, pricing/promotion display, and the server-authoritative free-
// enrollment path. This route is kept only so old bookmarks/links to
// /enroll still land somewhere useful, rather than 404ing.
export default function EnrollPage() {
  redirect("/courses/pmp-mastery-program");
}
