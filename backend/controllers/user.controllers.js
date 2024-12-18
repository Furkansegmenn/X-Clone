import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	const { id } = req.params;

	try {
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can not follow/unfollow yourself" });
		}

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed succesfully" });
		} else {
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

			const newNotification = new Notification({
				from: req.user._id,
				to: userToModify._id,
				type: "follow",
			});

			await newNotification.save();

			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const followedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);

		const filteredUsers = users.filter((user) => !followedByMe.following.includes(user._id));
		const suggestedUser = filteredUsers.slice(0, 4);

		suggestedUser.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUser);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUserProfile = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (newPassword && currentPassword) {
			if (newPassword === currentPassword) {
				return res.status(400).json({ error: "New password must be different from current password" });
			}
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) {
				return res.status(400).json({ error: "Current password is incorrect" });
			}
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				//'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg'
				// if you want to destroy the image , you must be destroy it's id (shoes)
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}
			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}
		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}
			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		user.password = null; // password should be null for response but in database, it should be stay same

		res.status(200).json(user);
	} catch (error) {}
};
