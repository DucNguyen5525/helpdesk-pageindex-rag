from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path


def run_pageindex(source: str, output: str, pageindex_dir: str | None = None) -> Path:
    """Run a locally installed VectifyAI/PageIndex command and produce JSON output.

    The exact PageIndex CLI can vary by installation. Override PAGEINDEX_COMMAND when needed.
    """
    output_path = Path(output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    command_template = os.getenv(
        "PAGEINDEX_COMMAND",
        "python -m pageindex --input {source} --output {output}",
    )
    command = command_template.format(source=str(Path(source).resolve()), output=str(output_path))
    subprocess.run(command, cwd=pageindex_dir, shell=True, check=True)
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run PageIndex locally against a source file.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--pageindex-dir")
    args = parser.parse_args()
    output = run_pageindex(args.source, args.output, args.pageindex_dir)
    print(json.dumps({"output": str(output)}, indent=2))


if __name__ == "__main__":
    main()
