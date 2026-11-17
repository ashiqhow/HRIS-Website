const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const Performance = require('../models/Performance');
const Training = require('../models/Training');

// @desc    Get List of Available Reports with Summary Counts
// @route   GET /api/reports/catalog
// @access  Private (HR Admin, Manager)
const getReportsCatalog = async (req, res) => {
  try {
    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;
    const deptScope = !isHRAdmin && req.user.role === 'Manager' ? req.user.department : null;

    const userFilter = deptScope ? { department: deptScope } : {};
    const relevantUserIds = await User.find(userFilter).distinct('_id');

    const [
      employeeCount,
      attendanceCount,
      leaveCount,
      payrollCount,
      jobCount,
      applicantCount,
      performanceCount,
      trainingCount,
    ] = await Promise.all([
      User.countDocuments(userFilter),
      Attendance.countDocuments({ employee: { $in: relevantUserIds } }),
      Leave.countDocuments({ employee: { $in: relevantUserIds } }),
      Payroll.countDocuments({ employee: { $in: relevantUserIds } }),
      JobPosting.countDocuments(deptScope ? { department: deptScope } : {}),
      Applicant.countDocuments(),
      Performance.countDocuments({ employee: { $in: relevantUserIds } }),
      Training.countDocuments(deptScope ? { department: { $in: [deptScope, 'All'] } } : {}),
    ]);

    const catalog = [
      {
        id: 'employees',
        title: 'Employee Information & Profile Directory',
        category: 'Workforce Records',
        description:
          'Complete directory of employees, designations, departments, contact data, employment status, and base compensation.',
        recordCount: employeeCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Employee ID',
          'Full Name',
          'Work Email',
          'Department',
          'Designation',
          'Role',
          'Status',
          'Date of Joining',
          'Base Salary',
        ],
      },
      {
        id: 'attendance',
        title: 'Attendance & Timesheet Log Report',
        category: 'Workforce Operations',
        description:
          'Granular daily check-in/out timestamps, punctuality status (Present, Late, Absent, Half Day), and total work hours.',
        recordCount: attendanceCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Date',
          'Employee ID',
          'Employee Name',
          'Department',
          'Check-In Time',
          'Check-Out Time',
          'Status',
          'Work Hours',
        ],
      },
      {
        id: 'leaves',
        title: 'Leave & Balance Utilization Audit',
        category: 'Time-Off Management',
        description:
          'Online leave applications, leave categories, durations, approval decisions, comments, and remaining annual quotas.',
        recordCount: leaveCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Leave ID',
          'Employee Name',
          'Department',
          'Leave Type',
          'Start Date',
          'End Date',
          'Days Count',
          'Status',
          'Approved By',
        ],
      },
      {
        id: 'payroll',
        title: 'Payroll & Monthly Compensation Report',
        category: 'Financial Operations',
        description:
          'Itemized salary payouts: basic salary, allowances, bonuses, statutory deductions, and computed net salary formula.',
        recordCount: payrollCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Payslip ID',
          'Period',
          'Employee Name',
          'Department',
          'Basic Salary',
          'Allowances',
          'Bonuses',
          'Deductions',
          'Net Salary',
          'Status',
        ],
      },
      {
        id: 'recruitment',
        title: 'Recruitment & Candidate Pipeline ATS Report',
        category: 'Talent Acquisition',
        description:
          'Active vacancies, candidate applications, contact credentials, pipeline stages, and manager interview ratings.',
        recordCount: applicantCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Candidate Name',
          'Applied Position',
          'Department',
          'Email',
          'Stage',
          'Application Date',
          'Interviewer Rating',
        ],
      },
      {
        id: 'performance',
        title: 'Employee Appraisals & Performance Ratings',
        category: 'Talent Development',
        description:
          'Periodic performance evaluation scores, productivity assessments, rating tier categorization, and manager qualitative feedback.',
        recordCount: performanceCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Employee Name',
          'Department',
          'Period',
          'Reviewer',
          'Productivity Score',
          'Overall Score',
          'Rating Tier',
          'Evaluation Date',
        ],
      },
      {
        id: 'training',
        title: 'Training Programs & Workforce Completion Report',
        category: 'Skill Development',
        description:
          'Curriculum details, scheduled dates, instructor names, enrolled participants, completion statuses, and evaluation scores.',
        recordCount: trainingCount,
        formats: ['PDF', 'CSV'],
        columns: [
          'Training Title',
          'Department',
          'Instructor',
          'Schedule',
          'Enrolled Count',
          'Completed Count',
          'Completion Rate',
          'Status',
        ],
      },
    ];

    res.json({
      success: true,
      departmentScope: deptScope || 'All Organization',
      catalog,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate and Export Specific Domain Report
// @route   GET /api/reports/generate
// @access  Private (HR Admin, Manager)
const generateComprehensiveReport = async (req, res) => {
  try {
    const { type, department, status, startDate, endDate, month, year, search } = req.query;
    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;

    // Scope to manager department if non-HR Admin
    let targetDept = null;
    if (!isHRAdmin && req.user.role === 'Manager') {
      targetDept = req.user.department;
    } else if (department && department !== 'All') {
      targetDept = department;
    }

    let reportData = {
      type: type || 'employees',
      title: '',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
      departmentScope: targetDept || 'All Organization',
      summary: {},
      columns: [],
      rows: [],
    };

    switch (type) {
      // 1. Employees Report
      case 'employees': {
        const query = {};
        if (targetDept) query.department = targetDept;
        if (status && status !== 'All') query.status = status;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } },
            { designation: { $regex: search, $options: 'i' } },
          ];
        }

        const users = await User.find(query).sort({ employeeId: 1 });
        reportData.title = 'Employee Information & Profile Directory Report';
        reportData.columns = [
          'Employee ID',
          'Full Name',
          'Work Email',
          'Department',
          'Designation',
          'Role',
          'Status',
          'Employment Type',
          'Joining Date',
          'Base Salary',
        ];

        reportData.summary = {
          totalRecords: users.length,
          activeCount: users.filter((u) => u.status === 'Active').length,
          inactiveCount: users.filter((u) => u.status !== 'Active').length,
        };

        reportData.rows = users.map((u) => [
          u.employeeId || 'N/A',
          u.name,
          u.email,
          u.department,
          u.designation,
          u.role,
          u.status,
          u.employmentType || 'Full-time',
          u.dateOfJoining ? new Date(u.dateOfJoining).toLocaleDateString() : 'N/A',
          isHRAdmin ? `${u.salary?.currency || 'USD'} ${u.salary?.baseSalary?.toLocaleString() || 0}` : 'Protected',
        ]);
        break;
      }

      // 2. Attendance Report
      case 'attendance': {
        const userFilter = targetDept ? { department: targetDept } : {};
        const relevantUserIds = await User.find(userFilter).distinct('_id');

        const query = { employee: { $in: relevantUserIds } };
        if (status && status !== 'All') query.status = status;
        if (startDate && endDate) {
          query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await Attendance.find(query)
          .populate('employee', 'name employeeId department designation')
          .sort({ date: -1 })
          .limit(500);

        reportData.title = 'Workforce Attendance & Timesheet Report';
        reportData.columns = [
          'Date',
          'Employee ID',
          'Employee Name',
          'Department',
          'Check-In Time',
          'Check-Out Time',
          'Status',
          'Work Hours',
        ];

        let present = 0;
        let late = 0;
        let totalHours = 0;
        logs.forEach((l) => {
          if (l.status === 'Present') present++;
          if (l.status === 'Late') late++;
          totalHours += l.workHours || 0;
        });

        reportData.summary = {
          totalRecords: logs.length,
          presentCount: present,
          lateCount: late,
          punctualityRate: logs.length > 0 ? Math.round((present / logs.length) * 100) : 100,
          totalHoursWorked: Number(totalHours.toFixed(1)),
        };

        reportData.rows = logs.map((l) => [
          new Date(l.date).toLocaleDateString(),
          l.employee?.employeeId || 'N/A',
          l.employee?.name || 'Unknown',
          l.employee?.department || 'N/A',
          l.checkInTime ? new Date(l.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          l.checkOutTime ? new Date(l.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          l.status,
          l.workHours ? `${l.workHours} hrs` : '0 hrs',
        ]);
        break;
      }

      // 3. Leaves Report
      case 'leaves': {
        const userFilter = targetDept ? { department: targetDept } : {};
        const relevantUserIds = await User.find(userFilter).distinct('_id');

        const query = { employee: { $in: relevantUserIds } };
        if (status && status !== 'All') query.status = status;

        const leaves = await Leave.find(query)
          .populate('employee', 'name employeeId department')
          .populate('reviewedBy', 'name role')
          .sort({ createdAt: -1 });

        reportData.title = 'Leave Applications & Utilization Audit Report';
        reportData.columns = [
          'Employee ID',
          'Employee Name',
          'Department',
          'Leave Type',
          'Start Date',
          'End Date',
          'Days Granted',
          'Status',
          'Approver',
          'Reason',
        ];

        const approved = leaves.filter((l) => l.status === 'Approved').length;
        const pending = leaves.filter((l) => l.status === 'Pending').length;
        const totalDays = leaves
          .filter((l) => l.status === 'Approved')
          .reduce((acc, curr) => acc + (curr.daysCount || 0), 0);

        reportData.summary = {
          totalRecords: leaves.length,
          approvedCount: approved,
          pendingCount: pending,
          totalApprovedDays: totalDays,
        };

        reportData.rows = leaves.map((l) => [
          l.employee?.employeeId || 'N/A',
          l.employee?.name || 'Unknown',
          l.employee?.department || 'N/A',
          l.leaveType,
          new Date(l.startDate).toLocaleDateString(),
          new Date(l.endDate).toLocaleDateString(),
          `${l.daysCount || 0} days`,
          l.status,
          l.reviewedBy?.name || 'Pending Review',
          l.reason,
        ]);
        break;
      }

      // 4. Payroll Report
      case 'payroll': {
        const userFilter = targetDept ? { department: targetDept } : {};
        const relevantUserIds = await User.find(userFilter).distinct('_id');

        const query = { employee: { $in: relevantUserIds } };
        if (month && month !== 'All') query.month = Number(month);
        if (year && year !== 'All') query.year = Number(year);
        if (status && status !== 'All') query.paymentStatus = status;

        const payrolls = await Payroll.find(query)
          .populate('employee', 'name employeeId department')
          .sort({ year: -1, month: -1 });

        reportData.title = 'Monthly Payroll & Compensation Expenditure Report';
        reportData.columns = [
          'Payslip ID',
          'Period',
          'Employee ID',
          'Employee Name',
          'Department',
          'Basic Salary',
          'Allowances',
          'Bonuses',
          'Deductions',
          'Net Salary',
          'Status',
        ];

        let totalGross = 0;
        let totalNet = 0;
        payrolls.forEach((p) => {
          totalGross += (p.basicSalary || 0) + (p.allowances || 0) + (p.bonuses || 0);
          totalNet += p.netSalary || 0;
        });

        reportData.summary = {
          totalRecords: payrolls.length,
          totalGrossExpenditure: Number(totalGross.toFixed(2)),
          totalNetDisbursed: Number(totalNet.toFixed(2)),
        };

        reportData.rows = payrolls.map((p) => [
          p.payslipId || 'N/A',
          p.period || `${p.month}/${p.year}`,
          p.employee?.employeeId || 'N/A',
          p.employee?.name || 'Unknown',
          p.employee?.department || 'N/A',
          `$${(p.basicSalary || 0).toLocaleString()}`,
          `$${(p.allowances || 0).toLocaleString()}`,
          `$${(p.bonuses || 0).toLocaleString()}`,
          `$${(p.deductions || 0).toLocaleString()}`,
          `$${(p.netSalary || 0).toLocaleString()}`,
          p.paymentStatus,
        ]);
        break;
      }

      // 5. Recruitment Report
      case 'recruitment': {
        const jobFilter = targetDept ? { department: targetDept } : {};
        const jobs = await JobPosting.find(jobFilter);
        const jobIds = jobs.map((j) => j._id);

        const applicants = await Applicant.find({ job: { $in: jobIds } })
          .populate('job', 'title department')
          .sort({ createdAt: -1 });

        reportData.title = 'Recruitment Vacancy & Candidate Pipeline Report';
        reportData.columns = [
          'Candidate Name',
          'Applied Position',
          'Department',
          'Email',
          'Phone',
          'Experience',
          'Pipeline Stage',
          'Date Applied',
        ];

        reportData.summary = {
          totalVacancies: jobs.length,
          totalApplicants: applicants.length,
          shortlistedCount: applicants.filter((a) => a.stage === 'Shortlisted').length,
          selectedCount: applicants.filter((a) => a.stage === 'Selected').length,
        };

        reportData.rows = applicants.map((a) => [
          a.name,
          a.job?.title || 'Open Role',
          a.job?.department || 'N/A',
          a.email,
          a.phone || 'N/A',
          a.experience || 'N/A',
          a.stage,
          new Date(a.createdAt).toLocaleDateString(),
        ]);
        break;
      }

      // 6. Performance Report
      case 'performance': {
        const userFilter = targetDept ? { department: targetDept } : {};
        const relevantUserIds = await User.find(userFilter).distinct('_id');

        const query = { employee: { $in: relevantUserIds } };
        const evals = await Performance.find(query)
          .populate('employee', 'name employeeId department designation')
          .populate('reviewer', 'name role')
          .sort({ createdAt: -1 });

        reportData.title = 'Employee Performance Appraisal & Ratings Report';
        reportData.columns = [
          'Employee ID',
          'Employee Name',
          'Department',
          'Evaluation Period',
          'Reviewer',
          'Productivity Score',
          'Overall Score',
          'Rating Tier',
          'Feedback Summary',
        ];

        const avgScore =
          evals.length > 0
            ? Math.round(evals.reduce((acc, e) => acc + (e.overallScore || 0), 0) / evals.length)
            : 0;

        reportData.summary = {
          totalRecords: evals.length,
          averageScore: avgScore,
          excellentCount: evals.filter((e) => e.rating === 'Excellent').length,
          veryGoodCount: evals.filter((e) => e.rating === 'Very Good').length,
        };

        reportData.rows = evals.map((e) => [
          e.employee?.employeeId || 'N/A',
          e.employee?.name || 'Unknown',
          e.employee?.department || 'N/A',
          e.period,
          e.reviewer?.name || 'Lead',
          `${e.productivityScore || 0}%`,
          `${e.overallScore || 0} / 100`,
          e.rating,
          e.feedback || '',
        ]);
        break;
      }

      // 7. Training Report
      case 'training': {
        const query = targetDept ? { department: { $in: [targetDept, 'All'] } } : {};
        const trainings = await Training.find(query)
          .populate('participants.employee', 'name employeeId department')
          .sort({ startDate: -1 });

        reportData.title = 'Employee Training Curriculum & Completion Report';
        reportData.columns = [
          'Training Title',
          'Department',
          'Instructor',
          'Schedule',
          'Location',
          'Total Enrolled',
          'Completed Count',
          'Completion Rate',
          'Program Status',
        ];

        let totalEnrolled = 0;
        let totalCompleted = 0;
        trainings.forEach((t) => {
          t.participants.forEach((p) => {
            totalEnrolled++;
            if (p.status === 'Completed') totalCompleted++;
          });
        });

        reportData.summary = {
          totalPrograms: trainings.length,
          totalEnrolled,
          totalCompleted,
          overallCompletionRate: totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0,
        };

        reportData.rows = trainings.map((t) => {
          const totalPart = t.participants?.length || 0;
          const compPart = t.participants?.filter((p) => p.status === 'Completed').length || 0;
          const rate = totalPart > 0 ? Math.round((compPart / totalPart) * 100) : 0;
          return [
            t.title,
            t.department,
            t.trainer,
            `${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.endDate).toLocaleDateString()}`,
            t.location,
            totalPart,
            compPart,
            `${rate}%`,
            t.status,
          ];
        });
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type requested' });
    }

    res.json({
      success: true,
      report: reportData,
    });
  } catch (err) {
    console.error('Generate Report Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getReportsCatalog,
  generateComprehensiveReport,
};
