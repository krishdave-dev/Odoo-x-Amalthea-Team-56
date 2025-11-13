import { PrismaClient, UserRole, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Helpers
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function pickMany<T>(arr: T[], n: number): T[] { return [...arr].sort(() => 0.5 - Math.random()).slice(0, Math.min(n, arr.length)) }
function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((a, b) => a + b.weight, 0)
  let r = Math.random() * total
  for (const it of items) { if ((r -= it.weight) <= 0) return it.value }
  return items[items.length - 1].value
}
function daysFromNow(delta: number) { const d = new Date(); d.setDate(d.getDate() + delta); return d }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

async function cleanDemoDataForOrg(orgId: number) {
  // Delete only DEMO-tagged projects and their related data
  const demoProjects = await prisma.project.findMany({
    where: { organizationId: orgId, name: { startsWith: '[DEMO]' } },
    select: { id: true },
  })
  if (demoProjects.length === 0) return
  const projectIds = demoProjects.map(p => p.id)

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

async function seedOrg(orgId: number) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org) return

  // Users by role
  const users = await prisma.user.findMany({ where: { organizationId: orgId, isActive: true } })
  const managers = users.filter(u => u.role === 'admin' || u.role === 'manager')
  const team = users // everyone can be assigned

  if (managers.length === 0 || team.length === 0) {
    console.log(`   ⚠️  Skipping ${org.name}: need at least 1 manager/admin and 1 active user`)
    return
  }

  console.log(`   🧹 Cleaning previous [DEMO] data for ${org.name}...`)
  await cleanDemoDataForOrg(orgId)

  console.log(`   📦 Seeding [DEMO] data for ${org.name}...`)

  // Project templates
  const projTemplates = [
    { name: '[DEMO] Website Revamp', code: 'DEMO-WEB', status: 'in_progress', progress: 60, budget: 80000 },
    { name: '[DEMO] Mobile SuperApp', code: 'DEMO-MOB', status: 'in_progress', progress: 35, budget: 150000 },
    { name: '[DEMO] E‑commerce V2', code: 'DEMO-ECOM', status: 'planned', progress: 10, budget: 220000 },
    { name: '[DEMO] Analytics Dash', code: 'DEMO-DASH', status: 'completed', progress: 100, budget: 50000 },
    { name: '[DEMO] CRM Integration', code: 'DEMO-CRM', status: 'in_progress', progress: 45, budget: 60000 },
    { name: '[DEMO] API Modernization', code: 'DEMO-API', status: 'in_progress', progress: 55, budget: 90000 },
    { name: '[DEMO] Data Lake POC', code: 'DEMO-DATA', status: 'planned', progress: 5, budget: 70000 },
    { name: '[DEMO] Marketing Site', code: 'DEMO-MKT', status: 'completed', progress: 100, budget: 30000 },
  ]

  const createdProjects: { id: number; name: string }[] = []

  for (let i = 0; i < projTemplates.length; i++) {
    const t = projTemplates[i]
    const pm = pick(managers)
    const start = daysFromNow(-randomInt(10, 120))
    const end = daysFromNow(randomInt(15, 180))

    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        projectManagerId: pm.id,
        name: t.name,
        code: `${t.code}-${String(i + 1).padStart(3, '0')}`,
        description: `${t.name} with modern UX, performance & security improvements`,
        startDate: start,
        endDate: t.status === 'completed' ? daysFromNow(-randomInt(1, 30)) : end,
        status: t.status,
        budget: t.budget,
        progressPct: t.progress,
      },
    })
    createdProjects.push(project)

    // Members 4–8
    const memberCount = randomInt(4, Math.min(8, team.length))
    const selected = pickMany(team, memberCount)
    const roles = ['Lead Dev', 'Backend Dev', 'Frontend Dev', 'Full Stack Dev', 'QA Engineer', 'DevOps', 'UI/UX', 'Product Manager']
    await prisma.projectMember.createMany({
      data: selected.map(m => ({ projectId: project.id, userId: m.id, roleInProject: pick(roles) })),
    })

    // Task Lists
    const listTitles = ['Planning & Design', 'Development', 'Testing & QA', 'Deployment', 'Maintenance']
    const lists = await Promise.all(listTitles.map((title, idx) => prisma.taskList.create({
      data: { projectId: project.id, title, ordinal: idx + 1 },
    })))

    // Tasks 20–40
    const taskTitles = [
      'Setup infra', 'Design DB schema', 'Wireframes', 'Auth system', 'User dashboard', 'API endpoints', 'Admin panel', 'Payments',
      'CI/CD pipeline', 'Unit tests', 'Integration tests', 'Security audit', 'Performance tuning', 'Docs', 'Refactor', 'Deploy staging',
      'UAT', 'Bugfix sprint', 'Go-live prep', 'Monitoring setup', 'Notifications', 'Search', 'Reports', 'Caching layer', 'DB tuning',
      'Export feature', 'File uploads', 'Email templates', 'i18n support', 'Feature flagging', 'Analytics events'
    ]

    const taskCount = randomInt(20, 40)
    for (let tIdx = 0; tIdx < taskCount; tIdx++) {
      const list = pick(lists)
      const assignee = pick(selected)
      const priority = randomInt(1, 4)
      const estimate = randomInt(4, 48)
      const status = weightedPick([
        { value: 'new', weight: project.status === 'completed' ? 0 : 20 },
        { value: 'in_progress', weight: project.status === 'completed' ? 0 : 45 },
        { value: 'in_review', weight: project.status === 'completed' ? 0 : 15 },
        { value: 'blocked', weight: project.status === 'completed' ? 0 : 5 },
        { value: 'completed', weight: project.status === 'completed' ? 100 : 15 },
      ])

      const hoursLogged = status === 'completed' ? estimate : Math.floor(estimate * Math.random())
      const due = daysFromNow(randomInt(-30, 60))

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          listId: list.id,
          title: pick(taskTitles),
          description: `Task for ${project.name}. Ensure quality and coordination across teams.`,
          assigneeId: assignee.id,
          priority,
          status,
          estimateHours: estimate,
          hoursLogged,
          dueDate: due,
        },
      })

      // Timesheets for logged hours
      if (hoursLogged > 0) {
        let remaining = hoursLogged
        while (remaining > 0) {
          const hours = Math.min(8, remaining)
          remaining -= hours
          const daysAgo = randomInt(1, 45)
          const startAt = daysFromNow(-daysAgo); startAt.setHours(9,0,0,0)
          const endAt = new Date(startAt); endAt.setHours(startAt.getHours() + hours)
          const tsStatus = pick(['draft', 'submitted', 'approved'])
          const rate = Number(assignee.hourlyRate)
          await prisma.timesheet.create({
            data: {
              projectId: project.id,
              taskId: task.id,
              userId: assignee.id,
              start: startAt,
              end: endAt,
              durationHours: hours,
              billable: Math.random() > 0.2,
              costAtTime: rate * hours,
              notes: `Worked on ${task.title}`,
              status: tsStatus,
            },
          })
        }
      }
    }

    // Sales Orders 1–3
    const soCount = randomInt(1, 3)
    const partnerNames = ['Acme Corporation', 'TechStart Inc', 'Global Solutions Ltd', 'Innovation Partners', 'Digital Ventures']
  const salesOrders: Array<{ id: number; totalAmount: Prisma.Decimal; orderDate: Date; status: string }> = []
    for (let s = 0; s < soCount; s++) {
      const so = await prisma.salesOrder.create({
        data: {
          organizationId: orgId,
          projectId: project.id,
          soNumber: `DEMO-SO-${orgId}-${String(project.id)}-${String(s + 1).padStart(2,'0')}`,
          partnerName: pick(partnerNames),
          orderDate: daysFromNow(-randomInt(5, 60)),
          totalAmount: Math.floor(Number(project.budget) * (0.3 + Math.random() * 0.7)),
          status: pick(['draft', 'confirmed', 'invoiced']),
        },
      })
      salesOrders.push(so)
    }

    // Customer Invoices for confirmed/invoiced SOs
    for (const so of salesOrders) {
      if (so.status !== 'draft' && Math.random() > 0.2) {
        await prisma.customerInvoice.create({
          data: {
            organizationId: orgId,
            projectId: project.id,
            soId: so.id,
            invoiceNumber: `DEMO-INV-${orgId}-${String(project.id)}-${String(Math.floor(Math.random()*900)+100)}`,
            invoiceDate: daysFromNow(-randomInt(1, 30)),
            amount: Math.floor(Number(so.totalAmount) * (0.4 + Math.random() * 0.6)),
            status: pick(['draft', 'sent', 'paid']),
          },
        })
      }
    }

    // Purchase Orders 1–3 and Vendor Bills
    const vendorNames = ['CloudHost Pro', 'DevTools Inc', 'Software Licenses Ltd', 'Tech Equipment Co', 'API Services Provider']
    const poCount = randomInt(1, 3)
  const pos: Array<{ id: number; totalAmount: Prisma.Decimal; orderDate: Date; vendorName: string | null; status: string }> = []
    for (let pIdx = 0; pIdx < poCount; pIdx++) {
      const po = await prisma.purchaseOrder.create({
        data: {
          organizationId: orgId,
          projectId: project.id,
          poNumber: `DEMO-PO-${orgId}-${String(project.id)}-${String(pIdx + 1).padStart(2,'0')}`,
          vendorName: pick(vendorNames),
          orderDate: daysFromNow(-randomInt(5, 60)),
          totalAmount: Math.floor(1000 + Math.random() * 9000),
          status: pick(['draft', 'confirmed', 'billed']),
        },
      })
      pos.push(po)
    }

    for (const po of pos) {
      if (po.status !== 'draft' && Math.random() > 0.3) {
        await prisma.vendorBill.create({
          data: {
            organizationId: orgId,
            projectId: project.id,
            poId: po.id,
            vendorName: po.vendorName,
            billDate: daysFromNow(-randomInt(1, 30)),
            amount: Math.floor(Number(po.totalAmount) * (0.8 + Math.random() * 0.2)),
            status: pick(['draft', 'received', 'paid']),
          },
        })
      }
    }

    // Expenses 10–25
    const expenseNotes = [
      'Software license renewal','Cloud hosting fees','Dev tools subscription','Team lunch','Client presentation','Office supplies','Conference tickets','Training','Domain renewal','SSL certificate','API usage','Stock assets','Testing devices','Professional services','Consulting fees'
    ]
    const expCount = randomInt(10, 25)
    for (let eIdx = 0; eIdx < expCount; eIdx++) {
      const by = pick(selected)
      type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
      const status = weightedPick([
        { value: 'draft', weight: 15 },
        { value: 'submitted', weight: 25 },
        { value: 'approved', weight: 35 },
        { value: 'rejected', weight: 10 },
        { value: 'paid', weight: 15 },
      ]) as ExpenseStatus
      await prisma.expense.create({
        data: {
          organizationId: orgId,
          projectId: project.id,
          userId: by.id,
          amount: randomInt(50, 1000),
          billable: Math.random() > 0.4,
          status,
          note: pick(expenseNotes),
          approvedAt: status === 'approved' || status === 'paid' ? new Date() : null,
          paidAt: status === 'paid' ? new Date() : null,
          submittedAt: status !== 'draft' ? new Date() : null,
        },
      })
    }

    // Notifications (3)
    for (const u of pickMany(selected, Math.min(3, selected.length))) {
      await prisma.notification.create({
        data: {
          organizationId: orgId,
          userId: u.id,
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `You have been assigned a task in ${project.name}`,
          isRead: Math.random() > 0.5,
        },
      })
    }

    // Events
    await prisma.event.createMany({
      data: [
        { organizationId: orgId, entityType: 'Project', entityId: project.id, eventType: 'PROJECT_CREATED', payload: { name: project.name, code: project.code } },
        { organizationId: orgId, entityType: 'Project', entityId: project.id, eventType: 'PROJECT_UPDATED', payload: { status: project.status, progress: t.progress } },
      ],
    })
  }

  // Create a couple of invitations if managers exist
  if (managers.length > 0) {
    const inviter = pick(managers)
    const expires = daysFromNow(7)
    await prisma.organizationInvitation.createMany({
      data: [
        { organizationId: orgId, email: `demo.member+${orgId}@example.com`, role: 'member' as UserRole, invitedById: inviter.id, expiresAt: expires, status: 'pending' },
        { organizationId: orgId, email: `demo.finance+${orgId}@example.com`, role: 'finance' as UserRole, invitedById: inviter.id, expiresAt: expires, status: 'pending' },
      ],
      skipDuplicates: true,
    })
  }

  console.log(`   ✅ Seeded ${createdProjects.length} [DEMO] projects for ${org.name}`)
}

async function main() {
  console.log('🌱 Starting DEMO data seed (preserves users and orgs)...')
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } })
  if (orgs.length === 0) {
    console.log('❌ No organizations found. Create organizations/users first (or run the full seed).')
    return
  }

  for (const org of orgs) {
    await seedOrg(org.id)
  }

  console.log('\n🎉 DEMO seed completed successfully!')
}

main().catch((e) => {
  console.error('❌ Error in DEMO seed:', e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
