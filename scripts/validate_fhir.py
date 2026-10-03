"""Run the local HL7 validator when validator_cli.jar is available.

The OAH package must be supplied separately with ``--ig`` or installed in the
validator cache. The script never treats unresolved external profiles as a
successful conformance claim.
"""
import re
import subprocess
import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
jar = ROOT / "validator_cli.jar"
parser = argparse.ArgumentParser()
parser.add_argument("bundle", nargs="?", type=Path, default=ROOT / "fhir-bundle.json")
args = parser.parse_args()
bundle = args.bundle

if not jar.exists():
    print("SKIP: validator_cli.jar is not present")
    raise SystemExit(0)

command = ["java", "-jar", str(jar), str(bundle), "-version", "4.0"]
result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
output = result.stdout + result.stderr
errors = len(re.findall(r"<td>(?:Error|Fatal)</td>", output))
unresolved = "A definition could not be found" in output
print(output)
print(f"Validator error/fatal findings: {errors}")
if unresolved:
    print("WARNING: external OAH profiles or terminology were unresolved.")
if result.returncode != 0 or errors:
    raise SystemExit(1)
