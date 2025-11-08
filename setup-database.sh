#!/bin/bash

# OneFlow Database Setup Script (Linux/Mac)
# Run this script to set up your database quickly

echo "🚀 OneFlow Database Setup"
echo "========================="
echo ""

# Step 1: Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create a .env file with:"
    echo 'DATABASE_URL="postgresql://username:password@localhost:5432/oneflow_db"'
    echo ""
    echo "Example:"
    echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/oneflow_db"'
    echo ""
    exit 1
fi

echo "✅ .env file found"

# Step 2: Generate Prisma Client
echo ""
echo "📦 Generating Prisma Client..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi
echo "✅ Prisma Client generated"

# Step 3: Push schema to database
echo ""
echo "🗄️  Pushing schema to database..."
npm run db:push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    echo ""
    echo "Please make sure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database 'oneflow_db' exists"
    echo "  3. DATABASE_URL in .env is correct"
    echo ""
    exit 1
fi
echo "✅ Schema pushed successfully"

# Step 4: Ask about seeding
echo ""
read -p "🌱 Would you like to seed the database with sample data? (y/n) " seed
if [ "$seed" = "y" ] || [ "$seed" = "Y" ]; then
    echo "Seeding database..."
    npm run db:seed
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
        echo ""
        echo "Sample credentials:"
        echo "  Admin: admin@demo.com / admin123"
        echo "  Manager: manager@demo.com / manager123"
        echo "  Developer: dev@demo.com / dev123"
    fi
fi

# Step 5: Summary
echo ""
echo "========================================"
echo "✅ Database setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Open Prisma Studio: npm run db:studio"
echo "  3. Test the API: See API_TESTING_GUIDE.md"
echo ""
echo "API Documentation: API_DOCUMENTATION.md"
echo "Quick Start: QUICK_START_API.md"
echo ""
