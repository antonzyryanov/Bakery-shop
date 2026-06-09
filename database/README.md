# Bakery Shop Database

## Create DB

Run from PowerShell:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < .\database\init.sql
```

If your MySQL folder name differs, adjust the path to `mysql.exe`.

## Normalization Notes

- 1NF: no repeating groups; arrays (`doneOrdersIDs`, `chosenProducts`) are represented as relational child tables.
- 2NF: non-key columns depend on the whole primary key in each table.
- 3NF: non-key columns depend only on table keys, not other non-key attributes.

## Existing DB Migration

If DB was created earlier (before `image_url` was added), run:

```powershell
Get-Content "c:\bakery_shop\database\add_product_images.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## Diagram

Open `database/schema.mmd` in Mermaid-compatible viewer.
