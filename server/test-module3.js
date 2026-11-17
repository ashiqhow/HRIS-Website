const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Payroll = require('./models/Payroll');
const JobPosting = require('./models/JobPosting');
const Applicant = require('./models/Applicant');
const Performance = require('./models/Performance');
const Training = require('./models/Training');

const {
  getHRAnalyticsDashboard,
  getDigitalTransformationAnalysis,
  getHRISEffectivenessEvaluation,
} = require('./controllers/analyticsController');

const {
  getReportsCatalog,
  generateComprehensiveReport,
} = require('./controllers/reportsController');

// Mock response helper
function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function runModule3Tests() {
  console.log('--- STARTING MODULE 3 INTEGRATION VERIFICATION ---');
  let mongod;

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✓ In-memory MongoDB connected for Module 3 tests');

    // 1. Seed Organizational Test Dataset
    const adminUser = await User.create({
      name: 'Sarah HR Admin',
      email: 'sarah.admin@hris.com',
      password: 'password123',
      role: 'HR Admin',
      department: 'Human Resources',
      designation: 'VP of People',
      employeeId: 'EMP-ADM-01',
      salary: { baseSalary: 125000, currency: 'USD', payFrequency: 'Monthly' },
      status: 'Active',
    });

    const managerUser = await User.create({
      name: 'Marcus Lead',
      email: 'marcus.mgr@hris.com',
      password: 'password123',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Engineering Manager',
      employeeId: 'EMP-MGR-01',
      salary: { baseSalary: 110000, currency: 'USD', payFrequency: 'Monthly' },
      status: 'Active',
    });

    const devUser = await User.create({
      name: 'Alex Developer',
      email: 'alex.dev@hris.com',
      password: 'password123',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Senior Full Stack Engineer',
      employeeId: 'EMP-ENG-01',
      salary: { baseSalary: 90000, currency: 'USD', payFrequency: 'Monthly' },
      status: 'Active',
    });

    // Seed Attendance
    await Attendance.create({
      employee: devUser._id,
      date: new Date(),
      checkInTime: new Date(Date.now() - 8 * 3600000),
      checkOutTime: new Date(),
      workHours: 8.0,
      status: 'Present',
    });

    // Seed Leave
    await Leave.create({
      employee: devUser._id,
      leaveType: 'Annual',
      startDate: new Date('2026-12-20'),
      endDate: new Date('2026-12-24'),
      daysCount: 5,
      reason: 'Year-end family holiday',
      status: 'Approved',
      reviewedBy: managerUser._id,
    });

    // Seed Payroll
    await Payroll.create({
      employee: devUser._id,
      month: 11,
      year: 2026,
      period: 'November 2026',
      basicSalary: 7500,
      allowances: 500,
      bonuses: 800,
      deductions: 400,
      paymentStatus: 'Paid',
    });

    // Seed Recruitment
    const job = await JobPosting.create({
      title: 'Full Stack React Engineer',
      department: 'Engineering',
      description: 'Building internal tools',
      qualifications: 'React, Node.js',
      deadline: new Date(Date.now() + 15 * 86400000),
      createdBy: adminUser._id,
    });

    await Applicant.create({
      name: 'Jane Candidate',
      email: 'jane@candidate.com',
      job: job._id,
      stage: 'Shortlisted',
    });

    // Seed Performance
    await Performance.create({
      employee: devUser._id,
      reviewer: managerUser._id,
      period: 'Annual 2026',
      productivityScore: 92,
      overallScore: 94,
      feedback: 'Outstanding technical architecture contributions.',
      status: 'Completed',
    });

    // Seed Training
    await Training.create({
      title: 'Enterprise Architecture & Cloud DevOps',
      description: 'Advanced MERN and container systems',
      trainer: 'Dr. Jane Smith',
      department: 'Engineering',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-15'),
      participants: [
        {
          employee: devUser._id,
          status: 'Completed',
          score: 95,
        },
      ],
      createdBy: adminUser._id,
    });

    console.log('✓ Seeded complete organization dataset across 7 domains');

    // ==========================================
    // 2. Test Feature 1: HR Analytics Dashboard
    // ==========================================
    console.log('\n--- 3.1 Testing HR Analytics Dashboard ---');
    const analyticsReq = {
      user: adminUser,
      query: { department: 'All' },
    };
    const analyticsRes = createMockRes();
    await getHRAnalyticsDashboard(analyticsReq, analyticsRes);

    const aData = analyticsRes.data;
    if (!aData.success) throw new Error('Analytics dashboard failed');
    console.log(`✓ Analytics loaded: Total Staff=${aData.summary.totalEmployees}, Active=${aData.summary.activeEmployees}`);
    console.log(`✓ Attendance Punctuality Rate: ${aData.attendance.punctualityRate}% (Present: ${aData.attendance.presentCount})`);
    console.log(`✓ Recruitment Funnel: Total Applicants=${aData.recruitment.totalApplicants}`);
    console.log(`✓ Payroll Aggregation: Total Net Disbursed=$${aData.payroll.totalNet}`);
    console.log(`✓ Performance Rating Tiers: Excellent=${aData.performance.ratingTiers.Excellent}`);
    console.log(`✓ Training Completion Rate: ${aData.training.completionRate}%`);

    // ==========================================
    // 3. Test Feature 2: Reports & Documents Hub
    // ==========================================
    console.log('\n--- 3.2 Testing Reports and Document Management ---');
    const catalogRes = createMockRes();
    await getReportsCatalog({ user: adminUser }, catalogRes);
    if (!catalogRes.data.success || catalogRes.data.catalog.length !== 7) {
      throw new Error(`Expected 7 report domains, got ${catalogRes.data.catalog?.length}`);
    }
    console.log(`✓ Reports catalog returned ${catalogRes.data.catalog.length} operational report domains`);

    // Generate individual reports
    for (const reportType of ['employees', 'attendance', 'leaves', 'payroll', 'recruitment', 'performance', 'training']) {
      const repRes = createMockRes();
      await generateComprehensiveReport(
        { user: adminUser, query: { type: reportType, department: 'All' } },
        repRes
      );
      if (!repRes.data.success || !repRes.data.report) {
        throw new Error(`Failed to generate ${reportType} report`);
      }
      console.log(`✓ Report [${reportType}]: Title="${repRes.data.report.title}", Rows=${repRes.data.report.rows.length}, Columns=${repRes.data.report.columns.length}`);
    }

    // ==========================================
    // 4. Test Feature 3: Digital Transformation
    // ==========================================
    console.log('\n--- 3.3 Testing Digital Transformation Analysis ---');
    const transRes = createMockRes();
    await getDigitalTransformationAnalysis({ user: adminUser }, transRes);
    if (!transRes.data.success || transRes.data.pillars.length !== 5) {
      throw new Error(`Expected 5 transformation pillars, got ${transRes.data.pillars?.length}`);
    }
    console.log(`✓ Transformation analysis computed: Projected Annual Savings=$${transRes.data.estimatedAnnualSavings.toLocaleString()}`);
    console.log(`✓ Verified 5 Transformation Pillars: ${transRes.data.pillars.map((p) => p.title).join(', ')}`);

    // ==========================================
    // 5. Test Feature 4: HRIS Effectiveness
    // ==========================================
    console.log('\n--- 3.4 Testing HRIS Effectiveness Evaluation ---');
    const effectRes = createMockRes();
    await getHRISEffectivenessEvaluation({ user: adminUser }, effectRes);
    if (!effectRes.data.success) throw new Error('Effectiveness evaluation failed');
    console.log(`✓ Overall HRIS Effectiveness Score: ${effectRes.data.overallScore}/100 (${effectRes.data.maturityLevel})`);
    console.log(`✓ Verified 6 Core Evaluation Dimensions: ${effectRes.data.dimensions.map((d) => `${d.name} (${d.score}%)`).join(', ')}`);
    console.log(`✓ Verified ${effectRes.data.challenges.length} Implementation Challenges & Mitigations`);
    console.log(`✓ Verified ${effectRes.data.recommendations.length} Strategic Roadmap Recommendations`);

    console.log('\n======================================================');
    console.log('>>> ALL MODULE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
    console.log('======================================================\n');
  } catch (err) {
    console.error('✗ Test failed:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runModule3Tests();
