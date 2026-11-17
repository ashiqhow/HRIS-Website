const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const JobPosting = require('./models/JobPosting');
const Applicant = require('./models/Applicant');
const Payroll = require('./models/Payroll');
const Performance = require('./models/Performance');
const Training = require('./models/Training');
const Notification = require('./models/Notification');

async function runModule2Tests() {
  console.log('--- STARTING MODULE 2 INTEGRATION VERIFICATION ---');
  let mongod;

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✓ In-memory MongoDB connected for Module 2 tests');

    // 1. Setup Test Users
    const hrAdmin = await User.create({
      name: 'Sarah HR Admin',
      email: 'admin@hris.com',
      password: 'password123',
      role: 'HR Admin',
      department: 'Human Resources',
      designation: 'VP of People',
      employeeId: 'EMP-ADM-01',
      salary: {
        baseSalary: 120000,
        currency: 'USD',
        payFrequency: 'Monthly',
      },
      status: 'Active',
    });

    const manager = await User.create({
      name: 'Marcus Manager',
      email: 'manager@hris.com',
      password: 'password123',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Engineering Lead',
      employeeId: 'EMP-MGR-01',
      salary: {
        baseSalary: 95000,
        currency: 'USD',
        payFrequency: 'Monthly',
      },
      status: 'Active',
    });

    const devUser = await User.create({
      name: 'Alex Developer',
      email: 'alex@hris.com',
      password: 'password123',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Senior Full Stack Engineer',
      employeeId: 'EMP-DEV-01',
      salary: {
        baseSalary: 80000,
        currency: 'USD',
        payFrequency: 'Monthly',
      },
      status: 'Active',
    });

    console.log('✓ Seeded HR Admin, Manager, and Employee users with salary records');

    // ==========================================
    // 2. Recruitment Management System Tests
    // ==========================================
    console.log('\n--- 2.1 Testing Recruitment Management System ---');
    const job = await JobPosting.create({
      title: 'Senior React & Node Engineer',
      department: 'Engineering',
      description: 'Looking for an experienced MERN engineer to build scalable internal tools.',
      qualifications: '5+ years Node.js, React, MongoDB experience',
      employmentType: 'Full-time',
      location: 'San Francisco, CA (Hybrid)',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: hrAdmin._id,
    });
    console.log(`✓ Job vacancy created: "${job.title}" (${job.department})`);

    const applicant = await Applicant.create({
      job: job._id,
      name: 'David Candidate',
      email: 'david@applicant.com',
      phone: '+1 555-0199',
      stage: 'Applied',
      notes: 'Strong portfolio with prior HRIS implementations.',
    });
    console.log(`✓ Candidate application received: ${applicant.name} (Stage: ${applicant.stage})`);

    // Advance candidate stage
    applicant.stage = 'Interview Scheduled';
    applicant.reviews.push({
      reviewer: manager._id,
      rating: 5,
      feedback: 'Excellent problem solving and React architecture depth.',
      reviewDate: new Date(),
    });
    await applicant.save();
    console.log(`✓ Candidate stage updated to "${applicant.stage}" with Manager review (Rating: 5/5)`);

    // ==========================================
    // 3. Payroll Management System Tests
    // ==========================================
    console.log('\n--- 2.2 Testing Payroll Management System ---');
    const monthlyBasic = devUser.salary.baseSalary / 12; // 80000 / 12 = 6666.666...
    const allowances = 500;
    const bonuses = 1000;
    const deductions = 350;

    const payrollRecord = new Payroll({
      employee: devUser._id,
      month: 11,
      year: 2026,
      period: 'November 2026',
      basicSalary: monthlyBasic,
      allowances,
      bonuses,
      deductions,
      paymentStatus: 'Processed',
    });
    await payrollRecord.save();

    const expectedNet = Number((monthlyBasic + allowances + bonuses - deductions).toFixed(2));
    if (payrollRecord.netSalary !== expectedNet) {
      throw new Error(
        `Payroll calculation mismatch: got ${payrollRecord.netSalary}, expected ${expectedNet}`
      );
    }
    console.log(
      `✓ Payroll generated for ${devUser.name}: Basic=$${monthlyBasic.toFixed(
        2
      )} + Allow=$${allowances} + Bonus=$${bonuses} - Ded=$${deductions} => Net Salary=$${payrollRecord.netSalary}`
    );

    // ==========================================
    // 4. Performance Management System Tests
    // ==========================================
    console.log('\n--- 2.3 Testing Performance Management System ---');
    const evaluation = new Performance({
      employee: devUser._id,
      reviewer: manager._id,
      period: 'Annual 2026',
      goals: [
        {
          goalTitle: 'Core Web Platform Delivery',
          target: 'Deliver HRIS modules on schedule with 100% test coverage',
          achievementScore: 92,
          comments: 'Delivered ahead of schedule.',
        },
        {
          goalTitle: 'System Performance & Architecture',
          target: 'Sub-200ms API response latency',
          achievementScore: 90,
          comments: 'Optimized MongoDB indexes and queries.',
        },
      ],
      productivityScore: 94,
      overallScore: 92,
      feedback: 'Alex has been an extraordinary technical contributor this year.',
      strengths: 'Full-stack mastery, fast turnaround, clean code quality.',
      areasForImprovement: 'Take on more cross-team architecture mentorship.',
      status: 'Completed',
    });
    await evaluation.save();

    if (evaluation.rating !== 'Excellent') {
      throw new Error(`Rating tier error: got ${evaluation.rating}, expected Excellent for score 92`);
    }
    console.log(
      `✓ Performance evaluation recorded for ${devUser.name}: Score=${evaluation.overallScore}/100 => Rating="${evaluation.rating}"`
    );

    // Test Good / Needs Improvement calculation
    const eval2 = new Performance({
      employee: devUser._id,
      reviewer: manager._id,
      period: 'Q1 2026',
      productivityScore: 55,
      overallScore: 58,
      feedback: 'Needs to improve attendance punctuality and task completion.',
      status: 'Completed',
    });
    await eval2.save();
    if (eval2.rating !== 'Needs Improvement') {
      throw new Error(`Expected 'Needs Improvement' for score 58, got ${eval2.rating}`);
    }
    console.log(
      `✓ Rating tier threshold verified: Score=${eval2.overallScore} => Rating="${eval2.rating}"`
    );

    // ==========================================
    // 5. Training Management System Tests
    // ==========================================
    console.log('\n--- 2.4 Testing Training Management System ---');
    const training = await Training.create({
      title: 'Secure Cloud DevOps & Infrastructure',
      description: 'Comprehensive 4-week program covering containerization, CI/CD, and security best practices.',
      trainer: 'Dr. Jane Smith (Cloud Specialist)',
      department: 'Engineering',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-28'),
      location: 'Virtual Technical Lab (Online)',
      status: 'Upcoming',
      createdBy: hrAdmin._id,
      participants: [
        {
          employee: devUser._id,
          status: 'Enrolled',
        },
      ],
    });
    console.log(
      `✓ Training program created: "${training.title}" with 1 participant (${devUser.name}) enrolled`
    );

    // Update participant progress to Completed
    const participant = training.participants.find(
      (p) => p.employee.toString() === devUser._id.toString()
    );
    participant.status = 'Completed';
    participant.score = 98;
    participant.feedback = 'Outstanding performance on all DevOps hands-on lab practicals.';
    participant.completedAt = new Date();
    await training.save();
    console.log(
      `✓ Employee training progress updated: Status="${participant.status}", Score=${participant.score}%, Feedback recorded`
    );

    console.log('\n======================================================');
    console.log('>>> ALL MODULE 2 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
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

runModule2Tests();
