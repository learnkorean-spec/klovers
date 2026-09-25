import { describe, it, expect, beforeEach } from "vitest";
import { dedupeJsonLd, jsonLdTypes } from "./jsonLdDedupe";

function add(json: unknown, id?: string) {
  const s = document.createElement("script");
  s.type = "application/ld+json";
  if (id) s.id = id;
  s.textContent = JSON.stringify(json);
  document.head.appendChild(s);
  return s;
}
const all = () => Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'));

describe("jsonLdDedupe", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("reads @type from objects, arrays and @graph", () => {
    expect([...jsonLdTypes(add({ "@type": ["EducationalOrganization", "LocalBusiness"] }))]).toEqual([
      "EducationalOrganization",
      "LocalBusiness",
    ]);
    expect([...jsonLdTypes(add({ "@graph": [{ "@type": "WebSite" }] }))]).toEqual(["WebSite"]);
    expect([...jsonLdTypes(add([{ "@type": "Course" }, { "@type": "Offer" }]))]).toEqual(["Course", "Offer"]);
  });

  it("removes a static block once the app adds the same @type", () => {
    add({ "@type": "FAQPage" });
    add({ "@type": "BreadcrumbList" });
    add({ "@type": "FAQPage" }, "faq-jsonld");
    expect(dedupeJsonLd()).toBe(1);
    const left = all().map((s) => [s.id, [...jsonLdTypes(s)][0]]);
    expect(left).toEqual([
      ["", "BreadcrumbList"],
      ["faq-jsonld", "FAQPage"],
    ]);
  });

  it("keeps static blocks when the app declares nothing", () => {
    add({ "@type": "FAQPage" });
    expect(dedupeJsonLd()).toBe(0);
    expect(all()).toHaveLength(1);
  });

  it("never removes app blocks, even two of the same type", () => {
    add({ "@type": "Article" }, "a");
    add({ "@type": "Article" }, "b");
    expect(dedupeJsonLd()).toBe(0);
    expect(all()).toHaveLength(2);
  });

  it("ignores an app block that is still empty", () => {
    add({ "@type": "FAQPage" });
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "faq-jsonld";
    document.head.appendChild(s);
    expect(dedupeJsonLd()).toBe(0);
  });
});
