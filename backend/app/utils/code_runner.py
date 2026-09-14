import time
import subprocess
import sys
import tempfile
import os
from typing import Tuple


def execute_code(code: str, language: str = "python", input_data: str = "") -> Tuple[str, str, float]:
    """
    Safely execute candidate code in a separate process with a strict timeout.
    Returns (stdout, stderr, execution_time_ms).
    """
    start_time = time.time()
    language = language.lower().strip()
    
    if language not in ("python", "javascript"):
        return "", f"Language '{language}' code execution is not supported in the sandbox. Python and JavaScript are supported.", 0.0

    ext = ".py" if language == "python" else ".js"
    cmd_base = [sys.executable] if language == "python" else ["node"]

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False, encoding="utf-8") as tmp_file:
            tmp_file.write(code)
            tmp_path = tmp_file.name

        try:
            res = subprocess.run(
                cmd_base + [tmp_path],
                input=input_data or "",
                capture_output=True,
                text=True,
                timeout=5.0
            )
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return res.stdout, res.stderr, elapsed_ms
        except subprocess.TimeoutExpired:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return "", "Execution timed out (5.0s limit exceeded).", elapsed_ms
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return "", f"Execution error: {str(e)}", elapsed_ms
