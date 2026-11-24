const Room = require('../models/Room');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/rooms
// @desc    Get all examination rooms
// @access  Private
exports.getRooms = async (req, res, next) => {
  try {
    const { search, building, isAvailable, minCapacity } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } }
      ];
    }

    if (building) query.building = building;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
    if (minCapacity) query.examCapacity = { $gte: Number(minCapacity) };

    const rooms = await Room.find(query).sort({ building: 1, floor: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Private
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/rooms
// @desc    Create new room
// @access  Private (Admin)
exports.createRoom = async (req, res, next) => {
  try {
    const { roomNumber } = req.body;
    const exists = await Room.findOne({ roomNumber: roomNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const room = await Room.create({
      ...req.body,
      roomNumber: roomNumber.toUpperCase()
    });

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'ROOM',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: room._id.toString(),
        targetTitle: `${room.roomNumber} (${room.building})`,
        details: room
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin)
exports.updateRoom = async (req, res, next) => {
  try {
    if (req.body.roomNumber) {
      req.body.roomNumber = req.body.roomNumber.toUpperCase();
    }

    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'ROOM',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: room._id.toString(),
        targetTitle: `${room.roomNumber} (${room.building})`,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin)
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'ROOM',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: room._id.toString(),
        targetTitle: `${room.roomNumber} (${room.building})`
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
