const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// @desc    Get current user's today attendance status
// @route   GET /api/attendance/today
// @access  Private
const getTodayStatus = async (req, res) => {
  try {
    const today = getStartOfToday();
    const record = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today },
    });

    res.json({
      success: true,
      hasCheckedIn: !!record && !!record.checkIn,
      hasCheckedOut: !!record && !!record.checkOut,
      record: record || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Check In for today
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
  try {
    const today = getStartOfToday();
    let record = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today },
    });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in for today',
      });
    }

    const now = new Date();
    // Check if late (e.g. after 9:30 AM)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    if (!record) {
      record = new Attendance({
        employee: req.user._id,
        date: today,
        checkIn: now,
        status: isLate ? 'Late' : 'Present',
      });
    } else {
      record.checkIn = now;
      record.status = isLate ? 'Late' : 'Present';
    }

    await record.save();

    // Create notification
    await Notification.create({
      recipient: req.user._id,
      title: 'Attendance: Check-In Recorded',
      message: `You checked in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${record.status}). Have a productive day!`,
      type: 'attendance',
      link: '/attendance',
    });

    res.json({
      success: true,
      message: `Checked in successfully at ${now.toLocaleTimeString()}`,
      record,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Check Out for today
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
  try {
    const today = getStartOfToday();
    const record = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today },
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You must check in first before checking out',
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out for today',
      });
    }

    const now = new Date();
    record.checkOut = now;

    // Calculate duration in hours
    const durationMs = now.getTime() - new Date(record.checkIn).getTime();
    const durationHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
    record.workHours = durationHours;

    await record.save();

    await Notification.create({
      recipient: req.user._id,
      title: 'Attendance: Check-Out Recorded',
      message: `You checked out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total logged work time: ${durationHours} hours.`,
      type: 'attendance',
      link: '/attendance',
    });

    res.json({
      success: true,
      message: `Checked out successfully! Total work time: ${durationHours}h`,
      record,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get attendance logs
// @route   GET /api/attendance/logs
// @access  Private
const getAttendanceLogs = async (req, res) => {
  try {
    const { filter, department, date, month, year, status } = req.query;
    const query = {};

    if (req.user.role === 'Employee' || filter === 'mine') {
      query.employee = req.user._id;
    } else if (req.user.role === 'Manager' && !req.user.permissions?.canViewAllAttendance) {
      const teamUserIds = await User.find({ department: req.user.department }).distinct('_id');
      query.employee = { $in: teamUserIds };
    } else if (department && department !== 'All') {
      const deptUserIds = await User.find({ department }).distinct('_id');
      query.employee = { $in: deptUserIds };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    // Specific single date
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    } else if (month && year) {
      // Month & year filter (e.g. for monthly timesheet view)
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const logs = await Attendance.find(query)
      .populate('employee', 'name email employeeId department designation avatar')
      .sort({ date: -1, checkIn: -1 })
      .limit(200);

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate attendance summaries and reports for HR & Managers
// @route   GET /api/attendance/reports
// @access  Private (HR Admin, Manager)
const getAttendanceReports = async (req, res) => {
  try {
    const { startDate, endDate, department, timeframe } = req.query;

    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();

    // Default timeframe presets
    if (!startDate || !endDate) {
      const now = new Date();
      if (timeframe === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (timeframe === 'week') {
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        end = new Date();
      } else {
        // Default: This Month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
    } else {
      end.setHours(23, 59, 59, 999);
    }

    const userScope = {};
    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canViewAllAttendance;

    if (!isHRAdmin && req.user.role === 'Manager') {
      userScope.department = req.user.department;
    } else if (department && department !== 'All') {
      userScope.department = department;
    }

    const targetUsers = await User.find(userScope).select('name email employeeId department designation');
    const targetUserIds = targetUsers.map((u) => u._id);

    const logs = await Attendance.find({
      employee: { $in: targetUserIds },
      date: { $gte: start, $lte: end },
    }).populate('employee', 'name employeeId department designation');

    // Aggregate metrics
    const totalRecords = logs.length;
    const presentCount = logs.filter((l) => l.status === 'Present').length;
    const lateCount = logs.filter((l) => l.status === 'Late').length;
    const absentCount = logs.filter((l) => l.status === 'Absent').length;
    const halfDayCount = logs.filter((l) => l.status === 'Half Day').length;

    const totalHoursLogged = parseFloat(
      logs.reduce((acc, curr) => acc + (curr.workHours || 0), 0).toFixed(2)
    );
    const avgHoursPerShift = totalRecords > 0
      ? parseFloat((totalHoursLogged / totalRecords).toFixed(2))
      : 0;

    const punctualityRate = (presentCount + lateCount) > 0
      ? Math.round((presentCount / (presentCount + lateCount)) * 100)
      : 0;

    // Breakdown by department
    const deptMap = {};
    logs.forEach((log) => {
      const dept = log.employee?.department || 'Unassigned';
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, present: 0, late: 0, hours: 0 };
      }
      deptMap[dept].total += 1;
      if (log.status === 'Present') deptMap[dept].present += 1;
      if (log.status === 'Late') deptMap[dept].late += 1;
      deptMap[dept].hours += log.workHours || 0;
    });

    const departmentStats = Object.keys(deptMap).map((dept) => ({
      department: dept,
      total: deptMap[dept].total,
      present: deptMap[dept].present,
      late: deptMap[dept].late,
      hours: parseFloat(deptMap[dept].hours.toFixed(1)),
      rate: deptMap[dept].total > 0 ? Math.round((deptMap[dept].present / deptMap[dept].total) * 100) : 0,
    }));

    // Employee specific summary
    const employeeMap = {};
    targetUsers.forEach((u) => {
      employeeMap[u._id.toString()] = {
        employee: u,
        shifts: 0,
        present: 0,
        late: 0,
        hours: 0,
      };
    });

    logs.forEach((log) => {
      const eId = log.employee?._id?.toString();
      if (eId && employeeMap[eId]) {
        employeeMap[eId].shifts += 1;
        if (log.status === 'Present') employeeMap[eId].present += 1;
        if (log.status === 'Late') employeeMap[eId].late += 1;
        employeeMap[eId].hours += log.workHours || 0;
      }
    });

    const employeeSummaries = Object.values(employeeMap).map((item) => ({
      ...item,
      hours: parseFloat(item.hours.toFixed(1)),
    }));

    res.json({
      success: true,
      timeframe: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        totalRecords,
        presentCount,
        lateCount,
        absentCount,
        halfDayCount,
        totalHoursLogged,
        avgHoursPerShift,
        punctualityRate,
        totalTrackedEmployees: targetUsers.length,
      },
      departmentStats,
      employeeSummaries,
      logs,
    });
  } catch (err) {
    console.error('Attendance Report Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTodayStatus,
  checkIn,
  checkOut,
  getAttendanceLogs,
  getAttendanceReports,
};
