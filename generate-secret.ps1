# Generate Secure Session Secret for Windows
# This script generates a cryptographically secure random string for SESSION_SECRET

Write-Host "`n=== Session Secret Generator ===" -ForegroundColor Cyan
Write-Host "Generating a secure 32-character random string for SESSION_SECRET...`n" -ForegroundColor Yellow

# Generate 32 random bytes
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)

# Convert to Base64
$sessionSecret = [Convert]::ToBase64String($bytes)

# Display the secret
Write-Host "Your SESSION_SECRET:" -ForegroundColor Green
Write-Host $sessionSecret -ForegroundColor White

# Offer to update .env file
Write-Host "`n"
$envPath = ".env"
$envExamplePath = ".env.example"

if (Test-Path $envPath) {
    Write-Host ".env file found!" -ForegroundColor Yellow
    $update = Read-Host "Do you want to update SESSION_SECRET in .env? (y/n)"
    
    if ($update -eq "y" -or $update -eq "Y") {
        $envContent = Get-Content $envPath -Raw
        
        if ($envContent -match 'SESSION_SECRET="[^"]*"') {
            $newContent = $envContent -replace 'SESSION_SECRET="[^"]*"', "SESSION_SECRET=`"$sessionSecret`""
            Set-Content -Path $envPath -Value $newContent -NoNewline
            Write-Host "`nSESSION_SECRET updated in .env file!" -ForegroundColor Green
        } else {
            Add-Content -Path $envPath -Value "`nSESSION_SECRET=`"$sessionSecret`""
            Write-Host "`nSESSION_SECRET added to .env file!" -ForegroundColor Green
        }
    }
} else {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        $envContent = Get-Content $envPath -Raw
        $newContent = $envContent -replace 'SESSION_SECRET="[^"]*"', "SESSION_SECRET=`"$sessionSecret`""
        Set-Content -Path $envPath -Value $newContent -NoNewline
        Write-Host ".env file created with SESSION_SECRET!" -ForegroundColor Green
    } else {
        Write-Host "Please create a .env file and add the SESSION_SECRET manually." -ForegroundColor Red
    }
}

Write-Host "`n=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. Copy the SESSION_SECRET value above" -ForegroundColor White
Write-Host "2. Add it to your .env file:" -ForegroundColor White
Write-Host "   SESSION_SECRET=`"$sessionSecret`"" -ForegroundColor Gray
Write-Host "3. Never commit the .env file to version control!" -ForegroundColor Red
Write-Host "`n"
