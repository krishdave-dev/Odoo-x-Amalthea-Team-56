import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  })
  console.log('✅ Created organization:', organization.name)

  // Create users
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
      hourlyRate: 100,
      isActive: true,
    },
  })
  console.log('✅ Created admin user:', admin.email)

  const managerPassword = await hashPassword('manager123')
  const manager = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: 'manager@demo.com',
      name: 'Project Manager',
      passwordHash: managerPassword,
      role: 'manager',
      hourlyRate: 80,
      isActive: true,
    },
  })
  console.log('✅ Created manager user:', manager.email)

  const devPassword = await hashPassword('dev123')
  const developer = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: 'dev@demo.com',
      name: 'Developer',
      passwordHash: devPassword,
      role: 'member',
      hourlyRate: 60,
      isActive: true,
    },
  })
  console.log('✅ Created developer user:', developer.email)

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Website Redesign',
      code: 'WEB-001',
      description: 'Complete redesign of company website with modern UI/UX',
      projectManagerId: manager.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      status: 'in_progress',
      budget: 50000,
      progressPct: 45,
    },
  })
  console.log('✅ Created project:', project1.name)

  const project2 = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Mobile App Development',
      code: 'MOB-001',
      description: 'Native mobile app for iOS and Android',
      projectManagerId: manager.id,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-06-30'),
      status: 'planned',
      budget: 100000,
      progressPct: 10,
    },
  })
  console.log('✅ Created project:', project2.name)

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project1.id,
        userId: manager.id,
        roleInProject: 'Project Manager',
      },
      {
        projectId: project1.id,
        userId: developer.id,
        roleInProject: 'Developer',
      },
      {
        projectId: project2.id,
        userId: manager.id,
        roleInProject: 'Project Manager',
      },
      {
        projectId: project2.id,
        userId: developer.id,
        roleInProject: 'Lead Developer',
      },
    ],
  })
  console.log('✅ Added project members')

  // Create task lists
  const taskList1 = await prisma.taskList.create({
    data: {
      projectId: project1.id,
      title: 'Design Phase',
      ordinal: 1,
    },
  })

  const taskList2 = await prisma.taskList.create({
    data: {
      projectId: project1.id,
      title: 'Development Phase',
      ordinal: 2,
    },
  })

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList1.id,
      title: 'Create wireframes',
      description: 'Design wireframes for all main pages',
      assigneeId: developer.id,
      priority: 3,
      status: 'completed',
      estimateHours: 16,
      hoursLogged: 14,
      dueDate: new Date('2025-01-15'),
    },
  })

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList2.id,
      title: 'Implement homepage',
      description: 'Build responsive homepage with Next.js',
      assigneeId: developer.id,
      priority: 3,
      status: 'in_progress',
      estimateHours: 24,
      hoursLogged: 12,
      dueDate: new Date('2025-01-25'),
    },
  })

  await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList2.id,
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated deployment',
      assigneeId: developer.id,
      priority: 2,
      status: 'new',
      estimateHours: 8,
      hoursLogged: 0,
      dueDate: new Date('2025-02-01'),
    },
  })
  console.log('✅ Created tasks')

  // Create timesheets
  await prisma.timesheet.createMany({
    data: [
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: developer.id,
        start: new Date('2025-01-10T09:00:00Z'),
        end: new Date('2025-01-10T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 480, // 8 hours * 60/hour
        notes: 'Wireframe design work',
        status: 'submitted',
      },
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: developer.id,
        start: new Date('2025-01-11T09:00:00Z'),
        end: new Date('2025-01-11T15:00:00Z'),
        durationHours: 6,
        billable: true,
        costAtTime: 360,
        notes: 'Continued wireframe work',
        status: 'approved',
      },
      {
        projectId: project1.id,
        taskId: task2.id,
        userId: developer.id,
        start: new Date('2025-01-20T09:00:00Z'),
        end: new Date('2025-01-20T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 480,
        notes: 'Homepage development',
        status: 'draft',
      },
      {
        projectId: project1.id,
        taskId: task2.id,
        userId: developer.id,
        start: new Date('2025-01-21T09:00:00Z'),
        end: new Date('2025-01-21T13:00:00Z'),
        durationHours: 4,
        billable: true,
        costAtTime: 240,
        notes: 'Homepage responsive design',
        status: 'draft',
      },
    ],
  })
  console.log('✅ Created timesheets')

  // Create sales order
  const salesOrder = await prisma.salesOrder.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      soNumber: 'SO-2025-001',
      partnerName: 'Acme Corporation',
      orderDate: new Date('2024-12-15'),
      totalAmount: 50000,
      status: 'confirmed',
    },
  })
  console.log('✅ Created sales order:', salesOrder.soNumber)

  // Create customer invoice
  const invoice = await prisma.customerInvoice.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      soId: salesOrder.id,
      invoiceNumber: 'INV-2025-001',
      invoiceDate: new Date('2025-01-01'),
      amount: 25000,
      status: 'sent',
    },
  })
  console.log('✅ Created invoice:', invoice.invoiceNumber)

  // Create expenses
  await prisma.expense.createMany({
    data: [
      {
        organizationId: organization.id,
        projectId: project1.id,
        userId: developer.id,
        amount: 150,
        billable: true,
        status: 'approved',
        note: 'Design software subscription',
        approvedAt: new Date('2025-01-15'),
      },
      {
        organizationId: organization.id,
        projectId: project1.id,
        userId: developer.id,
        amount: 50,
        billable: false,
        status: 'submitted',
        note: 'Team lunch',
      },
    ],
  })
  console.log('✅ Created expenses')

  // Create audit events
  await prisma.event.createMany({
    data: [
      {
        organizationId: organization.id,
        entityType: 'project',
        entityId: project1.id,
        eventType: 'project.created',
        payload: { name: project1.name },
      },
      {
        organizationId: organization.id,
        entityType: 'project',
        entityId: project2.id,
        eventType: 'project.created',
        payload: { name: project2.name },
      },
      {
        organizationId: organization.id,
        entityType: 'invoice',
        entityId: invoice.id,
        eventType: 'invoice.created',
        payload: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
      },
    ],
  })
  console.log('✅ Created audit events')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin: admin@demo.com / admin123')
  console.log('   Manager: manager@demo.com / manager123')
  console.log('   Developer: dev@demo.com / dev123')
  console.log(`\n🏢 Organization ID: ${organization.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
