import type { AlumniFeedback, PublicStudent } from "@/types/domain";

export function adminAlertCounts(students: PublicStudent[], alumni: AlumniFeedback[]) {
  const photos = students.filter((item) => item.photoPending).length;
  const contacts = students.filter((item) => item.contactPending).length;
  const testimonials = alumni.filter((item) => item.status === "pending").length;
  return {
    photos,
    contacts,
    testimonials,
    total: photos + contacts + testimonials,
  };
}
