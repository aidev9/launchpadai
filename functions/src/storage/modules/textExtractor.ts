import * as mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";

// Fix for pdf-parse module trying to load test files
const mockTestFilePath = "./test/data/05-versions-space.pdf";
const mockTestFileDir = path.dirname(mockTestFilePath);

// Create the directory structure if it doesn't exist
try {
  if (!fs.existsSync(mockTestFileDir)) {
    fs.mkdirSync(mockTestFileDir, { recursive: true });
    console.log(`Created directory: ${mockTestFileDir}`);
  }

  // Create an empty test file if it doesn't exist
  if (!fs.existsSync(mockTestFilePath)) {
    fs.writeFileSync(
      mockTestFilePath,
      Buffer.from(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52])),
      "binary"
    ); // Simple PDF header
    console.log(`Created mock PDF test file: ${mockTestFilePath}`);
  }
} catch (error) {
  console.warn(`Warning: Unable to create mock test file: ${error}`);
}

export class TextExtractor {
  async extractText(
    fileContents: Buffer,
    fileExtension: string,
    contentType: string
  ): Promise<string> {
    switch (fileExtension.toLowerCase()) {
      case ".pdf":
        try {
          // First try pdf-parse
          try {
            // Dynamically import pdf-parse
            const pdfParse = await import("pdf-parse");
            const pdf = pdfParse.default;

            // PDF parsing options
            const pdfParseOptions = {
              max: 0, // No limit on pages
            };

            console.log("Attempting to parse PDF with pdf-parse...");
            const pdfData = await pdf(fileContents, pdfParseOptions);

            // Check if we actually got text content
            if (!pdfData.text || pdfData.text.trim().length === 0) {
              throw new Error("PDF was parsed but no text was extracted");
            }

            // Check if text contains any readable content (not just control chars)
            // A simple heuristic: at least 20 alphanumeric characters
            const alphaNumericCount = (pdfData.text.match(/[a-zA-Z0-9]/g) || [])
              .length;
            if (alphaNumericCount < 20) {
              throw new Error(
                "PDF content appears to be mostly non-readable characters"
              );
            }

            console.log("Successfully extracted text with pdf-parse");
            return pdfData.text;
          } catch (pdfParseError: any) {
            // Log the error but try fallback extraction method
            console.error("Error with primary PDF parser:", pdfParseError);

            // FALLBACK 1: Try to extract text using a custom PDF text extraction method
            try {
              console.log("Attempting alternate PDF text extraction method...");

              // Convert PDF to string and look for text objects
              const pdfText = fileContents.toString("utf-8");

              // Pattern to match text blocks in PDF
              const textExtraction = [];

              // Look for PDF text objects (BT...ET blocks)
              const btEtMatches = pdfText.match(/BT.*?ET/gs) || [];
              if (btEtMatches.length > 0) {
                console.log(`Found ${btEtMatches.length} text blocks in PDF`);

                for (const block of btEtMatches) {
                  // Look for text strings within the blocks
                  const textMatches = block.match(/\((.*?)\)/g) || [];
                  for (const match of textMatches) {
                    // Remove parentheses
                    textExtraction.push(match.substring(1, match.length - 1));
                  }

                  // Also look for hex strings
                  const hexMatches = block.match(/<([0-9A-Fa-f]+)>/g) || [];
                  for (const match of hexMatches) {
                    // Convert hex to text
                    const hex = match.substring(1, match.length - 1);
                    let text = "";
                    for (let i = 0; i < hex.length; i += 2) {
                      text += String.fromCharCode(
                        parseInt(hex.substr(i, 2), 16)
                      );
                    }
                    if (text) textExtraction.push(text);
                  }
                }
              }

              // Also look for text embedded in streams
              const streamMatches =
                pdfText.match(/stream\s(.*?)\sendstream/gs) || [];
              if (streamMatches.length > 0) {
                console.log(`Found ${streamMatches.length} streams in PDF`);

                // Try to find readable text in streams
                for (const stream of streamMatches) {
                  // Look for text that appears to be words (3+ characters)
                  const wordMatches = stream.match(/[a-zA-Z]{3,}/g) || [];
                  if (wordMatches.length > 0) {
                    textExtraction.push(...wordMatches);
                  }
                }
              }

              // FALLBACK 2: Just look for any text strings or words anywhere in the PDF
              if (textExtraction.length === 0) {
                console.log("Trying basic text extraction...");

                // Look for all text between parentheses
                const parenthesisMatches = pdfText.match(/\((.*?)\)/g) || [];
                for (const match of parenthesisMatches) {
                  textExtraction.push(match.substring(1, match.length - 1));
                }

                // Look for words (3+ chars) anywhere in the document
                const wordMatches = pdfText.match(/[a-zA-Z]{3,}/g) || [];
                if (wordMatches.length > 0) {
                  textExtraction.push(...wordMatches);
                }
              }

              if (textExtraction.length > 0) {
                // Join all extracted text pieces and clean up
                const extractedText = textExtraction
                  .filter((text) => {
                    // Filter out PDF-specific commands and metadata
                    return (
                      !text.startsWith("/") &&
                      text !== "obj" &&
                      text !== "endobj" &&
                      !text.match(/^[0-9]+\s[0-9]+\sR$/)
                    );
                  })
                  .join(" ")
                  // Replace common PDF escape sequences
                  .replace(/\\n/g, "\n")
                  .replace(/\\r/g, "")
                  .replace(/\\t/g, " ")
                  // Remove control characters and non-printable chars
                  .replace(/[\x00-\x1F\x7F]/g, " ")
                  // Normalize whitespace
                  .replace(/\s+/g, " ")
                  .trim();

                console.log("Fallback extraction completed");

                // Only use this result if it has reasonable content
                if (extractedText.length > 50) {
                  console.log(
                    `Extracted ${extractedText.length} characters of text`
                  );
                  return extractedText;
                } else {
                  console.log("Extracted text is too short to be useful");
                  // Continue to next fallback
                }
              }
            } catch (fallbackError) {
              console.error("Fallback extraction failed:", fallbackError);
            }

            // FALLBACK 3: Last resort - return a message about the extraction failure
            // This will allow processing to continue with minimal information
            return `[PDF TEXT EXTRACTION FAILED] This document appears to be a PDF but text extraction failed. The PDF may be scanned, image-based, or have restrictive permissions. File size: ${fileContents.length} bytes. Error: ${pdfParseError.message}`;
          }
        } catch (error: any) {
          console.error("All PDF parsing methods failed:", error);
          throw new Error(
            `Failed to parse PDF: ${error?.message || "Unknown error"}`
          );
        }

      case ".doc":
      case ".docx":
        const { value } = await mammoth.extractRawText({
          buffer: fileContents,
        });
        return value;

      case ".txt":
      case ".md":
        return fileContents.toString("utf-8");

      default:
        throw new Error(`Unsupported file extension: ${fileExtension}`);
    }
  }
}
