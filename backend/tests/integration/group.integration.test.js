import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/user.model.js';
import Group from '../../models/group.model.js';
import { clearTestDB, setupTestDB, teardownTestDB } from '../setup/testSetup.js';

describe('Group API Integration Tests', () => {
  let adminToken;
  let userToken;
  let anotherUserToken;
  let adminId;
  let userId;
  let anotherUserId;
  let testGroup;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create users
    const admin = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    });
    adminId = admin._id;

    const user = await User.create({
      username: 'normaluser',
      email: 'user@example.com',
      password: 'User123!'
    });
    userId = user._id;

    const anotherUser = await User.create({
      username: 'anotheruser',
      email: 'another@example.com',
      password: 'User123!'
    });
    anotherUserId = anotherUser._id;

    // Login all users
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' });
    adminToken = adminRes.body.data.token;

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'User123!' });
    userToken = userRes.body.data.token;

    const anotherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'another@example.com', password: 'User123!' });
    anotherUserToken = anotherRes.body.data.token;

    // Create a default test group owned by admin
    const groupRes = await request(app)
      .post('/api/groups/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Group', description: 'A test group', maxMembers: 5 });
    testGroup = groupRes.body;
  });

  // ──────────────────────────────────────────────
  // POST /api/groups/create
  // ──────────────────────────────────────────────
  describe('POST /api/groups/create', () => {
    it('should create a group and return 201', async () => {
      const response = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'My Group', description: 'Cool group', maxMembers: 4 })
        .expect(201);

      expect(response.body).toHaveProperty('name', 'My Group');
      expect(response.body).toHaveProperty('description', 'Cool group');
      expect(response.body).toHaveProperty('maxMembers', 4);
      expect(response.body).toHaveProperty('inviteCode');
      expect(response.body.inviteCode).toHaveLength(8); // 4 bytes hex = 8 chars
      expect(response.body.members).toContain(userId.toString());
      expect(response.body.admin).toBe(userId.toString());
    });

    it('should auto-add the creator as a member', async () => {
      const response = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Auto Member Group' })
        .expect(201);

      expect(response.body.members).toContain(userId.toString());
    });

    it('should default maxMembers to 5 if not provided', async () => {
      const response = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Default Max Group' })
        .expect(201);

      expect(response.body.maxMembers).toBe(5);
    });

    it('should fail without name and return 400', async () => {
      const response = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'No name here' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Group name is required');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/groups/create')
        .send({ name: 'Unauthorized Group' })
        .expect(401);
    });

    it('should generate a unique invite code for each group', async () => {
      const res1 = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Group One' })
        .expect(201);

      const res2 = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Group Two' })
        .expect(201);

      expect(res1.body.inviteCode).not.toBe(res2.body.inviteCode);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/groups/join
  // ──────────────────────────────────────────────
  describe('POST /api/groups/join', () => {
    it('should allow a user to join a group with a valid invite code', async () => {
      const response = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: testGroup.inviteCode })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Joined successfully');
      expect(response.body.group.members).toContain(userId.toString());
    });

    it('should return 404 for an invalid invite code', async () => {
      const response = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: 'invalidcode' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should return 400 if user is already a member', async () => {
      // Admin is already a member of testGroup
      const response = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ inviteCode: testGroup.inviteCode })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Already a member');
    });

    it('should return 400 if group is full', async () => {
      // Create a group with maxMembers = 1 (admin is already 1 member)
      const fullGroupRes = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Full Group', maxMembers: 1 })
        .expect(201);

      const response = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: fullGroupRes.body.inviteCode })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Group is full');
    });

    it('should return 400 if invite code is missing', async () => {
      const response = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invite code is required');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/groups/join')
        .send({ inviteCode: testGroup.inviteCode })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/groups/leave
  // ──────────────────────────────────────────────
  describe('POST /api/groups/leave', () => {
    beforeEach(async () => {
      // Make user a member of testGroup
      await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: testGroup.inviteCode });
    });

    it('should allow a member to leave the group', async () => {
      const response = await request(app)
        .post('/api/groups/leave')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: testGroup._id })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Left group successfully');

      const group = await Group.findById(testGroup._id);
      expect(group.members.map(m => m.toString())).not.toContain(userId.toString());
    });

    it('should prevent admin from leaving the group', async () => {
      const response = await request(app)
        .post('/api/groups/leave')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Admin cannot leave the group');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/groups/leave')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: fakeId })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/groups/leave')
        .send({ groupId: testGroup._id })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/groups/user-groups
  // ──────────────────────────────────────────────
  describe('GET /api/groups/user-groups', () => {
    it('should return all groups the authenticated user belongs to', async () => {
      const response = await request(app)
        .get('/api/groups/user-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name', 'Test Group');
    });

    it('should return an empty array if user is in no groups', async () => {
      const response = await request(app)
        .get('/api/groups/user-groups')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should populate admin and members fields', async () => {
      const response = await request(app)
        .get('/api/groups/user-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const group = response.body[0];
      expect(group.admin).toHaveProperty('email');
      expect(Array.isArray(group.members)).toBe(true);
      expect(group.members[0]).toHaveProperty('email');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .get('/api/groups/user-groups')
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/groups/get-group
  // ──────────────────────────────────────────────
  describe('GET /api/groups/get-group', () => {
    it('should return group details for a valid groupId', async () => {
      const response = await request(app)
        .get('/api/groups/get-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test Group');
      expect(response.body).toHaveProperty('description', 'A test group');
      expect(response.body.admin).toHaveProperty('email');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get('/api/groups/get-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: fakeId })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .get('/api/groups/get-group')
        .send({ groupId: testGroup._id })
        .expect(401);
    });

    it('should populate admin and members fields', async () => {
      const response = await request(app)
        .get('/api/groups/get-group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id })
        .expect(200);

      expect(response.body.admin).toHaveProperty('email');
      expect(Array.isArray(response.body.members)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/groups/delete
  // ──────────────────────────────────────────────
  describe('DELETE /api/groups/delete', () => {
    it('should allow admin to delete their group', async () => {
      const response = await request(app)
        .delete('/api/groups/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Group deleted successfully');

      const deleted = await Group.findById(testGroup._id);
      expect(deleted).toBeNull();
    });

    it('should return 403 if non-admin tries to delete the group', async () => {
      // First join as user so they're authenticated group member
      await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: testGroup.inviteCode });

      const response = await request(app)
        .delete('/api/groups/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: testGroup._id })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Only admin can delete group');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete('/api/groups/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: fakeId })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .delete('/api/groups/delete')
        .send({ groupId: testGroup._id })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/groups/remove-member
  // ──────────────────────────────────────────────
  describe('POST /api/groups/remove-member', () => {
    beforeEach(async () => {
      // Add user as a member before each test
      await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: testGroup.inviteCode });
    });

    it('should allow admin to remove a member', async () => {
      const response = await request(app)
        .post('/api/groups/remove-member')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id, memberId: userId.toString() })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Member removed successfully');
      expect(response.body.group.members).not.toContain(userId.toString());
    });

    it('should return 403 if a non-admin tries to remove a member', async () => {
      const response = await request(app)
        .post('/api/groups/remove-member')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: testGroup._id, memberId: anotherUserId.toString() })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Only admin can remove members');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/groups/remove-member')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: fakeId, memberId: userId.toString() })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/groups/remove-member')
        .send({ groupId: testGroup._id, memberId: userId.toString() })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // PUT /api/groups/update
  // ──────────────────────────────────────────────
  describe('PUT /api/groups/update', () => {
    it('should allow admin to update group name', async () => {
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id, name: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Group updated successfully');
      expect(response.body.group.name).toBe('Updated Name');
    });

    it('should allow admin to update group description', async () => {
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id, description: 'New description' })
        .expect(200);

      expect(response.body.group.description).toBe('New description');
    });

    it('should allow admin to update maxMembers', async () => {
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id, maxMembers: 10 })
        .expect(200);

      expect(response.body.group.maxMembers).toBe(10);
    });

    it('should allow updating multiple fields at once', async () => {
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          groupId: testGroup._id,
          name: 'Multi Update',
          description: 'Updated desc',
          maxMembers: 8
        })
        .expect(200);

      expect(response.body.group.name).toBe('Multi Update');
      expect(response.body.group.description).toBe('Updated desc');
      expect(response.body.group.maxMembers).toBe(8);
    });

    it('should return 403 if a non-admin tries to update the group', async () => {
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: testGroup._id, name: 'Hacked Name' })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Only admin can update group');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: fakeId, name: 'Ghost Group' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .put('/api/groups/update')
        .send({ groupId: testGroup._id, name: 'Unauthorized' })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/groups/regenerate-invite
  // ──────────────────────────────────────────────
  describe('POST /api/groups/regenerate-invite', () => {
    it('should allow admin to regenerate the invite code', async () => {
      const originalCode = testGroup.inviteCode;

      const response = await request(app)
        .post('/api/groups/regenerate-invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Invite code regenerated');
      expect(response.body).toHaveProperty('inviteCode');
      expect(response.body.inviteCode).not.toBe(originalCode);
      expect(response.body.inviteCode).toHaveLength(8);
    });

    it('should make the old invite code invalid after regeneration', async () => {
      const originalCode = testGroup.inviteCode;

      await request(app)
        .post('/api/groups/regenerate-invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: testGroup._id });

      // Attempt to join with the old invite code
      const joinResponse = await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inviteCode: originalCode })
        .expect(404);

      expect(joinResponse.body).toHaveProperty('message', 'Group not found');
    });

    it('should return 403 if a non-admin tries to regenerate invite code', async () => {
      const response = await request(app)
        .post('/api/groups/regenerate-invite')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: testGroup._id })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Only admin can regenerate invite code');
    });

    it('should return 404 for a non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post('/api/groups/regenerate-invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupId: fakeId })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Group not found');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/groups/regenerate-invite')
        .send({ groupId: testGroup._id })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // Full Workflow
  // ──────────────────────────────────────────────
  describe('Full Group Lifecycle Workflow', () => {
    it('should complete a full group lifecycle', async () => {
      // 1. Create a group
      const createRes = await request(app)
        .post('/api/groups/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Lifecycle Group', maxMembers: 3 })
        .expect(201);

      const group = createRes.body;
      expect(group.members).toHaveLength(1);

      // 2. Another user joins
      await request(app)
        .post('/api/groups/join')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ inviteCode: group.inviteCode })
        .expect(200);

      // 3. Admin updates group info
      await request(app)
        .put('/api/groups/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: group._id, name: 'Updated Lifecycle Group' })
        .expect(200);

      // 4. Admin removes the other member
      await request(app)
        .post('/api/groups/remove-member')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: group._id, memberId: anotherUserId.toString() })
        .expect(200);

      // 5. Regenerate invite code
      const regenRes = await request(app)
        .post('/api/groups/regenerate-invite')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: group._id })
        .expect(200);
      expect(regenRes.body.inviteCode).not.toBe(group.inviteCode);

      // 6. Check user-groups includes this group
      const groupsRes = await request(app)
        .get('/api/groups/user-groups')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(groupsRes.body.some(g => g._id === group._id)).toBe(true);

      // 7. Admin deletes the group
      await request(app)
        .delete('/api/groups/delete')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ groupId: group._id })
        .expect(200);

      // 8. Verify group is gone
      const deleted = await Group.findById(group._id);
      expect(deleted).toBeNull();
    });
  });
});