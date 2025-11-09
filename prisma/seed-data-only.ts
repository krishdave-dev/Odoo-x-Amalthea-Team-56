import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting data-only seed (preserving existing users)...')

  // Get specific users by ID
  const specificUserIds = [13, 14, 15, 16]
  const users = await prisma.user.findMany({
    where: { 
      id: { in: specificUserIds },
      isActive: true 
    },
    include: { organization: true },
  })

  if (users.length === 0) {
    console.log('❌ No users found with IDs: ' + specificUserIds.join(', '))
    console.log('💡 Please check if these user IDs exist in your database.')
    return
  }

  console.log(`✅ Found ${users.length} users:`)
  users.forEach((user: any) => {
    console.log(`   - ID ${user.id}: ${user.name || user.email} (${user.role})`)
  })

  // Group users by organization
  const orgMap = new Map<number, typeof users>()
  users.forEach((user: any) => {
    if (!orgMap.has(user.organizationId)) {
      orgMap.set(user.organizationId, [])
    }
    orgMap.get(user.organizationId)!.push(user)
  })

  console.log(`✅ Found ${orgMap.size} organization(s)`)

  // Get organization IDs for these users
  const orgIds = Array.from(orgMap.keys())
  console.log(`📍 Organization IDs: ${orgIds.join(', ')}`)

  // Clean existing data for these organizations only
  console.log('🗑️  Cleaning existing project/finance data for these organizations...')
  
  // Get all projects for these organizations
  const projectsToDelete = await prisma.project.findMany({
    where: { organizationId: { in: orgIds } },
    select: { id: true },
  })
  const projectIds = projectsToDelete.map((p: any) => p.id)
  
  if (projectIds.length > 0) {
    // Delete in correct order to respect foreign key constraints
    await prisma.taskComment.deleteMany({ where: { task: { projectId: { in: projectIds } } } })
    await prisma.timesheet.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.taskList.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.expense.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.vendorBill.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.customerInvoice.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.salesOrder.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.purchaseOrder.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.projectMember.deleteMany({ where: { projectId: { in: projectIds } } })
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } })
  }
  
  // Clean organization-level data
  await prisma.notification.deleteMany({ where: { organizationId: { in: orgIds } } })
  await prisma.analyticsCache.deleteMany({ where: { organizationId: { in: orgIds } } })
  await prisma.event.deleteMany({ where: { organizationId: { in: orgIds } } })
  await prisma.outboxEvent.deleteMany()
  await prisma.attachment.deleteMany({ where: { organizationId: { in: orgIds } } })
  
  console.log('✅ Cleaned existing data for specified organizations')

  // Process each organization
  for (const [orgId, orgUsers] of orgMap.entries()) {
    const org = orgUsers[0].organization
    console.log(`\n📦 Seeding data for: ${org.name}`)

    // Find managers and members
    const managers = orgUsers.filter((u) => u.role === 'admin' || u.role === 'manager')
    const members = orgUsers.filter((u) => u.role === 'member')
    const financeUsers = orgUsers.filter((u) => u.role === 'finance')
    const allTeamMembers = [...managers, ...members]

    console.log(`   - ${managers.length} manager(s)`)
    console.log(`   - ${members.length} member(s)`)
    console.log(`   - ${financeUsers.length} finance user(s)`)

    if (managers.length === 0) {
      console.log('   ⚠️  No managers found, skipping this organization')
      continue
    }

    // Create multiple projects
    const projectsData = [
      {
        name: 'Website Redesign Project',
        code: 'WEB-001',
        description: 'Complete redesign of company website with modern UI/UX and responsive design',
        status: 'in_progress',
        budget: 75000,
        progressPct: 65,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2025-03-31'),
      },
      {
        name: 'Mobile App Development',
        code: 'MOB-001',
        description: 'Native mobile applications for iOS and Android platforms',
        status: 'in_progress',
        budget: 120000,
        progressPct: 40,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-06-30'),
      },
      {
        name: 'E-commerce Platform',
        code: 'ECOM-001',
        description: 'Full-stack e-commerce solution with payment gateway integration',
        status: 'in_progress',
        budget: 200000,
        progressPct: 25,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-09-30'),
      },
      {
        name: 'CRM System Integration',
        code: 'CRM-001',
        description: 'Integrate third-party CRM with existing systems',
        status: 'planned',
        budget: 50000,
        progressPct: 10,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-31'),
      },
      {
        name: 'Data Analytics Dashboard',
        code: 'DASH-001',
        description: 'Real-time analytics dashboard for business insights',
        status: 'completed',
        budget: 45000,
        progressPct: 100,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-31'),
      },
      {
        name: 'API Modernization',
        code: 'API-001',
        description: 'Migrate legacy APIs to modern REST/GraphQL architecture',
        status: 'in_progress',
        budget: 80000,
        progressPct: 55,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-04-30'),
      },
    ]

    const createdProjects = []
    for (const projectData of projectsData) {
      const manager = managers[Math.floor(Math.random() * managers.length)]
      const project = await prisma.project.create({
        data: {
          organizationId: orgId,
          projectManagerId: manager.id,
          ...projectData,
        },
      })
      createdProjects.push(project)
      console.log(`   ✅ Created project: ${project.name}`)

      // Add project members (3-6 members per project)
      const memberCount = Math.min(3 + Math.floor(Math.random() * 4), allTeamMembers.length)
      const shuffled = [...allTeamMembers].sort(() => 0.5 - Math.random())
      const selectedMembers = shuffled.slice(0, memberCount)

      const roles = ['Lead Developer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'QA Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Product Manager']

      for (const member of selectedMembers) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: member.id,
            roleInProject: roles[Math.floor(Math.random() * roles.length)],
          },
        })
      }

      // Create task lists for each project
      const taskLists = []
      const taskListNames = ['Planning & Design', 'Development', 'Testing & QA', 'Deployment', 'Maintenance']
      for (let i = 0; i < taskListNames.length; i++) {
        const taskList = await prisma.taskList.create({
          data: {
            projectId: project.id,
            title: taskListNames[i],
            ordinal: i + 1,
          },
        })
        taskLists.push(taskList)
      }

      // Create multiple tasks per project (15-30 tasks)
      const taskCount = 15 + Math.floor(Math.random() * 16)
      const taskTitles = [
        'Set up project infrastructure',
        'Design database schema',
        'Create wireframes and mockups',
        'Implement authentication system',
        'Build user dashboard',
        'Develop API endpoints',
        'Create admin panel',
        'Implement payment integration',
        'Set up CI/CD pipeline',
        'Write unit tests',
        'Perform integration testing',
        'Security audit and fixes',
        'Performance optimization',
        'Documentation writing',
        'Code review and refactoring',
        'Deploy to staging environment',
        'User acceptance testing',
        'Bug fixes and polish',
        'Deploy to production',
        'Monitoring and analytics setup',
        'Create user guides',
        'Implement notification system',
        'Add search functionality',
        'Build reporting module',
        'Implement caching layer',
        'Database optimization',
        'Add export features',
        'Implement file uploads',
        'Create email templates',
        'Add multi-language support',
      ]

      const statuses = ['new', 'in_progress', 'in_review', 'blocked', 'completed']
      const statusWeights = project.status === 'completed' ? [0, 0, 0, 0, 1] : [0.2, 0.4, 0.2, 0.1, 0.1]

      for (let i = 0; i < taskCount; i++) {
        const taskList = taskLists[Math.floor(Math.random() * taskLists.length)]
        const assignee = selectedMembers[Math.floor(Math.random() * selectedMembers.length)]
        const priority = Math.floor(Math.random() * 4) + 1
        const estimateHours = (Math.floor(Math.random() * 20) + 4) * 2 // 4-48 hours
        
        // Weight status selection
        const rand = Math.random()
        let cumulativeWeight = 0
        let status = 'new'
        for (let j = 0; j < statuses.length; j++) {
          cumulativeWeight += statusWeights[j]
          if (rand <= cumulativeWeight) {
            status = statuses[j]
            break
          }
        }

        const hoursLogged = status === 'completed' ? estimateHours : Math.floor(estimateHours * Math.random())
        
        const daysOffset = Math.floor(Math.random() * 90) - 30 // -30 to +60 days
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + daysOffset)

        const task = await prisma.task.create({
          data: {
            projectId: project.id,
            listId: taskList.id,
            title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
            description: `Detailed description for task in ${project.name}. This task requires careful attention and collaboration.`,
            assigneeId: assignee.id,
            priority,
            status,
            estimateHours,
            hoursLogged,
            dueDate,
          },
        })

        // Create timesheets for tasks with logged hours
        if (hoursLogged > 0) {
          const timesheetCount = Math.ceil(hoursLogged / 8) // One timesheet per 8 hours
          let remainingHours = hoursLogged

          for (let t = 0; t < timesheetCount; t++) {
            const hours = Math.min(remainingHours, 8)
            remainingHours -= hours

            const daysAgo = Math.floor(Math.random() * 30) + 1
            const start = new Date()
            start.setDate(start.getDate() - daysAgo)
            start.setHours(9, 0, 0, 0)

            const end = new Date(start)
            end.setHours(start.getHours() + hours)

            const timesheetStatuses = ['draft', 'submitted', 'approved']
            const timesheetStatus = timesheetStatuses[Math.floor(Math.random() * timesheetStatuses.length)]

            await prisma.timesheet.create({
              data: {
                projectId: project.id,
                taskId: task.id,
                userId: assignee.id,
                start,
                end,
                durationHours: hours,
                billable: Math.random() > 0.2, // 80% billable
                costAtTime: hours * Number(assignee.hourlyRate),
                notes: `Work on ${task.title}`,
                status: timesheetStatus,
              },
            })
          }
        }
      }
      console.log(`   ✅ Created ${taskCount} tasks with timesheets for ${project.name}`)

      // Create Sales Orders
      const salesOrders = []
      const soCount = Math.floor(Math.random() * 3) + 1 // 1-3 sales orders per project
      for (let i = 0; i < soCount; i++) {
        const customerNames = ['Acme Corporation', 'TechStart Inc', 'Global Solutions Ltd', 'Innovation Partners', 'Digital Ventures']
        const salesOrder = await prisma.salesOrder.create({
          data: {
            organizationId: orgId,
            projectId: project.id,
            soNumber: `SO-${new Date().getFullYear()}-${String(createdProjects.length * 10 + i + 1).padStart(3, '0')}`,
            partnerName: customerNames[Math.floor(Math.random() * customerNames.length)],
            orderDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000), // Random date within last 60 days
            totalAmount: Math.floor(Number(project.budget) * (0.3 + Math.random() * 0.7)),
            status: ['draft', 'confirmed', 'invoiced'][Math.floor(Math.random() * 3)],
          },
        })
        salesOrders.push(salesOrder)
      }
      console.log(`   ✅ Created ${soCount} sales orders`)

      // Create Customer Invoices
      for (const so of salesOrders) {
        if (so.status !== 'draft' && Math.random() > 0.3) {
          const invoiceAmount = Math.floor(Number(so.totalAmount) * (0.4 + Math.random() * 0.6))
          await prisma.customerInvoice.create({
            data: {
              organizationId: orgId,
              projectId: project.id,
              soId: so.id,
              invoiceNumber: `INV-${new Date().getFullYear()}-${String(createdProjects.length * 10 + salesOrders.indexOf(so) + 1).padStart(3, '0')}`,
              invoiceDate: new Date(so.orderDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
              amount: invoiceAmount,
              status: ['draft', 'sent', 'paid'][Math.floor(Math.random() * 3)],
            },
          })
        }
      }

      // Create Purchase Orders
      const poCount = Math.floor(Math.random() * 3) + 1
      const purchaseOrders = []
      for (let i = 0; i < poCount; i++) {
        const vendorNames = ['CloudHost Pro', 'DevTools Inc', 'Software Licenses Ltd', 'Tech Equipment Co', 'API Services Provider']
        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            organizationId: orgId,
            projectId: project.id,
            poNumber: `PO-${new Date().getFullYear()}-${String(createdProjects.length * 10 + i + 1).padStart(3, '0')}`,
            vendorName: vendorNames[Math.floor(Math.random() * vendorNames.length)],
            orderDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
            totalAmount: Math.floor(1000 + Math.random() * 9000),
            status: ['draft', 'confirmed', 'billed'][Math.floor(Math.random() * 3)],
          },
        })
        purchaseOrders.push(purchaseOrder)
      }
      console.log(`   ✅ Created ${poCount} purchase orders`)

      // Create Vendor Bills
      for (const po of purchaseOrders) {
        if (po.status !== 'draft' && Math.random() > 0.3) {
          const billAmount = Math.floor(Number(po.totalAmount) * (0.8 + Math.random() * 0.2))
          await prisma.vendorBill.create({
            data: {
              organizationId: orgId,
              projectId: project.id,
              poId: po.id,
              vendorName: po.vendorName,
              billDate: new Date(po.orderDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
              amount: billAmount,
              status: ['draft', 'received', 'paid'][Math.floor(Math.random() * 3)],
            },
          })
        }
      }

      // Create Expenses
      const expenseCount = 5 + Math.floor(Math.random() * 15) // 5-20 expenses per project
      const expenseNotes = [
        'Software license renewal',
        'Cloud hosting fees',
        'Development tools subscription',
        'Team lunch meeting',
        'Client presentation materials',
        'Office supplies',
        'Conference tickets',
        'Training course',
        'Domain registration',
        'SSL certificate',
        'API usage fees',
        'Stock photos and assets',
        'Testing devices',
        'Professional services',
        'Consulting fees',
      ]

      for (let i = 0; i < expenseCount; i++) {
        const expenseUser = selectedMembers[Math.floor(Math.random() * selectedMembers.length)]
        const billable = Math.random() > 0.4 // 60% billable
        const amount = Math.floor(50 + Math.random() * 950) // $50-$1000
        const statuses = ['draft', 'submitted', 'approved', 'rejected', 'paid']
        const statusWeights = [0.15, 0.25, 0.35, 0.1, 0.15]
        
        const rand = Math.random()
        let cumulativeWeight = 0
        let expenseStatus = 'draft'
        for (let j = 0; j < statuses.length; j++) {
          cumulativeWeight += statusWeights[j]
          if (rand <= cumulativeWeight) {
            expenseStatus = statuses[j]
            break
          }
        }

        await prisma.expense.create({
          data: {
            organizationId: orgId,
            projectId: project.id,
            userId: expenseUser.id,
            amount,
            billable,
            status: expenseStatus,
            note: expenseNotes[Math.floor(Math.random() * expenseNotes.length)],
            approvedAt: expenseStatus === 'approved' || expenseStatus === 'paid' ? new Date() : null,
            paidAt: expenseStatus === 'paid' ? new Date() : null,
            submittedAt: expenseStatus !== 'draft' ? new Date() : null,
          },
        })
      }
      console.log(`   ✅ Created ${expenseCount} expenses`)

      // Create some notifications
      for (const member of selectedMembers.slice(0, 3)) {
        await prisma.notification.create({
          data: {
            organizationId: orgId,
            userId: member.id,
            type: 'TASK_ASSIGNED',
            title: 'New task assigned',
            message: `You have been assigned to a task in ${project.name}`,
            isRead: Math.random() > 0.5,
          },
        })
      }

      // Create audit events
      await prisma.event.createMany({
        data: [
          {
            organizationId: orgId,
            entityType: 'Project',
            entityId: project.id,
            eventType: 'PROJECT_CREATED',
            payload: { name: project.name, code: project.code },
          },
          {
            organizationId: orgId,
            entityType: 'Project',
            entityId: project.id,
            eventType: 'PROJECT_UPDATED',
            payload: { name: project.name, status: project.status },
          },
        ],
      })
    }

    console.log(`\n✅ Completed seeding for ${org.name}`)
    console.log(`   📊 Summary:`)
    console.log(`   - ${createdProjects.length} projects`)
    console.log(`   - ~${createdProjects.length * 20} tasks`)
    console.log(`   - ~${createdProjects.length * 40} timesheets`)
    console.log(`   - ~${createdProjects.length * 2} sales orders & invoices`)
    console.log(`   - ~${createdProjects.length * 2} purchase orders & bills`)
    console.log(`   - ~${createdProjects.length * 10} expenses`)
  }

  console.log('\n🎉 Data-only seed completed successfully!')
  console.log('\n💡 Tip: Your existing users have been preserved with new project data.')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
