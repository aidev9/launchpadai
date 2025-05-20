export class TextExtractor {
  extractText(
    fileContents: Buffer,
    fileExtension: string,
    contentType: string
  ): Promise<string>;
}
