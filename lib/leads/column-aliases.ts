import { LEAD_DATE_USE_TODAY } from "@/lib/leads/constants";
import { suggestExtrasHeaders } from "@/lib/leads/extras.utils";
import type { TLeadColumnMapping, TLeadField } from "@/types/lead.types";

/** Normalized header → dashboard field. Extend aliases carefully (first match wins per field). */
const ALIAS_MAP: Record<string, TLeadField> = {
  name: "firstName",
  "full name": "firstName",
  fullname: "firstName",
  "your name": "firstName",
  "first name": "firstName",
  firstname: "firstName",
  "first-name": "firstName",
  fname: "firstName",
  "given name": "firstName",
  "your first name": "firstName",

  "last name": "lastName",
  lastname: "lastName",
  "last-name": "lastName",
  lname: "lastName",
  surname: "lastName",
  "family name": "lastName",
  "your last name": "lastName",

  email: "email",
  "e mail": "email",
  "e-mail": "email",
  "email address": "email",
  "your email": "email",
  "customer email": "email",
  "client email": "email",
  "contact email": "email",

  phone: "phone",
  "phone number": "phone",
  "your phone": "phone",
  "your phone number": "phone",
  "your tel": "phone",
  tel: "phone",
  mobile: "phone",
  "mobile number": "phone",
  telephone: "phone",
  contact: "phone",
  cell: "phone",
  "cell phone": "phone",
  "contact number": "phone",

  services: "servicesInterestedIn",
  service: "servicesInterestedIn",
  "services interested in": "servicesInterestedIn",
  "service interested in": "servicesInterestedIn",
  "your service": "servicesInterestedIn",
  "interested in": "servicesInterestedIn",
  "services interested": "servicesInterestedIn",
  interest: "servicesInterestedIn",
  interests: "servicesInterestedIn",
  "academic editing": "servicesInterestedIn",

  message: "message",
  "your message": "message",
  inquiry: "message",
  enquiry: "message",
  comments: "message",
  comment: "message",
  description: "message",
  note: "message",
  notes: "message",
  details: "message",
  "lead message": "message",
  "comment or message": "message",

  date: "leadDate",
  "lead date": "leadDate",
  "created date": "leadDate",
  "submission date": "leadDate",
  submitted: "leadDate",
  "submitted at": "leadDate",
  "submitted on": "leadDate",
  "entry date": "leadDate",
};

export function normalizeHeaderLabel(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function guessLeadFieldFromHeader(header: string): TLeadField | null {
  const key = normalizeHeaderLabel(header);
  return ALIAS_MAP[key] ?? null;
}

export function suggestLeadColumnMapping(headers: readonly string[]): TLeadColumnMapping {
  const mapping: TLeadColumnMapping = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    servicesInterestedIn: "",
    leadDate: LEAD_DATE_USE_TODAY,
    extras: [],
  };
  const usedFields = new Set<string>();

  for (const header of headers) {
    const field = guessLeadFieldFromHeader(header);
    if (!field || usedFields.has(field)) continue;
    if (field === "leadDate") {
      if (mapping.leadDate !== LEAD_DATE_USE_TODAY && mapping.leadDate) continue;
      mapping.leadDate = header;
      usedFields.add(field);
      continue;
    }
    if (mapping[field]) continue;
    mapping[field] = header;
    usedFields.add(field);
  }

  mapping.extras = suggestExtrasHeaders(headers, mapping);
  return mapping;
}
