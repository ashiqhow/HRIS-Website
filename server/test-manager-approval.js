const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const Notification = require('./models/Notification');
const PreApprovedManager = require('./models/PreApprovedManager');
const { register, login, checkPreApproval } = require('./controllers/authController');
const {
  getPendingManagers,
  approveManager,
  rejectManager,
  preApproveManager,
  getPreApprovedManagers,
  revokePreApprovedManager,
} = require('./controllers/userController');

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

async function runManagerApprovalSuite() {
  console.log('====================================================');
  console.log('  HRIS MANAGER APPROVAL & PRE-APPROVAL TEST SUITE  ');
  console.log('====================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
    await mongoose.connect(mongod.getUri());
    console.log('✓ In-memory MongoDB connected using cached engine (8.2.6)\n');

    // -------------------------------------------------------------
    // Step 1: Initialize Single Master HR Admin
    // -------------------------------------------------------------
    console.log('[Step 1] Initializing Master HR Admin (Admin Count = 1):');
    const adminRes = createMockRes();
    await register(
      {
        body: {
          name: 'Sarah Jenkins',
          email: 'admin@hris.corp',
          password: 'Password123!',
          department: 'Human Resources',
          designation: 'Chief HR Officer',
        },
      },
      adminRes
    );

    if (adminRes.statusCode !== 201 || adminRes.data.user.role !== 'HR Admin') {
      throw new Error(`Admin creation failed: ${JSON.stringify(adminRes.data)}`);
    }
    const admin = adminRes.data.user;
    console.log(`  ✓ Master Admin initialized: ${admin.name} (${admin.email}, ID: ${admin.employeeId}, Role: ${admin.role})`);

    // -------------------------------------------------------------
    // Step 2: Manager Self-Registration (Without Pre-Approval)
    // -------------------------------------------------------------
    console.log('\n[Step 2] Manager registers without pre-approval:');
    const pendingMgrRes = createMockRes();
    await register(
      {
        body: {
          name: 'Marcus Vance',
          email: 'marcus.vance@techcorp.com',
          password: 'Password123!',
          role: 'Manager',
          department: 'Engineering',
          designation: 'Lead Engineering Manager',
        },
      },
      pendingMgrRes
    );

    if (pendingMgrRes.statusCode !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(pendingMgrRes.data)}`);
    }

    if (!pendingMgrRes.data.requiresApproval || pendingMgrRes.data.user.status !== 'Pending Approval') {
      throw new Error(`Expected requiresApproval=true and status='Pending Approval', got: ${JSON.stringify(pendingMgrRes.data)}`);
    }

    if (pendingMgrRes.data.token) {
      throw new Error('JWT token must NOT be returned for pending manager accounts!');
    }
    console.log(`  ✓ Manager registered: ${pendingMgrRes.data.user.name}`);
    console.log(`  ✓ Status: ${pendingMgrRes.data.user.status}`);
    console.log(`  ✓ requiresApproval flag: true (Token suppressed)`);

    // Verify Notification sent to Admin
    const adminNotification = await Notification.findOne({
      recipient: admin._id,
      title: 'Manager Approval Required',
    });
    if (!adminNotification) {
      throw new Error('Notification was not dispatched to Master HR Admin!');
    }
    console.log(`  ✓ Admin Notification confirmed: "${adminNotification.message}"`);

    // -------------------------------------------------------------
    // Step 3: Pending Manager Attempts Login (Must Be Blocked with 403)
    // -------------------------------------------------------------
    console.log('\n[Step 3] Pending Manager attempts to log in:');
    const blockedLoginRes = createMockRes();
    await login(
      {
        body: {
          email: 'marcus.vance@techcorp.com',
          password: 'Password123!',
        },
      },
      blockedLoginRes
    );

    if (blockedLoginRes.statusCode !== 403 || !blockedLoginRes.data.isPendingApproval) {
      throw new Error(`Expected 403 with isPendingApproval=true, got status ${blockedLoginRes.statusCode}: ${JSON.stringify(blockedLoginRes.data)}`);
    }
    console.log(`  ✓ Login Gatekeeper: Blocked (HTTP 403 Forbidden)`);
    console.log(`  ✓ Response message: "${blockedLoginRes.data.message}"`);

    // -------------------------------------------------------------
    // Step 4: HR Admin Pre-Approve Workflow
    // -------------------------------------------------------------
    console.log('\n[Step 4] HR Admin pre-authorizes manager email:');
    const preApproveRes = createMockRes();
    await preApproveManager(
      {
        user: { _id: admin._id, role: 'HR Admin' },
        body: {
          email: 'elena.rostova@techcorp.com',
          department: 'Product',
          designation: 'Director of Product',
          notes: 'Pre-approved following executive committee interview',
        },
      },
      preApproveRes
    );

    if (preApproveRes.statusCode !== 201) {
      throw new Error(`Pre-approval failed: ${JSON.stringify(preApproveRes.data)}`);
    }
    console.log(`  ✓ Email pre-approved: ${preApproveRes.data.preApproval.email} for ${preApproveRes.data.preApproval.department}`);

    // Verify check-preapproval endpoint
    const checkRes = createMockRes();
    await checkPreApproval(
      {
        query: { email: 'elena.rostova@techcorp.com' },
      },
      checkRes
    );
    if (!checkRes.data.isPreApproved || checkRes.data.department !== 'Product') {
      throw new Error(`checkPreApproval failed: ${JSON.stringify(checkRes.data)}`);
    }
    console.log(`  ✓ checkPreApproval API verified: isPreApproved=true, department=${checkRes.data.department}`);

    // Pre-approved manager signs up
    console.log('\n[Step 5] Pre-approved manager registers:');
    const preApprovedMgrRes = createMockRes();
    await register(
      {
        body: {
          name: 'Elena Rostova',
          email: 'elena.rostova@techcorp.com',
          password: 'Password123!',
          role: 'Manager',
          department: 'Product',
          designation: 'Director of Product',
        },
      },
      preApprovedMgrRes
    );

    if (preApprovedMgrRes.statusCode !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(preApprovedMgrRes.data)}`);
    }

    if (preApprovedMgrRes.data.user.status !== 'Active' || !preApprovedMgrRes.data.token) {
      throw new Error(`Pre-approved manager should be instantly Active with a token: ${JSON.stringify(preApprovedMgrRes.data)}`);
    }
    console.log(`  ✓ Pre-approved Manager instantly activated: ${preApprovedMgrRes.data.user.name}`);
    console.log(`  ✓ Status: ${preApprovedMgrRes.data.user.status}`);
    console.log(`  ✓ JWT Token provided: Yes (${preApprovedMgrRes.data.token.slice(0, 15)}...)`);

    // Verify pre-approval marked used
    const updatedPre = await PreApprovedManager.findOne({ email: 'elena.rostova@techcorp.com' });
    if (!updatedPre.used) {
      throw new Error('Pre-approval record was not marked as used!');
    }
    console.log(`  ✓ Pre-approval record marked used: ${updatedPre.used}`);

    // Pre-approved manager logs in
    const preMgrLoginRes = createMockRes();
    await login(
      {
        body: {
          email: 'elena.rostova@techcorp.com',
          password: 'Password123!',
        },
      },
      preMgrLoginRes
    );
    if (preMgrLoginRes.statusCode !== 200 || !preMgrLoginRes.data.token) {
      throw new Error(`Pre-approved manager login failed: ${JSON.stringify(preMgrLoginRes.data)}`);
    }
    console.log(`  ✓ Pre-approved manager logged in successfully!`);

    // -------------------------------------------------------------
    // Step 6: HR Admin Reviews & Approves Pending Manager
    // -------------------------------------------------------------
    console.log('\n[Step 6] HR Admin reviews and approves pending manager:');
    const pendingListRes = createMockRes();
    await getPendingManagers({}, pendingListRes);
    if (pendingListRes.data.count !== 1 || pendingListRes.data.users[0].email !== 'marcus.vance@techcorp.com') {
      throw new Error(`getPendingManagers returned invalid list: ${JSON.stringify(pendingListRes.data)}`);
    }
    console.log(`  ✓ Admin pending queue: 1 pending manager found (${pendingListRes.data.users[0].name})`);

    // Admin approves Marcus Vance
    const approveRes = createMockRes();
    await approveManager(
      {
        params: { id: pendingMgrRes.data.user._id },
        user: { _id: admin._id, role: 'HR Admin' },
      },
      approveRes
    );

    if (approveRes.statusCode !== 200 || approveRes.data.user.status !== 'Active') {
      throw new Error(`Approve manager failed: ${JSON.stringify(approveRes.data)}`);
    }
    console.log(`  ✓ Marcus Vance approved by Admin! New status: ${approveRes.data.user.status}`);

    // Verify approval notification to Marcus
    const mgrApprovalNotif = await Notification.findOne({
      recipient: pendingMgrRes.data.user._id,
      title: 'Manager Account Approved!',
    });
    if (!mgrApprovalNotif) {
      throw new Error('Approval notification was not created for manager!');
    }
    console.log(`  ✓ Manager notified: "${mgrApprovalNotif.message}"`);

    // Marcus can now log in successfully!
    const marcusLoginRes = createMockRes();
    await login(
      {
        body: {
          email: 'marcus.vance@techcorp.com',
          password: 'Password123!',
        },
      },
      marcusLoginRes
    );
    if (marcusLoginRes.statusCode !== 200 || !marcusLoginRes.data.token) {
      throw new Error(`Approved manager login failed: ${JSON.stringify(marcusLoginRes.data)}`);
    }
    console.log(`  ✓ Previously pending manager now logs in with full access! Token granted.`);

    // -------------------------------------------------------------
    // Step 7: Rejection Workflow
    // -------------------------------------------------------------
    console.log('\n[Step 7] Testing Manager Rejection:');
    const rejectedMgrRes = createMockRes();
    await register(
      {
        body: {
          name: 'Invalid Applicant',
          email: 'fake.manager@fake.com',
          password: 'Password123!',
          role: 'Manager',
          department: 'Sales',
        },
      },
      rejectedMgrRes
    );

    const rejectRes = createMockRes();
    await rejectManager(
      {
        params: { id: rejectedMgrRes.data.user._id },
        user: { _id: admin._id, role: 'HR Admin' },
        body: { reason: 'Incomplete credentials verification.' },
      },
      rejectRes
    );

    if (rejectRes.statusCode !== 200) {
      throw new Error(`Reject manager failed: ${JSON.stringify(rejectRes.data)}`);
    }
    console.log(`  ✓ Fake manager rejected: Status set to Suspended.`);

    // Attempt login by rejected manager
    const rejectedLoginRes = createMockRes();
    await login(
      {
        body: {
          email: 'fake.manager@fake.com',
          password: 'Password123!',
        },
      },
      rejectedLoginRes
    );
    if (rejectedLoginRes.statusCode !== 403) {
      throw new Error('Suspended manager must be blocked from logging in!');
    }
    console.log(`  ✓ Suspended manager login blocked (HTTP 403: "${rejectedLoginRes.data.message}")`);

    console.log('\n====================================================');
    console.log('  ALL MANAGER APPROVAL & PRE-APPROVAL TESTS PASSED! ');
    console.log('====================================================\n');
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

runManagerApprovalSuite();
