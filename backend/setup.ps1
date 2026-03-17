# Setup script for Pettikadai RAG Backend
Write-Host "Setting up Python virtual environment (Preferring 3.11)..." -ForegroundColor Cyan

# Remove old venv if it exists to ensure fresh start with 3.11
if (Test-Path "venv") {
    Write-Host "Removing old virtual environment..." -ForegroundColor Yellow
    Remove-Item -Path "venv" -Recurse -Force
}

# Try to find Python 3.11
$pythonCmd = "python"
$pythonArgs = @()

if (Get-Command "py" -ErrorAction SilentlyContinue) {
    if (& py -3.11 --version 2>$null) {
        $pythonCmd = "py"
        $pythonArgs = @("-3.11")
        Write-Host "Found Python 3.11 via 'py -3.11'" -ForegroundColor Green
    }
} elseif (Get-Command "python3.11" -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3.11"
    Write-Host "Found Python 3.11 via 'python3.11'" -ForegroundColor Green
} else {
    Write-Host "Could not specifically find Python 3.11, using default 'python'. Ensure it is 3.11 if possible." -ForegroundColor Yellow
}

& $pythonCmd $pythonArgs -m venv venv

.\venv\Scripts\Activate.ps1

Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "Setup complete. You can now start the backend with 'python main.py'" -ForegroundColor Green
