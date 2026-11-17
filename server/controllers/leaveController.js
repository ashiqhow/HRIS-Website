const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private (Employee, Manager, HR Admin)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, daysCount, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !daysCount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all leave application details',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date',
      });
    }

    const count = Number(daysCount);

    // Validate available balance for the applicant
    const applicant = await User.findById(req.user._id);
    const typeKey = leaveType.toLowerCase();
    if (applicant.leaveBalance && applicant.leaveBalance[typeKey] !== undefined) {
      if (applicant.leaveBalance[typeKey] < count) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${applicant.leaveBalance[typeKey]} days, requested: ${count} days.`,
        });
      }
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount: count,
      reason,
      status: 'Pending',
    });

    // Notify Managers & HR Admins about the new leave request
    const approvers = await User.find({
      $or: [
        { role: 'HR Admin' },
        { role: 'Manager', department: req.user.department },
      ],
      _id: { $ne: req.user._id },
    });

    for (const approver of approvers) {
      await Notification.create({
        recipient: approver._id,
        title: 'New Leave Request Submitted',
        message: `${req.user.name} (${req.user.department}) applied for ${count} days of ${leaveType} leave.`,
        type: 'leave',
        link: '/leaves',
        sender: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave,
    });
  } catch (err) {
    console.error('Apply Leave Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const { status, filter, department, leaveType } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    // If Employee or viewing "my" leaves
    if (req.user.role === 'Employee' || filter === 'mine') {
      query.employee = req.user._id;
    } else if (req.user.role === 'Manager' && !req.user.permissions?.canManageUsers) {
      const teamUserIds = await User.find({ department: req.user.department }).distinct('_id');
      query.employee = { $in: teamUserIds };
    } else if (department && department !== 'All') {
      const deptUserIds = await User.find({ department }).distinct('_id');
      query.employee = { $in: deptUserIds };
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'name email employeeId department designation avatar')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Review (Approve/Reject) Leave
// @route   PUT /api/leaves/:id/review
// @access  Private (Manager with permissions or HR Admin)
const reviewLeave = async (req, res) => {
  try {
    const { status, reviewComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected',
      });
    }

    const leave = await Leave.findById(req.params.id).populate('employee', 'name email department');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Check authority: HR Admin or Manager of that department
    if (
      req.user.role !== 'HR Admin' &&
      !(req.user.role === 'Manager' && req.user.department === leave.employee.department)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve leave for this department',
      });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewComment = reviewComment || '';
    leave.reviewedAt = new Date();

    await leave.save();

    // Deduct leave balance if approved
    if (status === 'Approved') {
      const applicant = await User.findById(leave.employee._id);
      if (applicant && applicant.leaveBalance) {
        const typeKey = leave.leaveType.toLowerCase();
        if (applicant.leaveBalance[typeKey] !== undefined) {
          applicant.leaveBalance[typeKey] = Math.max(
            0,
            applicant.leaveBalance[typeKey] - leave.daysCount
          );
          await applicant.save();
        }
      }
    }

    // Notify employee of approval/rejection
    await Notification.create({
      recipient: leave.employee._id,
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType} leave request from ${new Date(leave.startDate).toLocaleDateString()} was ${status.toLowerCase()} by ${req.user.name}. ${reviewComment ? `Note: "${reviewComment}"` : ''}`,
      type: 'leave',
      link: '/leaves',
      sender: req.user._id,
    });

    res.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}`,
      leave,
    });
  } catch (err) {
    console.error('Review Leave Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate leave reports and balance analytics for HR & Managers
// @route   GET /api/leaves/reports
// @access  Private (HR Admin, Manager)
const getLeaveReports = async (req, res) => {
  try {
    const { department, year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;
    const userScope = {};

    if (!isHRAdmin && req.user.role === 'Manager') {
      userScope.department = req.user.department;
    } else if (department && department !== 'All') {
      userScope.department = department;
    }

    const targetUsers = await User.find(userScope).select(
      'name email employeeId department designation leaveBalance'
    );
    const targetUserIds = targetUsers.map((u) => u._id);

    const leaves = await Leave.find({
      employee: { $in: targetUserIds },
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }).populate('employee', 'name employeeId department designation');

    const totalRequests = leaves.length;
    const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
    const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
    const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

    const totalDaysApproved = leaves
      .filter((l) => l.status === 'Approved')
      .reduce((acc, curr) => acc + (curr.daysCount || 0), 0);

    // Leave Types breakdown
    const typeMap = {
      Annual: { count: 0, days: 0 },
      Sick: { count: 0, days: 0 },
      Casual: { count: 0, days: 0 },
      'Maternity/Paternity': { count: 0, days: 0 },
      Unpaid: { count: 0, days: 0 },
    };

    leaves.forEach((l) => {
      if (typeMap[l.leaveType]) {
        typeMap[l.leaveType].count += 1;
        if (l.status === 'Approved') {
          typeMap[l.leaveType].days += l.daysCount;
        }
      }
    });

    // Department breakdown
    const deptMap = {};
    leaves.forEach((l) => {
      const dept = l.employee?.department || 'Unassigned';
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, approved: 0, daysApproved: 0 };
      }
      deptMap[dept].total += 1;
      if (l.status === 'Approved') {
        deptMap[dept].approved += 1;
        deptMap[dept].daysApproved += l.daysCount;
      }
    });

    const departmentStats = Object.keys(deptMap).map((d) => ({
      department: d,
      total: deptMap[d].total,
      approved: deptMap[d].approved,
      daysApproved: deptMap[d].daysApproved,
    }));

    // Workforce balances summary
    const workforceBalances = targetUsers.map((u) => {
      const userLeaves = leaves.filter(
        (l) => l.employee?._id?.toString() === u._id.toString() && l.status === 'Approved'
      );
      const daysTaken = userLeaves.reduce((acc, curr) => acc + (curr.daysCount || 0), 0);
      return {
        _id: u._id,
        name: u.name,
        employeeId: u.employeeId,
        department: u.department,
        designation: u.designation,
        leaveBalance: u.leaveBalance || { annual: 14, sick: 10, casual: 8 },
        totalApprovedDays: daysTaken,
      };
    });

    res.json({
      success: true,
      year: selectedYear,
      summary: {
        totalRequests,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalDaysApproved,
        approvalRate: totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0,
      },
      typeBreakdown: typeMap,
      departmentStats,
      workforceBalances,
      leaves,
    });
  } catch (err) {
    console.error('Leave Reports Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  reviewLeave,
  getLeaveReports,
};
