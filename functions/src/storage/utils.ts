/**
 * Get the current Unix timestamp (seconds since epoch)
 */
export const getCurrentUnixTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * Chunk text into smaller pieces for processing
 * @param text The text to chunk
 * @param maxLength The maximum length of each chunk
 * @param overlap The number of characters to overlap between chunks
 */
export const chunkText = (
  text: string,
  maxLength: number = 1000,
  overlap: number = 200
): string[] => {
  if (!text || text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    // Determine end of this chunk
    let end = i + maxLength;

    // If this isn't the last chunk, try to find a natural break point
    if (end < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > i && paragraphBreak > end - 200) {
        end = paragraphBreak;
      } else {
        // Look for line break
        const lineBreak = text.lastIndexOf("\n", end);
        if (lineBreak > i && lineBreak > end - 100) {
          end = lineBreak;
        } else {
          // Look for sentence break
          const sentenceBreak = Math.max(
            text.lastIndexOf(". ", end),
            text.lastIndexOf("! ", end),
            text.lastIndexOf("? ", end)
          );
          if (sentenceBreak > i && sentenceBreak > end - 100) {
            end = sentenceBreak + 1; // Include the period
          } else {
            // Look for word break
            const wordBreak = text.lastIndexOf(" ", end);
            if (wordBreak > i) {
              end = wordBreak;
            }
          }
        }
      }
    }

    chunks.push(text.substring(i, end).trim());

    // Move to next chunk with overlap
    i = Math.max(i + 1, end - overlap);
  }

  return chunks;
};
