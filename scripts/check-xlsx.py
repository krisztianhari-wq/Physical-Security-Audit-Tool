"""Validates tests/out/sample.xlsx with openpyxl (run after `npm test`)."""
import sys, openpyxl
wb = openpyxl.load_workbook(sys.argv[1] if len(sys.argv) > 1 else "tests/out/sample.xlsx")
assert wb.sheetnames == ["Assessment", "Summary"], wb.sheetnames
ws = wb["Assessment"]
assert ws.max_row == 86 and ws.max_column == 15
assert ws["A1"].value == "ID" and ws["O1"].value == "Subject of audit"
row = {c[0].value: c for c in ws.iter_rows(min_row=2)}
assert row["GOV-01"][3].value == "Non-compliant" and row["GOV-01"][5].value == 'Gate broken "x" <b> & ő'
assert ws.data_validations.dataValidation and "Confidential" in ws.oddHeader.right.text
s = wb["Summary"]
vals = {r[0].value: r[1].value for r in s.iter_rows(min_row=2) if r[0].value}
assert vals["Subject of audit"] == "Budaörs DC" and vals["Non-compliant"] == "1", vals
print("xlsx OK:", wb.sheetnames, ws.max_row, "rows")
