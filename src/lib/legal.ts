/** Pflichtangaben nach § 5 DDG. Name und Anschrift vor dem Livegang ergänzen. */
export const LEGAL = {
  siteName: "Blue Lagune",
  siteUrl: "https://blue-lagune.com",
  operatorName: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  email: "kontakt@blue-lagune.com",
  phone: "",
};

export function hasCompleteImprint() {
  return Boolean(LEGAL.operatorName && LEGAL.street && LEGAL.zip && LEGAL.city && LEGAL.email);
}
