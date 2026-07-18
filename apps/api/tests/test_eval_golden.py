import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "eval_golden.py"


def test_eval_golden_passes_and_reports_an_abstention_case() -> None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stdout + result.stderr
    assert "gc_04_insufficient_evidence" in result.stdout
    assert "abstained" in result.stdout
    assert "RESULT: PASS" in result.stdout
