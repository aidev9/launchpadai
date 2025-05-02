export const PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400/png";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const API_DELETE_ASSET = "/api/storage/delete";
export const API_UPLOAD_ASSET = "/api/storage/upload";

// Phase options for the multi-select
export const phaseOptions = [
  { label: "Discover", value: "Discover" },
  { label: "Validate", value: "Validate" },
  { label: "Design", value: "Design" },
  { label: "Build", value: "Build" },
  { label: "Secure", value: "Secure" },
  { label: "Launch", value: "Launch" },
  { label: "Grow", value: "Grow" },
];

export const getCurrentUnixTimestamp = () => {
  return Math.floor(Date.now() / 1000);
  // Alternatively: Math.floor(new Date().getTime() / 1000)
};
