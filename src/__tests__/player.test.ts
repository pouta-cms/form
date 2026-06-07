import { describe, it, expect } from "vitest";
import { renderPlayerHtml, playerCss, playerJs } from "../player";
import { adminHtml, adminCss, adminJs, adminModuleJs } from "../admin";
import { FormSchema } from "../types";

describe("Admin template", () => {
  it("should export adminHtml string and link to assets", () => {
    expect(adminHtml).toBeTypeOf("string");
    expect(adminHtml).toContain("<!DOCTYPE html>");
    expect(adminHtml).toContain("Pouta Forms - Admin Builder");
    expect(adminHtml).toContain('href="/admin.css"');
    expect(adminHtml).toContain('src="/admin.js"');
    expect(adminHtml).toContain('src="/admin-module.js"');
  });
});

describe("Player template rendering", () => {
  const baseSchema: FormSchema = {
    id: "test-form",
    title: "Test Form Title",
    turnstileEnabled: false,
    pages: [
      {
        id: "page-1",
        title: "Welcome Page",
        fields: [
          {
            id: "welcome",
            type: "welcome",
            label: "Welcome",
            welcomeMarkdown: "# Welcome to our test form\nSome description here.",
            buttonLabel: "Go",
            buttonSubtext: "Takes 2 mins"
          }
        ]
      },
      {
        id: "page-2",
        title: "Standard Fields",
        fields: [
          { id: "text-field", type: "text", label: "Text Q", required: true, description: "Please enter your text here" },
          { id: "email-field", type: "email", label: "Email Q" },
          { id: "tel-field", type: "tel", label: "Tel Q" },
          { id: "num-field", type: "number", label: "Number Q" },
          { id: "textarea-field", type: "textarea", label: "Textarea Q" }
        ]
      },
      {
        id: "page-3",
        title: "Select Fields",
        fields: [
          { id: "select-field", type: "select", label: "Select Q", options: ["Opt 1", "Opt 2"] },
          { id: "multi-field", type: "multiselect", label: "Multi Q", options: ["Opt A", "Opt B"] },
          { id: "radio-field", type: "radio", label: "Radio Q", options: ["Yes", "No", "Maybe"] }
        ]
      },
      {
        id: "page-4",
        title: "Contact Field (Default)",
        fields: [
          { id: "contact-default", type: "contact", label: "Contact Default", required: true }
        ]
      },
      {
        id: "page-5",
        title: "Contact Field (Configured)",
        fields: [
          {
            id: "contact-custom",
            type: "contact",
            label: "Contact Custom",
            subFields: {
              firstName: { visible: true, required: true },
              lastName: { visible: true, required: true },
              email: { visible: true, required: true },
              phone: { visible: false, required: false },
              company: { visible: false, required: false }
            }
          }
        ]
      }
    ]
  };

  it("should contain the injected schema details and basic configuration", () => {
    const html = renderPlayerHtml(baseSchema, "test-form", false, "turnstile-key", "en");
    expect(html).toContain("Test Form Title");
    // Verifies that the schema is serialized and injected into the client-side environment
    expect(html).toContain('"id":"test-form"');
    expect(html).toContain('"title":"Test Form Title"');
    expect(html).toContain('"welcomeMarkdown"');
    expect(html).toContain('"buttonLabel":"Go"');
    expect(html).toContain('"buttonSubtext":"Takes 2 mins"');
  });

  it("should output the correct head favicons and CSS links", () => {
    const html = renderPlayerHtml(baseSchema, "test-form", false, "turnstile-key", "en");
    expect(html).toContain('href="/favicon.svg"');
    expect(html).toContain('href="/favicon.ico"');
    expect(html).toContain('href="/player.css"');
    expect(playerCss).toContain('--accent-color: #F59E0B;'); // Custom Amber branding accent color
  });

  it("should include dynamic welcome logo container in client-side script", () => {
    expect(playerJs).toContain('class="welcome-logo-container"');
    expect(playerJs).toContain('schema.logoUrl || \'/logo.svg\'');
  });

  it("should render client-side contact field inputs builder in script", () => {
    expect(playerJs).toContain('id="input-${field.id}-firstName"');
    expect(playerJs).toContain('id="input-${field.id}-lastName"');
    expect(playerJs).toContain('id="input-${field.id}-email"');
    expect(playerJs).toContain('id="input-${field.id}-phone"');
    expect(playerJs).toContain('id="input-${field.id}-company"');
  });

  it("should handle turnstile toggle in rendering", () => {
    const schemaCopy = { ...baseSchema, turnstileEnabled: true };
    const html = renderPlayerHtml(schemaCopy, "test-form", false, "turnstile-key", "en");
    expect(html).toContain("challenges.cloudflare.com/turnstile/v0/api.js");
  });

  it("should parse string input schemas", () => {
    const schemaStr = JSON.stringify(baseSchema);
    const html = renderPlayerHtml(schemaStr, "test-form", false, "turnstile-key", "en");
    expect(html).toContain("Test Form Title");
  });

  it("should handle custom form logo", () => {
    const schemaCopy = { ...baseSchema, logoUrl: "https://example.com/custom-logo.svg" };
    const html = renderPlayerHtml(schemaCopy, "test-form", false, "turnstile-key", "en");
    expect(html).toContain("https://example.com/custom-logo.svg");
  });

  it("should handle default parameter values", () => {
    const html = renderPlayerHtml(baseSchema, "test-form");
    expect(html).toContain("0x4AAAAAAA-wS6ZfQh649eTz");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("should handle finnish language configuration", () => {
    const html = renderPlayerHtml(baseSchema, "test-form", false, undefined, "fi");
    expect(html).toContain("0x4AAAAAAA-wS6ZfQh649eTz");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("should fall back to default title if schema title is missing", () => {
    const schemaCopy = { ...baseSchema, title: "" };
    const html = renderPlayerHtml(schemaCopy, "test-form");
    expect(html).toContain("<title>Form</title>");
  });

  it("should render field descriptions in the HTML template output", () => {
    expect(playerJs).toContain('class="question-description"');
    expect(playerJs).toContain('marked.parse(field.description)');
  });

  it("should render radio button fields in the HTML template output", () => {
    const html = renderPlayerHtml(baseSchema, "test-form", false, "turnstile-key", "en");
    expect(playerJs).toContain('type="radio"');
    expect(playerJs).toContain('name="${field.id}"');
    expect(playerJs).toContain('class="radio-group"');
    expect(html).toContain('"Yes"');
    expect(html).toContain('"No"');
    expect(html).toContain('"Maybe"');
  });

  it("should correctly associate form labels with form controls in player template script", () => {
    expect(playerJs).toContain('labelHtml = hasSingleInput');
    expect(playerJs).toContain('for="input-${field.id}"');
  });

  it("should correctly associate form labels with form controls in admin builder JS template source", () => {
    expect(adminJs).toContain('for="field-welcome-id-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-label-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-id-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-type-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-options-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-btn-label-${pageIdx}-${fieldIdx}"');
    expect(adminJs).toContain('for="field-btn-sub-${pageIdx}-${fieldIdx}"');
  });
});
