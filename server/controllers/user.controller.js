import User from '../models/User.model.js';

// @desc    Get all responders
// @route   GET /api/users/responders
// @access  Private
export const getResponders = async (req, res) => {
  try {
    const responders = await User.find({ role: 'responder' }).select('-password');

    res.json({
      success: true,
      count: responders.length,
      data: responders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, contact, location, responderStatus, responderType } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.contact = contact || user.contact;
    user.location = location || user.location;
    
    if (user.role === 'responder') {
      if (responderStatus) {
        user.responderStatus = responderStatus;
      }
      if (responderType) {
        user.responderType = responderType;
      }
    }

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
