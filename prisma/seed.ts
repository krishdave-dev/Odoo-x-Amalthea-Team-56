import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (in reverse order of dependencies)
  console.log('🗑️  Cleaning existing data...')
  await prisma.taskComment.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.task.deleteMany()
  await prisma.taskList.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.vendorBill.deleteMany()
  await prisma.customerInvoice.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.analyticsCache.deleteMany()
  await prisma.event.deleteMany()
  await prisma.outboxEvent.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  console.log('✅ Cleaned existing data')

  // Create organizations
  const mainOrg = await prisma.organization.create({
    data: {
      name: 'Amalthea Technologies',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  })
  console.log('✅ Created organization:', mainOrg.name)

  const testOrg = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      currency: 'EUR',
      timezone: 'Europe/London',
    },
  })
  console.log('✅ Created test organization:', testOrg.name)

  // Create users with strong passwords (meets validation requirements)
  const adminPassword = await hashPassword('Admin@123456')
  const admin = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
      hourlyRate: 150,
      isActive: true,
    },
  })
  console.log('✅ Created admin user:', admin.email, '/ Admin@123456')

  const managerPassword = await hashPassword('Manager@123456')
  const manager = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'manager@demo.com',
      name: 'Sarah Johnson',
      passwordHash: managerPassword,
      role: 'manager',
      hourlyRate: 100,
      isActive: true,
    },
  })
  console.log('✅ Created manager user:', manager.email, '/ Manager@123456')

  const manager2Password = await hashPassword('Manager@123456')
  const manager2 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'manager2@demo.com',
      name: 'David Williams',
      passwordHash: manager2Password,
      role: 'manager',
      hourlyRate: 95,
      isActive: true,
    },
  })
  console.log('✅ Created manager user:', manager2.email, '/ Manager@123456')

  const dev1Password = await hashPassword('Developer@123')
  const developer1 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'dev1@demo.com',
      name: 'John Smith',
      passwordHash: dev1Password,
      role: 'member',
      hourlyRate: 75,
      isActive: true,
    },
  })
  console.log('✅ Created developer user:', developer1.email, '/ Developer@123')

  const dev2Password = await hashPassword('Developer@123')
  const developer2 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'dev2@demo.com',
      name: 'Emily Davis',
      passwordHash: dev2Password,
      role: 'member',
      hourlyRate: 70,
      isActive: true,
    },
  })
  console.log('✅ Created developer user:', developer2.email, '/ Developer@123')

  const dev3Password = await hashPassword('Developer@123')
  const developer3 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'dev3@demo.com',
      name: 'Alex Turner',
      passwordHash: dev3Password,
      role: 'member',
      hourlyRate: 80,
      isActive: true,
    },
  })
  console.log('✅ Created developer user:', developer3.email, '/ Developer@123')

  const designerPassword = await hashPassword('Designer@123')
  const designer = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'designer@demo.com',
      name: 'Michael Chen',
      passwordHash: designerPassword,
      role: 'member',
      hourlyRate: 85,
      isActive: true,
    },
  })
  console.log('✅ Created designer user:', designer.email, '/ Designer@123')

  const qaPassword = await hashPassword('Tester@123456')
  const qa = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'qa@demo.com',
      name: 'Lisa Anderson',
      passwordHash: qaPassword,
      role: 'member',
      hourlyRate: 65,
      isActive: true,
    },
  })
  console.log('✅ Created QA user:', qa.email, '/ Tester@123456')

  const finance1Password = await hashPassword('Finance@123')
  const finance1 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'finance@demo.com',
      name: 'Rachel Martinez',
      passwordHash: finance1Password,
      role: 'finance',
      hourlyRate: 90,
      isActive: true,
    },
  })
  console.log('✅ Created finance user:', finance1.email, '/ Finance@123')

  const finance2Password = await hashPassword('Finance@123')
  const finance2 = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'accountant@demo.com',
      name: 'Kevin Thompson',
      passwordHash: finance2Password,
      role: 'finance',
      hourlyRate: 85,
      isActive: true,
    },
  })
  console.log('✅ Created accountant user:', finance2.email, '/ Finance@123')

  // Inactive user for testing
  const inactivePassword = await hashPassword('Inactive@123')
  const inactiveUser = await prisma.user.create({
    data: {
      organizationId: mainOrg.id,
      email: 'inactive@demo.com',
      name: 'Inactive User',
      passwordHash: inactivePassword,
      role: 'member',
      hourlyRate: 60,
      isActive: false,
    },
  })
  console.log('✅ Created inactive user:', inactiveUser.email, '/ Inactive@123')

  // User in test org
  const testUserPassword = await hashPassword('TestUser@123')
  const testUser = await prisma.user.create({
    data: {
      organizationId: testOrg.id,
      email: 'testuser@demo.com',
      name: 'Test User',
      passwordHash: testUserPassword,
      role: 'manager',
      hourlyRate: 90,
      isActive: true,
    },
  })
  console.log('✅ Created test org user:', testUser.email, '/ TestUser@123')

  // Create some pending invitations for testing
  const inviteExpiresAt = new Date()
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7)

  await prisma.organizationInvitation.createMany({
    data: [
      {
        organizationId: mainOrg.id,
        email: 'newhire@demo.com',
        role: 'member',
        invitedById: manager.id,
        expiresAt: inviteExpiresAt,
        status: 'pending',
      },
      {
        organizationId: mainOrg.id,
        email: 'newfinance@demo.com',
        role: 'finance',
        invitedById: admin.id,
        expiresAt: inviteExpiresAt,
        status: 'pending',
      },
    ],
  })
  console.log('✅ Created pending invitations')

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      organizationId: mainOrg.id,
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
      organizationId: mainOrg.id,
      name: 'Mobile App Development',
      code: 'MOB-001',
      description: 'Native mobile app for iOS and Android',
      projectManagerId: manager.id,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-06-30'),
      status: 'in_progress',
      budget: 100000,
      progressPct: 25,
    },
  })
  console.log('✅ Created project:', project2.name)

  const project3 = await prisma.project.create({
    data: {
      organizationId: mainOrg.id,
      name: 'E-commerce Platform',
      code: 'ECOM-001',
      description: 'Build full-stack e-commerce solution with payment integration',
      projectManagerId: manager2.id,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-08-31'),
      status: 'planned',
      budget: 150000,
      progressPct: 5,
    },
  })
  console.log('✅ Created project:', project3.name)

  const project4 = await prisma.project.create({
    data: {
      organizationId: mainOrg.id,
      name: 'Internal Dashboard',
      code: 'DASH-001',
      description: 'Analytics dashboard for internal team metrics',
      projectManagerId: manager2.id,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-01-31'),
      status: 'completed',
      budget: 30000,
      progressPct: 100,
    },
  })
  console.log('✅ Created project:', project4.name)

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: manager.id, roleInProject: 'Project Manager' },
      { projectId: project1.id, userId: developer1.id, roleInProject: 'Frontend Developer' },
      { projectId: project1.id, userId: developer2.id, roleInProject: 'Backend Developer' },
      { projectId: project1.id, userId: designer.id, roleInProject: 'UI/UX Designer' },
      { projectId: project1.id, userId: qa.id, roleInProject: 'QA Engineer' },
      
      { projectId: project2.id, userId: manager.id, roleInProject: 'Project Manager' },
      { projectId: project2.id, userId: developer1.id, roleInProject: 'Lead Developer' },
      { projectId: project2.id, userId: developer3.id, roleInProject: 'Mobile Developer' },
      { projectId: project2.id, userId: qa.id, roleInProject: 'QA Engineer' },
      
      { projectId: project3.id, userId: manager2.id, roleInProject: 'Project Manager' },
      { projectId: project3.id, userId: developer2.id, roleInProject: 'Full Stack Developer' },
      { projectId: project3.id, userId: developer3.id, roleInProject: 'Backend Developer' },
      { projectId: project3.id, userId: designer.id, roleInProject: 'Product Designer' },
      
      { projectId: project4.id, userId: manager2.id, roleInProject: 'Project Manager' },
      { projectId: project4.id, userId: developer1.id, roleInProject: 'Full Stack Developer' },
      { projectId: project4.id, userId: qa.id, roleInProject: 'QA Engineer' },
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

  const taskList3 = await prisma.taskList.create({
    data: {
      projectId: project1.id,
      title: 'Testing & QA',
      ordinal: 3,
    },
  })

  const taskList4 = await prisma.taskList.create({
    data: {
      projectId: project2.id,
      title: 'Planning',
      ordinal: 1,
    },
  })

  const taskList5 = await prisma.taskList.create({
    data: {
      projectId: project2.id,
      title: 'Implementation',
      ordinal: 2,
    },
  })
  console.log('✅ Created task lists')

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList1.id,
      title: 'Create wireframes',
      description: 'Design wireframes for all main pages',
      assigneeId: designer.id,
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
      assigneeId: developer1.id,
      priority: 3,
      status: 'in_progress',
      estimateHours: 24,
      hoursLogged: 12,
      dueDate: new Date('2025-01-25'),
    },
  })

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList2.id,
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated deployment',
      assigneeId: developer2.id,
      priority: 2,
      status: 'new',
      estimateHours: 8,
      hoursLogged: 0,
      dueDate: new Date('2025-02-01'),
    },
  })

  const task4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      listId: taskList3.id,
      title: 'Integration testing',
      description: 'Perform end-to-end integration tests',
      assigneeId: qa.id,
      priority: 3,
      status: 'new',
      estimateHours: 16,
      hoursLogged: 0,
      dueDate: new Date('2025-02-15'),
    },
  })

  const task5 = await prisma.task.create({
    data: {
      projectId: project2.id,
      listId: taskList4.id,
      title: 'Requirements gathering',
      description: 'Collect and document app requirements',
      assigneeId: manager.id,
      priority: 3,
      status: 'completed',
      estimateHours: 12,
      hoursLogged: 10,
      dueDate: new Date('2025-01-20'),
    },
  })

  const task6 = await prisma.task.create({
    data: {
      projectId: project2.id,
      listId: taskList5.id,
      title: 'Build authentication module',
      description: 'Implement user authentication and authorization',
      assigneeId: developer3.id,
      priority: 3,
      status: 'in_progress',
      estimateHours: 32,
      hoursLogged: 16,
      dueDate: new Date('2025-02-10'),
    },
  })
  console.log('✅ Created tasks')

  // Create timesheets
  await prisma.timesheet.createMany({
    data: [
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: designer.id,
        start: new Date('2025-01-10T09:00:00Z'),
        end: new Date('2025-01-10T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 680, // 8 hours * 85/hour
        notes: 'Wireframe design work',
        status: 'submitted',
      },
      {
        projectId: project1.id,
        taskId: task1.id,
        userId: designer.id,
        start: new Date('2025-01-11T09:00:00Z'),
        end: new Date('2025-01-11T15:00:00Z'),
        durationHours: 6,
        billable: true,
        costAtTime: 510,
        notes: 'Continued wireframe work',
        status: 'approved',
      },
      {
        projectId: project1.id,
        taskId: task2.id,
        userId: developer1.id,
        start: new Date('2025-01-20T09:00:00Z'),
        end: new Date('2025-01-20T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 600, // 8 hours * 75/hour
        notes: 'Homepage development',
        status: 'draft',
      },
      {
        projectId: project1.id,
        taskId: task2.id,
        userId: developer1.id,
        start: new Date('2025-01-21T09:00:00Z'),
        end: new Date('2025-01-21T13:00:00Z'),
        durationHours: 4,
        billable: true,
        costAtTime: 300,
        notes: 'Homepage responsive design',
        status: 'draft',
      },
      {
        projectId: project2.id,
        taskId: task5.id,
        userId: manager.id,
        start: new Date('2025-01-15T10:00:00Z'),
        end: new Date('2025-01-15T18:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 800,
        notes: 'Requirements gathering meeting',
        status: 'approved',
      },
      {
        projectId: project2.id,
        taskId: task6.id,
        userId: developer3.id,
        start: new Date('2025-01-28T09:00:00Z'),
        end: new Date('2025-01-28T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 640, // 8 hours * 80/hour
        notes: 'Auth module implementation',
        status: 'submitted',
      },
      {
        projectId: project2.id,
        taskId: task6.id,
        userId: developer3.id,
        start: new Date('2025-01-29T09:00:00Z'),
        end: new Date('2025-01-29T17:00:00Z'),
        durationHours: 8,
        billable: true,
        costAtTime: 640,
        notes: 'Auth module testing',
        status: 'draft',
      },
    ],
  })
  console.log('✅ Created timesheets')

  // Create sales orders
  const salesOrder1 = await prisma.salesOrder.create({
    data: {
      organizationId: mainOrg.id,
      projectId: project1.id,
      soNumber: 'SO-2025-001',
      partnerName: 'Acme Corporation',
      orderDate: new Date('2024-12-15'),
      totalAmount: 50000,
      status: 'confirmed',
    },
  })
  console.log('✅ Created sales order:', salesOrder1.soNumber)

  const salesOrder2 = await prisma.salesOrder.create({
    data: {
      organizationId: mainOrg.id,
      projectId: project2.id,
      soNumber: 'SO-2025-002',
      partnerName: 'TechStart Inc',
      orderDate: new Date('2025-01-20'),
      totalAmount: 100000,
      status: 'confirmed',
    },
  })
  console.log('✅ Created sales order:', salesOrder2.soNumber)

  // Create customer invoices
  const invoice1 = await prisma.customerInvoice.create({
    data: {
      organizationId: mainOrg.id,
      projectId: project1.id,
      soId: salesOrder1.id,
      invoiceNumber: 'INV-2025-001',
      invoiceDate: new Date('2025-01-01'),
      amount: 25000,
      status: 'sent',
    },
  })
  console.log('✅ Created invoice:', invoice1.invoiceNumber)

  const invoice2 = await prisma.customerInvoice.create({
    data: {
      organizationId: mainOrg.id,
      projectId: project2.id,
      soId: salesOrder2.id,
      invoiceNumber: 'INV-2025-002',
      invoiceDate: new Date('2025-01-15'),
      amount: 30000,
      status: 'paid',
    },
  })
  console.log('✅ Created invoice:', invoice2.invoiceNumber)

  // Create expenses
  await prisma.expense.createMany({
    data: [
      {
        organizationId: mainOrg.id,
        projectId: project1.id,
        userId: developer1.id,
        amount: 150,
        billable: true,
        status: 'approved',
        note: 'Design software subscription',
        approvedAt: new Date('2025-01-15'),
      },
      {
        organizationId: mainOrg.id,
        projectId: project1.id,
        userId: developer2.id,
        amount: 50,
        billable: false,
        status: 'submitted',
        note: 'Team lunch',
      },
      {
        organizationId: mainOrg.id,
        projectId: project2.id,
        userId: developer3.id,
        amount: 200,
        billable: true,
        status: 'approved',
        note: 'Cloud hosting fees',
        approvedAt: new Date('2025-01-20'),
      },
      {
        organizationId: mainOrg.id,
        projectId: project2.id,
        userId: manager.id,
        amount: 75,
        billable: false,
        status: 'draft',
        note: 'Office supplies',
      },
      {
        organizationId: mainOrg.id,
        projectId: project3.id,
        userId: developer2.id,
        amount: 500,
        billable: true,
        status: 'submitted',
        note: 'E-commerce platform license',
      },
    ],
  })
  console.log('✅ Created expenses')

  // Create audit events
  await prisma.event.createMany({
    data: [
      {
        organizationId: mainOrg.id,
        entityType: 'project',
        entityId: project1.id,
        eventType: 'project.created',
        payload: { name: project1.name },
      },
      {
        organizationId: mainOrg.id,
        entityType: 'project',
        entityId: project2.id,
        eventType: 'project.created',
        payload: { name: project2.name },
      },
      {
        organizationId: mainOrg.id,
        entityType: 'invoice',
        entityId: invoice1.id,
        eventType: 'invoice.created',
        payload: { invoiceNumber: invoice1.invoiceNumber, amount: invoice1.amount },
      },
      {
        organizationId: mainOrg.id,
        entityType: 'invoice',
        entityId: invoice2.id,
        eventType: 'invoice.paid',
        payload: { invoiceNumber: invoice2.invoiceNumber, amount: invoice2.amount },
      },
    ],
  })
  console.log('✅ Created audit events')

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: mainOrg.id,
        userId: manager.id,
        title: 'New expense submitted',
        message: 'Developer submitted an expense for approval',
        type: 'expense_submitted',
        isRead: false,
      },
      {
        organizationId: mainOrg.id,
        userId: developer1.id,
        title: 'Task assigned',
        message: 'You have been assigned to "Implement homepage"',
        type: 'task_assigned',
        isRead: true,
      },
      {
        organizationId: mainOrg.id,
        userId: qa.id,
        title: 'New task available',
        message: 'Integration testing task is ready',
        type: 'task_assigned',
        isRead: false,
      },
    ],
  })
  console.log('✅ Created notifications')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:      admin@demo.com / Admin@123456')
  console.log('   Manager 1:  manager@demo.com / Manager@123456')
  console.log('   Manager 2:  manager2@demo.com / Manager@123456')
  console.log('   Developer 1: dev1@demo.com / Developer@123')
  console.log('   Developer 2: dev2@demo.com / Developer@123')
  console.log('   Developer 3: dev3@demo.com / Developer@123')
  console.log('   Designer:   designer@demo.com / Designer@123')
  console.log('   QA:         qa@demo.com / Tester@123456')
  console.log('   Finance 1:  finance@demo.com / Finance@123')
  console.log('   Finance 2:  accountant@demo.com / Finance@123')
  console.log('   Inactive:   inactive@demo.com / Inactive@123')
  console.log('   Test Org:   testuser@demo.com / TestUser@123')
  console.log(`\n🏢 Main Organization ID: ${mainOrg.id}`)
  console.log(`🏢 Test Organization ID: ${testOrg.id}`)
  console.log(`\n📊 Created:`)
  console.log(`   - 2 Organizations`)
  console.log(`   - 12 Users (11 active, 1 inactive)`)
  console.log(`     * 1 Admin, 2 Managers, 5 Members, 2 Finance, 1 Test User, 1 Inactive`)
  console.log(`   - 4 Projects (1 completed, 2 in-progress, 1 planned)`)
  console.log(`   - 6 Tasks across different phases`)
  console.log(`   - 7 Timesheets with different statuses`)
  console.log(`   - 2 Sales Orders`)
  console.log(`   - 2 Customer Invoices`)
  console.log(`   - 5 Expenses`)
  console.log(`   - 4 Audit Events`)
  console.log(`   - 3 Notifications`)
  console.log(`   - 2 Pending Invitations`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
