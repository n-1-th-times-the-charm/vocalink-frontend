import { saveAs } from "file-saver";
import { DocumentSegment, DocumentStyles } from "./types";

export interface DocumentContent {
  title: string;
  segments: DocumentSegment[];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/"/g, "&apos;");
}

export async function exportToDocx(content: DocumentContent): Promise<void> {
  try {
    const xmlContent = generateDocxXml(content);
    const blob = new Blob([xmlContent], { 
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    });
    saveAs(blob, `${content.title || "Document"}.docx`);
  } catch (error) {
    console.error("Error exporting to DOCX:", error);
    throw error;
  }
}

function generateDocxXml(content: DocumentContent): string {
  const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  const startDoc = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`;
  const endDoc = `</w:body></w:document>`;
  const titleXml = `
    <w:p>
      <w:r>
        <w:t>${escapeXml(content.title)}</w:t>
      </w:r>
    </w:p>
  `;
  const segmentsXml = content.segments.map(segment => {
    const styles = segment.styles;
    let styleTags = "";
    if (styles.bold) {
      styleTags += "<w:b/>";
    }
    if (styles.italic) {
      styleTags += "<w:i/>";
    }
    if (styles.underline) {
      styleTags += `<w:u w:val="single"/>`;
    }
    return `
      <w:p>
        <w:r>
          ${styleTags}
          <w:t>${escapeXml(segment.text)}</w:t>
        </w:r>
      </w:p>
    `;
  }).join("");
  
  return `${header}${startDoc}${titleXml}${segmentsXml}${endDoc}`;
}

export function parseContentToSegments(htmlContent: string): DocumentSegment[] {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  const segments: DocumentSegment[] = [];
  const paragraphs = tempDiv.querySelectorAll("p, div");
  paragraphs.forEach(paragraph => {
    if (paragraph.childNodes.length === 1 && paragraph.firstChild?.nodeType === Node.TEXT_NODE) {
      segments.push({
        text: paragraph.textContent || "",
        styles: {}
      });
    } else {
      paragraph.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent?.trim()) {
            segments.push({
              text: node.textContent,
              styles: {}
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const text = element.textContent || "";
          if (text.trim()) {
            const styles: DocumentStyles = {
              bold: element.tagName === "STRONG" || element.tagName === "B",
              italic: element.tagName === "EM" || element.tagName === "I",
              underline: element.tagName === "U"
            };
            segments.push({ text, styles });
          }
        }
      });
    }
  });
  return segments;
}