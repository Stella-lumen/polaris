# Polaris daily backup — tender requirement: daily backups, 12-month retention.
# Schedule with: schtasks /create /tn "Polaris Backup" /tr "powershell -File backup.ps1" /sc daily /st 02:00
param(
  [string]$DbHost = "localhost",
  [string]$DbName = "polaris",
  [string]$DbUser = "polaris",
  [string]$BackupDir = ".\backups",
  [int]$RetentionDays = 365
)

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$out = Join-Path $BackupDir "polaris-$stamp.dump"

# PostgreSQL 16 — custom-format dump (compressed, restorable with pg_restore)
& pg_dump -h $DbHost -U $DbUser -Fc -f $out $DbName
if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump failed"; exit 1 }

# Also sweep uploaded files (StoredFile storage directory) into a dated archive
if (Test-Path ".\storage") {
  Compress-Archive -Path ".\storage\*" -DestinationPath (Join-Path $BackupDir "files-$stamp.zip") -Force
}

# 12-month retention: purge backups older than $RetentionDays
Get-ChildItem $BackupDir -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | Remove-Item -Force

Write-Output "Backup complete: $out"
