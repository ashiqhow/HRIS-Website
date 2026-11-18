const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRoleAndAccess,
  createUserByAdmin,
  deleteUser,
  getPendingManagers,
  approveManager,
  rejectManager,
  preApproveManager,
  getPreApprovedManagers,
  revokePreApprovedManager,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(authorize('HR Admin', 'Manager'), getAllUsers)
  .post(authorize('HR Admin'), createUserByAdmin);

// Manager approval management (Must be before /:id)
router.get('/pending-managers', authorize('HR Admin'), getPendingManagers);
router
  .route('/preapproved-managers')
  .get(authorize('HR Admin'), getPreApprovedManagers)
  .post(authorize('HR Admin'), preApproveManager);
router.delete('/preapproved-managers/:id', authorize('HR Admin'), revokePreApprovedManager);

// Manager single-actions
router.put('/:id/approve-manager', authorize('HR Admin'), approveManager);
router.put('/:id/reject-manager', authorize('HR Admin'), rejectManager);
router.put('/:id/role-access', authorize('HR Admin'), updateUserRoleAndAccess);

router
  .route('/:id')
  .get(getUserById)
  .delete(authorize('HR Admin'), deleteUser);

module.exports = router;
