const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const { register, getSetupStatus } = require('./controllers/authController');
const { createUserByAdmin, updateUserRoleAndAccess } = require('./controllers/userController');

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

async function runSingleAdminVerification() {
  console.log('--- STARTING SINGLE ADMIN (ADMIN = 1) VERIFICATION ---');
  let mongod;

  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✓ In-memory MongoDB connected for test');

    // 1. Initial Setup Status
    const statusRes1 = createMockRes();
    await getSetupStatus({}, statusRes1);
    if (!statusRes1.data.isFirstUser || statusRes1.data.adminExists) {
      throw new Error('Initial system should have isFirstUser=true and adminExists=false');
    }
    console.log('✓ Initial setup status verified: adminExists=false, isFirstUser=true');

    // 2. Register First User -> Must become HR Admin with employeeId = '1'
    const regReq1 = {
      body: {
        name: 'Master Administrator',
        email: 'admin.master@enterprise.com',
        password: 'password123',
        department: 'Human Resources',
        designation: 'VP of Human Resources',
      },
    };
    const regRes1 = createMockRes();
    await register(regReq1, regRes1);

    if (regRes1.statusCode !== 201) {
      throw new Error(`Register failed with status ${regRes1.statusCode}: ${regRes1.data?.message}`);
    }

    const adminUser = regRes1.data.user;
    if (adminUser.role !== 'HR Admin') {
      throw new Error(`Expected role 'HR Admin', got '${adminUser.role}'`);
    }
    if (adminUser.employeeId !== '1') {
      throw new Error(`Expected admin employeeId '1', got '${adminUser.employeeId}'`);
    }
    console.log(`✓ First registered user is HR Admin with employeeId = "${adminUser.employeeId}"`);

    // 3. Setup Status after First User
    const statusRes2 = createMockRes();
    await getSetupStatus({}, statusRes2);
    if (!statusRes2.data.adminExists || statusRes2.data.adminCount !== 1) {
      throw new Error(`Expected adminCount=1 and adminExists=true, got count=${statusRes2.data.adminCount}`);
    }
    console.log(`✓ Setup status verified: adminCount = ${statusRes2.data.adminCount}, adminExists = true`);

    // 4. Register Second User attempting role: 'HR Admin' -> Must be rejected!
    const regReq2 = {
      body: {
        name: 'Second Admin Attempt',
        email: 'hacker@enterprise.com',
        password: 'password123',
        role: 'HR Admin',
      },
    };
    const regRes2 = createMockRes();
    await register(regReq2, regRes2);

    if (regRes2.statusCode !== 400) {
      throw new Error('Expected 400 rejection when registering second HR Admin');
    }
    console.log(`✓ Prevented second registration as HR Admin: "${regRes2.data.message}"`);

    // 5. Register Regular Employee -> Allowed
    const regReq3 = {
      body: {
        name: 'Alex Employee',
        email: 'alex.staff@enterprise.com',
        password: 'password123',
        role: 'Employee',
      },
    };
    const regRes3 = createMockRes();
    await register(regReq3, regRes3);
    if (regRes3.statusCode !== 201) {
      throw new Error('Employee registration should succeed');
    }
    const staffUser = regRes3.data.user;
    console.log(`✓ Regular employee registered: ${staffUser.name} (${staffUser.employeeId})`);

    // 6. Admin creates a user attempting role: 'HR Admin' -> Must be rejected!
    const createReq = {
      user: adminUser,
      body: {
        name: 'Admin Creation Attempt',
        email: 'admin2@enterprise.com',
        password: 'password123',
        role: 'HR Admin',
      },
    };
    const createRes = createMockRes();
    await createUserByAdmin(createReq, createRes);
    if (createRes.statusCode !== 400) {
      throw new Error('Expected 400 rejection when admin attempts to create a second HR Admin');
    }
    console.log(`✓ Prevented creating second HR Admin via admin panel: "${createRes.data.message}"`);

    // 7. Admin updates existing staff attempting promotion to 'HR Admin' -> Must be rejected!
    const updateReq = {
      user: adminUser,
      params: { id: staffUser._id },
      body: {
        role: 'HR Admin',
      },
    };
    const updateRes = createMockRes();
    await updateUserRoleAndAccess(updateReq, updateRes);
    if (updateRes.statusCode !== 400) {
      throw new Error('Expected 400 rejection when updating employee to HR Admin');
    }
    console.log(`✓ Prevented promoting employee to HR Admin: "${updateRes.data.message}"`);

    // 8. Confirm exactly 1 HR Admin remains in database
    const finalAdminCount = await User.countDocuments({ role: 'HR Admin' });
    if (finalAdminCount !== 1) {
      throw new Error(`Expected exactly 1 HR Admin in database, found ${finalAdminCount}`);
    }
    console.log(`✓ Verified database state: Total HR Admins = ${finalAdminCount} (Single Master Admin enforced)`);

    console.log('\n======================================================');
    console.log('>>> SINGLE ADMIN & PROFESSIONAL URI VERIFIED (PASS)! <<<');
    console.log('======================================================\n');
  } catch (err) {
    console.error('✗ Verification failed:', err);
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

runSingleAdminVerification();
