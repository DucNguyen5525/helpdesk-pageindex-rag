from __future__ import annotations

import hashlib
from typing import Any


def flatten_pageindex_tree(index_json: Any) -> list[dict[str, Any]]:
    roots = _root_candidates(index_json)
    nodes: list[dict[str, Any]] = []
    seen: set[str] = set()
    for root in roots:
        _walk(root, None, [], 0, nodes, seen)
    return [node for node in nodes if node.get("title") or node.get("summary") or node.get("content")]


def _root_candidates(value: Any) -> list[Any]:
    if not isinstance(value, dict):
        return []
    if isinstance(value.get("nodes"), list):
        return value["nodes"]
    if isinstance(value.get("children"), list):
        return [value]
    if value.get("root") is not None:
        return [value["root"]]
    if value.get("tree") is not None:
        return [value["tree"]]
    if value.get("document") is not None:
        return _root_candidates(value["document"])
    return [value]


def _walk(raw: Any, parent_id: str | None, inherited_path: list[str], level: int, nodes: list[dict[str, Any]], seen: set[str]) -> None:
    if not isinstance(raw, dict):
        return
    title = _string(raw.get("title")) or _string(raw.get("heading")) or _string(raw.get("name")) or "Untitled section"
    path = _path(raw.get("path"), inherited_path + [title])
    node_id = _string(raw.get("nodeId")) or _string(raw.get("id")) or _stable_id(path, len(nodes))
    children = raw.get("children") or raw.get("nodes") or raw.get("sections") or []
    if not isinstance(children, list):
        children = []

    if node_id not in seen:
        seen.add(node_id)
        nodes.append({
            "nodeId": node_id,
            "parentNodeId": parent_id,
            "title": title,
            "summary": _string(raw.get("summary")) or _string(raw.get("abstract")),
            "content": _string(raw.get("content")) or _string(raw.get("text")) or _string(raw.get("body")) or "",
            "path": path,
            "level": _number(raw.get("level")) if _number(raw.get("level")) is not None else level,
            "pageStart": _number(raw.get("pageStart")) or _number(raw.get("page_start")) or _number(raw.get("startPage")),
            "pageEnd": _number(raw.get("pageEnd")) or _number(raw.get("page_end")) or _number(raw.get("endPage")),
            "sourceRef": _string(raw.get("sourceRef")) or _string(raw.get("source_ref")) or _string(raw.get("source")),
            "childrenIds": [_child_id(child, path, index) for index, child in enumerate(children) if isinstance(child, dict)],
        })

    for child in children:
        _walk(child, node_id, path, level + 1, nodes, seen)


def _string(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _number(value: Any) -> int | float | None:
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return int(value)
        except ValueError:
            return None
    return None


def _path(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [part.strip() for part in value.replace(">", "/").split("/") if part.strip()]
    return fallback


def _child_id(child: dict[str, Any], path: list[str], index: int) -> str:
    return _string(child.get("nodeId")) or _string(child.get("id")) or _stable_id(path + [str(index)], index)


def _stable_id(path: list[str], index: int) -> str:
    raw = "/".join(path) + f"/{index}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]
