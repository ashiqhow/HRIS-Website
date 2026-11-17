const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRoleAndAccess,
  createUserByAdmin,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(authorize('HR Admin', 'Manager'), getAllUsers)
  .post(authorize('HR Admin'), createUserByAdmin);

router
  .route('/:id')
  .get(getUserById)
  .delete(authorize('HR Admin'), deleteUser);

router.put('/:id/role-access', authorize('HR Admin'), updateUserRoleAndAccess);

module.exports = router;
