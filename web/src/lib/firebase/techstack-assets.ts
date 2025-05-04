"use server";

import {
  createTechStackAsset as createAsset,
  getTechStackAssets as getAssets,
  getTechStackAsset as getAsset,
  updateTechStackAsset as updateAsset,
  deleteTechStackAsset as deleteAsset,
} from "./utils/asset-crud";

import {
  generateDefaultAssets as genDefaultAssets,
  generateAssetContent as genAssetContent,
} from "./utils/asset-generation";

// Re-export the async functions with the same names
export async function createTechStackAsset(
  ...args: Parameters<typeof createAsset>
) {
  return createAsset(...args);
}

export async function getTechStackAssets(
  ...args: Parameters<typeof getAssets>
) {
  return getAssets(...args);
}

export async function getTechStackAsset(...args: Parameters<typeof getAsset>) {
  return getAsset(...args);
}

export async function updateTechStackAsset(
  ...args: Parameters<typeof updateAsset>
) {
  return updateAsset(...args);
}

export async function deleteTechStackAsset(
  ...args: Parameters<typeof deleteAsset>
) {
  return deleteAsset(...args);
}

export async function generateDefaultAssets(
  ...args: Parameters<typeof genDefaultAssets>
) {
  return genDefaultAssets(...args);
}

export async function generateAssetContent(
  ...args: Parameters<typeof genAssetContent>
) {
  return genAssetContent(...args);
}
