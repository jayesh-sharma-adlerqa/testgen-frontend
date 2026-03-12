import { http } from "../api/http";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstArray(candidates) {
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toStringValue(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str ? str : null;
}

function normalizeDocType(value) {
  const raw = toStringValue(value);
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower.includes("prd")) return "prd";
  if (lower.includes("hld")) return "hld";
  if (lower.includes("lld")) return "lld";
  if (lower.includes("figma")) return "figma";
  return lower;
}

function extractDocType(item) {
  return normalizeDocType(
    item?.docType ??
      item?.type ??
      item?.documentType ??
      item?.artifactType ??
      item?.kind ??
      item?.doc?.type ??
      item?.document?.type ??
      item?.metadata?.docType ??
      item?.meta?.docType ??
      null
  );
}

function extractVersionNumber(item) {
  return toFiniteNumber(
    item?.versionNumber ??
      item?.version ??
      item?.versionNo ??
      item?.version_num ??
      item?.version_number ??
      item?.featureVersion ??
      item?.featureVersionNumber ??
      item?.meta?.versionNumber ??
      item?.metadata?.versionNumber ??
      item?.versionInfo?.versionNumber ??
      item?.versionInfo?.number ??
      item?.featureVersion?.number ??
      null
  );
}

function extractIndexingStatus(item) {
  return toStringValue(
    item?.indexingStatus ??
      item?.status ??
      item?.featureIndexStatus ??
      item?.featureStatus ??
      item?.meta?.indexingStatus ??
      item?.metadata?.indexingStatus ??
      item?.versionInfo?.indexingStatus ??
      null
  );
}

function extractCreatedAt(item) {
  return toStringValue(
    item?.createdAt ??
      item?.created_at ??
      item?.uploadedAt ??
      item?.updatedAt ??
      item?.meta?.createdAt ??
      item?.metadata?.createdAt ??
      null
  );
}

function extractDisplayName(item, docType) {
  return (
    toStringValue(
      item?.displayName ??
        item?.name ??
        item?.fileName ??
        item?.filename ??
        item?.originalName ??
        item?.original_filename ??
        item?.title ??
        item?.artifactName ??
        item?.documentName ??
        item?.doc?.name ??
        item?.document?.name ??
        item?.meta?.name ??
        item?.metadata?.name ??
        null
    ) || (docType ? docType.toUpperCase() : "Document")
  );
}

function extractSourceValue(item) {
  return toStringValue(
    item?.sourceValue ??
      item?.url ??
      item?.downloadUrl ??
      item?.fileUrl ??
      item?.storagePath ??
      item?.path ??
      item?.pageId ??
      item?.figmaFileId ??
      item?.source ??
      item?.doc?.url ??
      item?.document?.url ??
      null
  );
}

function extractSourceType(item, docType) {
  return (
    toStringValue(
      item?.sourceType ??
        item?.uploadType ??
        item?.kind ??
        item?.doc?.sourceType ??
        item?.document?.sourceType ??
        item?.meta?.sourceType ??
        item?.metadata?.sourceType ??
        null
    ) || (docType === "figma" ? "link" : null)
  );
}

function normalizeDocumentItem(item, defaults = {}) {
  if (!isPlainObject(item)) return null;

  const docType = extractDocType(item) || defaults.docType || null;
  const versionNumber = extractVersionNumber(item) ?? defaults.versionNumber ?? null;
  const indexingStatus = extractIndexingStatus(item) || defaults.indexingStatus || null;
  const createdAt = extractCreatedAt(item) || defaults.createdAt || null;
  const displayName = extractDisplayName(item, docType);
  const sourceValue = extractSourceValue(item);
  const sourceType = extractSourceType(item, docType);

  return {
    id: toStringValue(item?.id ?? item?._id ?? item?.artifactId ?? item?.documentId ?? item?.uuid) || null,
    docType,
    versionNumber: Number.isFinite(versionNumber) ? versionNumber : null,
    indexingStatus,
    createdAt,
    displayName,
    sourceValue,
    sourceType,
    raw: item,
  };
}

function normalizeDirectItems(rawItems, defaults = {}) {
  return rawItems.map((item) => normalizeDocumentItem(item, defaults)).filter(Boolean);
}

function normalizeVersionGroups(rawGroups) {
  const out = [];

  for (const group of rawGroups) {
    if (!isPlainObject(group)) continue;

    const versionNumber = extractVersionNumber(group);
    const indexingStatus = extractIndexingStatus(group);
    const createdAt = extractCreatedAt(group);

    const nestedItems = firstArray([
      group?.items,
      group?.documents,
      group?.artifacts,
      group?.docs,
      group?.files,
      group?.entries,
    ]);

    if (nestedItems.length) {
      out.push(
        ...normalizeDirectItems(nestedItems, {
          versionNumber,
          indexingStatus,
          createdAt,
        })
      );
      continue;
    }

    if (Number.isFinite(versionNumber)) {
      out.push({
        id: `version-${versionNumber}`,
        docType: null,
        versionNumber,
        indexingStatus: indexingStatus || null,
        createdAt: createdAt || null,
        displayName: `Version ${versionNumber}`,
        sourceValue: null,
        sourceType: null,
        raw: group,
      });
    }
  }

  return out;
}

function collectVersionNumbersFromValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (isPlainObject(entry)) return extractVersionNumber(entry);
        return toFiniteNumber(entry);
      })
      .filter((num) => Number.isFinite(num));
  }

  const num = toFiniteNumber(value);
  return Number.isFinite(num) ? [num] : [];
}

function uniqueSortedNumbers(values) {
  return Array.from(new Set((values || []).filter((v) => Number.isFinite(v)))).sort((a, b) => a - b);
}

export function deriveVersionsFromRegistry(registry) {
  const data = Array.isArray(registry) ? { items: registry } : registry || {};
  const items = Array.isArray(data?.items) ? data.items : [];

  const itemVersions = items
    .map((item) => extractVersionNumber(item) ?? item?.versionNumber ?? null)
    .filter((num) => Number.isFinite(num));

  const explicitVersions = uniqueSortedNumbers([
    ...collectVersionNumbersFromValue(data?.versions),
    ...collectVersionNumbersFromValue(data?.versionNumbers),
    ...collectVersionNumbersFromValue(data?.availableVersions),
    ...collectVersionNumbersFromValue(data?.raw?.versions),
    ...collectVersionNumbersFromValue(data?.raw?.data?.versions),
    ...collectVersionNumbersFromValue(data?.raw?.versionNumbers),
    ...collectVersionNumbersFromValue(data?.raw?.data?.versionNumbers),
  ]);

  let versions = uniqueSortedNumbers([...itemVersions, ...explicitVersions]);

  if (!versions.length && items.length > 0) {
    versions = [1];
  }

  const latestFromData =
    toFiniteNumber(data?.latest) ??
    toFiniteNumber(data?.latestVersion) ??
    toFiniteNumber(data?.currentVersion) ??
    toFiniteNumber(data?.raw?.latestVersion) ??
    toFiniteNumber(data?.raw?.data?.latestVersion) ??
    null;

  const latest = Number.isFinite(latestFromData)
    ? latestFromData
    : versions.length
      ? versions[versions.length - 1]
      : null;

  return { versions, latest };
}

export function normalizeRegistryResponse(data) {
  const directItems = firstArray([
    data?.data?.items,
    data?.items,
    data?.data?.documents,
    data?.documents,
    data?.data?.artifacts,
    data?.artifacts,
    data?.data?.docs,
    data?.docs,
    Array.isArray(data?.data) ? data?.data : null,
    Array.isArray(data) ? data : null,
  ]);

  const versionGroups = firstArray([
    data?.data?.versions,
    data?.versions,
    data?.data?.history,
    data?.history,
    data?.data?.versionItems,
    data?.versionItems,
  ]);

  let items = directItems.length ? normalizeDirectItems(directItems) : [];

  if (!items.length && versionGroups.length) {
    items = normalizeVersionGroups(versionGroups);
  }

  const meta = deriveVersionsFromRegistry({
    items,
    raw: data,
    versions:
      data?.data?.versionNumbers ??
      data?.versionNumbers ??
      data?.data?.availableVersions ??
      data?.availableVersions ??
      data?.data?.versions ??
      data?.versions ??
      [],
    latest:
      data?.data?.latestVersion ??
      data?.latestVersion ??
      data?.data?.currentVersion ??
      data?.currentVersion ??
      null,
  });

  if (items.length && meta.versions.length === 1 && items.every((item) => !Number.isFinite(item?.versionNumber))) {
    items = items.map((item) => ({
      ...item,
      versionNumber: meta.versions[0],
    }));
  }

  return {
    items,
    versions: meta.versions,
    latest: meta.latest,
    raw: data,
  };
}

export async function fetchFeatureDocumentsRegistry({ projectId, featureId }) {
  const res = await http.get(`/projects/${projectId}/features/${featureId}/documents`);
  return normalizeRegistryResponse(res?.data);
}

export async function fetchFeatureDocumentsByVersion({ projectId, featureId, versionNumber }) {
  const res = await http.get(
    `/projects/${projectId}/features/${featureId}/documents?versionNumber=${encodeURIComponent(
      String(versionNumber)
    )}`
  );

  const data = res?.data;

  const directItems = firstArray([
    data?.data?.items,
    data?.items,
    data?.data?.documents,
    data?.documents,
    data?.data?.artifacts,
    data?.artifacts,
    data?.data?.docs,
    data?.docs,
    Array.isArray(data?.data) ? data?.data : null,
    Array.isArray(data) ? data : null,
  ]);

  const items = normalizeDirectItems(directItems, {
    versionNumber: toFiniteNumber(versionNumber),
  });

  const indexingStatus =
    extractIndexingStatus(data?.data) ||
    extractIndexingStatus(data) ||
    (items.find((item) => item?.indexingStatus)?.indexingStatus ?? null);

  return {
    indexingStatus: indexingStatus ? String(indexingStatus) : null,
    items,
    raw: data,
  };
};