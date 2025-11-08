# OneFlow Database Setup Script
# Run this script to set up your database quickly

Write-Host "🚀 OneFlow Database Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file with:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=`"postgresql://username:password@localhost:5432/oneflow_db`"" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host "DATABASE_URL=`"postgresql://postgres:password@localhost:5432/oneflow_db`"" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Step 2: Generate Prisma Client
Write-Host ""
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# Step 3: Push schema to database
Write-Host ""
Write-Host "🗄️  Pushing schema to database..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "  2. Database 'oneflow_db' exists" -ForegroundColor Yellow
    Write-Host "  3. DATABASE_URL in .env is correct" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "✅ Schema pushed successfully" -ForegroundColor Green

# Step 4: Ask about seeding
Write-Host ""
Write-Host "🌱 Would you like to seed the database with sample data? (y/n)" -ForegroundColor Cyan
$seed = Read-Host
if ($seed -eq "y" -or $seed -eq "Y") {
    Write-Host "Seeding database..." -ForegroundColor Cyan
    npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Sample credentials:" -ForegroundColor Yellow
        Write-Host "  Admin: admin@demo.com / admin123" -ForegroundColor Gray
        Write-Host "  Manager: manager@demo.com / manager123" -ForegroundColor Gray
        Write-Host "  Developer: dev@demo.com / dev123" -ForegroundColor Gray
    }
}

# Step 5: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Open Prisma Studio: npm run db:studio" -ForegroundColor White
Write-Host "  3. Test the API: See API_TESTING_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: API_DOCUMENTATION.md" -ForegroundColor Gray
Write-Host "Quick Start: QUICK_START_API.md" -ForegroundColor Gray
Write-Host ""
