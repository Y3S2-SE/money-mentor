// IT23218512 - hotfix/vuln-6

// vuln-6: per-account login lockout.
// The IP rate limiter alone can be bypassed by spreading guesses across many IPs, so wrong passwords are also counted per account.

import User from '../models/user.model.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// True while the account's lock time is still in the future
export const isAccountLocked = (user) =>
    Boolean(user.lockUntil && new Date(user.lockUntil).getTime() > Date.now());

// Record one wrong password. Returns true if this failure locked the account.
// $inc is atomic in MongoDB, so parallel guesses are all counted (none can slip through).
export const recordFailedLogin = async (userId) => {
    const updated = await User.findOneAndUpdate(
        { _id: userId },
        { $inc: { failedLoginAttempts: 1 } },
        { new: true }
    ).select('+failedLoginAttempts');

    if (!updated || updated.failedLoginAttempts < MAX_FAILED_ATTEMPTS) return false;

    // Start the lock and reset the counter, so the user gets a fresh set of tries after it ends
    await User.updateOne(
        { _id: userId },
        { $set: { lockUntil: new Date(Date.now() + LOCK_DURATION_MS), failedLoginAttempts: 0 } }
    );
    return true;
};

// Clear lockout state after a successful login (saved by login()'s existing user.save())
export const resetFailedLogins = (user) => {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
};
