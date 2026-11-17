const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// @desc    Get role-based personalized dashboard data
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    const today = getStartOfToday();

    if (role === 'HR Admin') {
      // 1. HR ADMIN DASHBOARD STATS
      const [
        totalEmployees,
        activeEmployees,
        pendingLeavesCount,
        todayAttendanceCount,
        allDepartments,
        recentLeaves,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'Active' }),
        Leave.countDocuments({ status: 'Pending' }),
        Attendance.countDocuments({ date: { $gte: today }, checkIn: { $ne: null } }),
        User.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Leave.find()
          .populate('employee', 'name email employeeId department designation')
          .sort({ createdAt: -1 })
          .limit(5),
        User.find()
          .select('-password')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const attendanceRate = totalEmployees > 0
        ? Math.round((todayAttendanceCount / totalEmployees) * 100)
        : 0;

      return res.json({
        success: true,
        role: 'HR Admin',
        stats: {
          totalEmployees,
          activeEmployees,
          pendingLeavesCount,
          todayAttendanceCount,
          attendanceRate,
          departmentsCount: allDepartments.length,
        },
        departmentBreakdown: allDepartments.map((d) => ({
          name: d._id || 'Unassigned',
          count: d.count,
        })),
        recentLeaves,
        recentUsers,
      });
    } else if (role === 'Manager') {
      // 2. MANAGER DASHBOARD STATS
      const userDept = user.department;

      const [
        deptMembers,
        teamUserIds,
        pendingTeamLeaves,
        recentTeamLeaves,
      ] = await Promise.all([
        User.find({ department: userDept }).select('-password'),
        User.find({ department: userDept }).distinct('_id'),
        Leave.find({
          status: 'Pending',
          employee: { $in: await User.find({ department: userDept, _id: { $ne: user._id } }).distinct('_id') },
        }).populate('employee', 'name email employeeId designation avatar'),
        Leave.find({
          employee: { $in: await User.find({ department: userDept }).distinct('_id') },
        })
          .populate('employee', 'name employeeId designation')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      // Team members attendance today
      const todayTeamAttendance = await Attendance.countDocuments({
        employee: { $in: teamUserIds },
        date: { $gte: today },
        checkIn: { $ne: null },
      });

      // Today's team on leave
      const todayTeamOnLeave = await Leave.countDocuments({
        employee: { $in: teamUserIds },
        status: 'Approved',
        startDate: { $lte: new Date() },
        endDate: { $gte: today },
      });

      const teamAttendanceRate = teamUserIds.length > 0
        ? Math.round((todayTeamAttendance / teamUserIds.length) * 100)
        : 0;

      return res.json({
        success: true,
        role: 'Manager',
        department: userDept,
        stats: {
          teamSize: teamUserIds.length,
          presentToday: todayTeamAttendance,
          onLeaveToday: todayTeamOnLeave,
          pendingApprovals: pendingTeamLeaves.length,
          attendanceRate: teamAttendanceRate,
        },
        pendingTeamLeaves,
        recentTeamLeaves,
        teamMembers: deptMembers,
      });
    } else {
      // 3. EMPLOYEE DASHBOARD STATS
      const [todayAttendance, myLeaves, recentAnnouncements] = await Promise.all([
        Attendance.findOne({
          employee: user._id,
          date: { $gte: today },
        }),
        Leave.find({ employee: user._id }).sort({ createdAt: -1 }).limit(5),
        Notification.find({
          $or: [
            { recipient: user._id },
            { isBroadcast: true, targetRole: { $in: ['All', 'Employee'] } },
          ],
        })
          .populate('sender', 'name role')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      // Calculate profile completion score
      let score = 30; // base score with name & email
      if (user.profile?.phone) score += 15;
      if (user.profile?.address) score += 15;
      if (user.profile?.emergencyContact?.phone) score += 20;
      if (user.profile?.bio) score += 10;
      if (user.profile?.avatar) score += 10;

      return res.json({
        success: true,
        role: 'Employee',
        stats: {
          leaveBalance: user.leaveBalance || { annual: 14, sick: 10, casual: 8 },
          hasCheckedIn: !!todayAttendance && !!todayAttendance.checkIn,
          hasCheckedOut: !!todayAttendance && !!todayAttendance.checkOut,
          checkInTime: todayAttendance?.checkIn || null,
          workHours: todayAttendance?.workHours || 0,
          pendingLeavesCount: myLeaves.filter((l) => l.status === 'Pending').length,
          profileCompletion: Math.min(score, 100),
        },
        todayAttendance,
        myLeaves,
        recentAnnouncements,
      });
    }
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
};
