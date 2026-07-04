import type { CreatePageIndexNodeInput } from "./repository";

interface FlattenInput {
  indexJson: unknown;
}

type FlatNode = CreatePageIndexNodeInput;

export function flattenPageIndexTree(input: FlattenInput): FlatNode[] {
  const rootCandidates = getRootCandidates(input.indexJson);
  const nodes: FlatNode[] = [];
  const seen = new Set<string>();

  for (const root of rootCandidates) {
    walkNode(root, {
      parentNodeId: undefined,
      inheritedPath: [],
      level: 0,
      nodes,
      seen
    });
  }

  return nodes.filter((node) => node.content.trim() || node.summary?.trim() || node.title.trim());
}

function getRootCandidates(value: unknown): unknown[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;

  if (Array.isArray(record.nodes)) return record.nodes;
  if (Array.isArray(record.children)) return [record];
  if (record.root) return [record.root];
  if (record.tree) return [record.tree];
  if (record.document) return getRootCandidates(record.document);

  return [record];
}

function walkNode(
  rawNode: unknown,
  state: {
    parentNodeId?: string;
    inheritedPath: string[];
    level: number;
    nodes: FlatNode[];
    seen: Set<string>;
  }
) {
  if (!rawNode || typeof rawNode !== "object") return;
  const node = rawNode as Record<string, unknown>;
  const title = stringValue(node.title) || stringValue(node.heading) || stringValue(node.name) || "Untitled section";
  const nodeId = stringValue(node.nodeId) || stringValue(node.id) || makeNodeId([...state.inheritedPath, title], state.nodes.length);
  const children = arrayValue(node.children) ?? arrayValue(node.nodes) ?? arrayValue(node.sections) ?? [];
  const path = normalizePath(node.path, [...state.inheritedPath, title]);

  if (!state.seen.has(nodeId)) {
    state.seen.add(nodeId);
    state.nodes.push({
      nodeId,
      parentNodeId: state.parentNodeId,
      title,
      summary: stringValue(node.summary) || stringValue(node.abstract),
      content: stringValue(node.content) || stringValue(node.text) || stringValue(node.body) || "",
      path,
      level: numberValue(node.level) ?? state.level,
      pageStart: numberValue(node.pageStart) ?? numberValue(node.page_start) ?? numberValue(node.startPage),
      pageEnd: numberValue(node.pageEnd) ?? numberValue(node.page_end) ?? numberValue(node.endPage),
      sourceRef: stringValue(node.sourceRef) || stringValue(node.source_ref) || stringValue(node.source),
      childrenIds: children
        .map((child, index) => childId(child, [...path, `child-${index}`], index))
        .filter((childId): childId is string => Boolean(childId))
    });
  }

  for (const child of children) {
    walkNode(child, {
      parentNodeId: nodeId,
      inheritedPath: path,
      level: state.level + 1,
      nodes: state.nodes,
      seen: state.seen
    });
  }
}

function childId(value: unknown, path: string[], index: number) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return stringValue(record.nodeId) || stringValue(record.id) || makeNodeId(path, index);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function arrayValue(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function normalizePath(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter((childId): childId is string => Boolean(childId));
  if (typeof value === "string" && value.trim()) return value.split(/[>/]/).map((part) => part.trim()).filter((childId): childId is string => Boolean(childId));
  return fallback;
}

function makeNodeId(path: string[], index: number) {
  return `${path.join("-")}-${index}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `node-${index}`;
}
