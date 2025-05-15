// Check if it's an insufficient credits error from the result
if (
  typeof result === "object" &&
  result !== null &&
  "needMoreCredits" in result &&
  result.needMoreCredits
) {
  throw { needMoreCredits: true, message: "Insufficient prompt credits" };
}
