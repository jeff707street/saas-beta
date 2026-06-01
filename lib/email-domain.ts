const PUBLIC_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "pm.me",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "ymail.com",
]);

export function getEmailDomain(email: string) {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  return domain && domain.includes(".") ? domain : "";
}

export function isPublicEmailDomain(domain: string) {
  return PUBLIC_EMAIL_DOMAINS.has(domain.toLowerCase());
}
