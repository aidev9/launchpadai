/**
 * Smoothly scrolls to a section by its ID
 * @param sectionId - The ID of the section to scroll to
 * @param offset - Optional vertical offset in pixels (default: 80)
 */
export function smoothScrollToSection(
  sectionId: string,
  offset: number = 80
): void {
  const element = document.getElementById(sectionId);
  if (element) {
    window.scrollTo({
      top: element.offsetTop - offset,
      behavior: "smooth",
    });
  }
}

/**
 * Scrolls to the pricing section from anywhere
 * @param inNewTab - Whether to open the landing page in a new tab (default: false)
 */
export function scrollToPricing(inNewTab: boolean = false): void {
  // If we're on the landing page, just scroll to the pricing section
  if (window.location.pathname === "/" || window.location.pathname === "/pub") {
    smoothScrollToSection("pricing");
    return;
  }

  // If we're on a different page, navigate to the landing page with the pricing anchor
  const url = "/#pricing";
  if (inNewTab) {
    window.open(url, "_blank");
  } else {
    window.location.href = url;
  }
}
