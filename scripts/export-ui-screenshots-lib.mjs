import fs from "node:fs";
import path from "node:path";

export function sanitizeFileName(name) {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

export function findLatestXcresult(derivedDataDir) {
  const entries = fs
    .readdirSync(derivedDataDir)
    .filter((name) => name.startsWith("UIFeedback-release-") && name.endsWith(".xcresult"))
    .map((name) => {
      const fullPath = path.join(derivedDataDir, name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (entries.length === 0) {
    throw new Error(`No UIFeedback-release-*.xcresult bundles found in ${derivedDataDir}`);
  }

  return entries[0].fullPath;
}

export function planOutputFiles(manifest) {
  const planned = [];

  for (const testEntry of manifest || []) {
    const attachments = testEntry.attachments || [];
    for (const attachment of attachments) {
      const exportedFileName = attachment.exportedFileName;
      if (!exportedFileName) {
        continue;
      }

      const suggestedName = attachment.suggestedHumanReadableName || exportedFileName;
      const baseName = path.parse(sanitizeFileName(suggestedName)).name;
      planned.push({
        exportedFileName,
        outputFileName: `${baseName}.png`
      });
    }
  }

  return planned;
}

export function extractFromManifest(manifest, exportDir, outputDir, convertToPng) {
  const planned = planOutputFiles(manifest);
  let count = 0;

  for (const item of planned) {
    const srcPath = path.join(exportDir, item.exportedFileName);
    if (!fs.existsSync(srcPath)) {
      continue;
    }

    const dstPath = path.join(outputDir, item.outputFileName);
    const lower = srcPath.toLowerCase();
    if (lower.endsWith(".png")) {
      fs.copyFileSync(srcPath, dstPath);
    } else {
      convertToPng(srcPath, dstPath);
    }

    count += 1;
  }

  return count;
}
