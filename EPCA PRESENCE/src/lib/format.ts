const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string) {
  return shortDateFormatter.format(new Date(iso));
}

export function formatRange(startIso: string, endIso: string) {
  return `${formatShortDate(startIso)} — ${formatShortDate(endIso)}`;
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
