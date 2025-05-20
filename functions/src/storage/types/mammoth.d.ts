declare module "mammoth" {
  interface ExtractOptions {
    buffer: Buffer;
  }

  interface ExtractionResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(
    options: ExtractOptions
  ): Promise<ExtractionResult>;
}
