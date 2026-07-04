from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv


def setup_gcli_env(env: dict[str, str]) -> dict[str, str]:
    """Helper to forward GCLI Proxy configuration to OpenAI/Gemini SDKs used by PageIndex."""
    base_url = os.getenv("GCLI_BASE_URL", "https://gcli.ggchan.dev/v1")
    # Allow PAGEINDEX_MODEL or WORKER_MODEL to override GCLI_MODEL specifically for Python worker
    model = os.getenv("PAGEINDEX_MODEL") or os.getenv("WORKER_MODEL") or os.getenv("GCLI_MODEL") or "gemini-3-flash-preview"

    # Pick the first available key from GCLI_API_KEYS, GCLI_API_KEY, or GEMINI_API_KEY
    raw_keys = os.getenv("GCLI_API_KEYS") or os.getenv("GCLI_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    first_key = ""
    if raw_keys:
        first_entry = raw_keys.split(",")[0].strip()
        first_key = first_entry.split(":")[0].strip()

    if base_url:
        env["OPENAI_BASE_URL"] = base_url
        env["OPENAI_API_BASE"] = base_url
    if first_key:
        env["OPENAI_API_KEY"] = first_key
        env["GEMINI_API_KEY"] = first_key
        env["GOOGLE_API_KEY"] = first_key
    if model:
        env["OPENAI_MODEL_NAME"] = model
        env["PAGEINDEX_MODEL"] = model
        env["WORKER_MODEL"] = model

    return env


def preprocess_source_file(source_path: Path) -> Path:
    """Preprocess non-PDF/non-MD files (e.g. .docx, .xlsx, .pptx, .html, .csv) using MarkItDown."""
    ext = source_path.suffix.lower()
    if ext in [".pdf", ".md", ".markdown", ".txt"]:
        return source_path

    print(f"[Preprocess] Detected '{ext}' file ({source_path.name}). Converting to Markdown via MarkItDown...")
    try:
        from markitdown import MarkItDown

        md_converter = MarkItDown()
        result = md_converter.convert(str(source_path))

        converted_path = source_path.parent / f"{source_path.stem}_converted.md"
        converted_path.write_text(result.text_content, encoding="utf-8")
        print(f"[Preprocess] Successfully converted -> {converted_path.name}")
        return converted_path
    except ImportError:
        raise RuntimeError(
            f"File format '{ext}' requires 'markitdown'. Please run: pip install markitdown"
        )
    except Exception as err:
        raise RuntimeError(
            f"Failed to convert '{source_path.name}' to Markdown via MarkItDown: {err}"
        )


def run_pageindex(source: str, output: str, pageindex_dir: str | None = None) -> Path:
    """Run a locally installed VectifyAI/PageIndex command and produce JSON output.

    The exact PageIndex CLI can vary by installation. Override PAGEINDEX_COMMAND when needed.
    """
    source_path = Path(source).resolve()
    effective_source = preprocess_source_file(source_path)

    output_path = Path(output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    command_template = os.getenv(
        "PAGEINDEX_COMMAND",
        "python -m pageindex --input {source} --output {output}",
    )
    command = command_template.format(source=str(effective_source), output=str(output_path))
    
    # Merge current environment with GCLI proxy settings
    run_env = os.environ.copy()
    setup_gcli_env(run_env)

    subprocess.run(command, cwd=pageindex_dir, shell=True, check=True, env=run_env)
    return output_path


def main() -> None:
    # Ensure root .env is loaded
    root_env = Path(__file__).resolve().parents[2] / ".env"
    if root_env.exists():
        load_dotenv(root_env)
    else:
        load_dotenv()

    parser = argparse.ArgumentParser(description="Run PageIndex locally against a source file.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--pageindex-dir")
    args = parser.parse_args()
    output = run_pageindex(args.source, args.output, args.pageindex_dir)
    print(json.dumps({"output": str(output)}, indent=2))


if __name__ == "__main__":
    main()

