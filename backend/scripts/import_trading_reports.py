"""Import local Console CSVs without copying them into the source repository."""
import argparse
import json
import sys
from pathlib import Path
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings
from app.core.trading_imports import parse_report, preview, import_report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    # Validate every supplied file before starting any database import.
    reports = [parse_report(path.read_bytes()) for path in args.files]
    for report in reports:
        receipt = preview(report) if args.dry_run else import_report(settings.ADMIN_EMAIL, report)
        # Only counts/ranges are logged. No rows, balances, tokens, or file paths.
        print(json.dumps({k: v for k, v in receipt.items()
                          if k not in ("file_hash", "opening_balance", "closing_balance")}))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, HTTPException) as exc:
        print(getattr(exc, "detail", str(exc)), file=sys.stderr)
        raise SystemExit(1)
