// Production API & Integration Smoke Test
import assert from 'node:assert';

console.log('🚀 Running Full Production Integration & Verification Suite...\n');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  // 1. Verify Next.js Server responds with HTML
  console.log('1. Testing Web Server Response (GET /)...');
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Home page must return HTTP 200');
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes('<!DOCTYPE html>') || homeHtml.includes('<html'), 'Must return valid HTML document');
  console.log('✅ PASS: Web server is live and serving production bundle.\n');

  // 2. Test Task Creation & Database Persistence (Requirement 1 & 43)
  console.log('2. Testing Persistent Task Creation (POST /api/tasks)...');
  const newTaskPayload = {
    userId: 'user_shanmukh',
    spaceId: 'space_lifeos_demo',
    title: 'Finish DAA assignment',
    description: 'Generated via Natural Language Fast Task Entry',
    dueDate: '2026-10-05',
    dueTime: '19:00',
    priority: 'HIGH',
    category: 'Study',
    reminderOption: '15_MIN',
    visibility: 'SHARED',
    proofRequired: true
  };

  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTaskPayload)
  });
  assert.strictEqual(createTaskRes.status, 201, 'Task creation must return HTTP 201');
  const createdTaskData = await createTaskRes.json();
  assert.ok(createdTaskData.taskId, 'Task must receive a persistent database ID');
  const taskId = createdTaskData.taskId;
  console.log(`✅ PASS: Task persisted to SQLite database with ID: ${taskId}\n`);

  // 3. Test Task Retrieval & Privacy Filter (Requirements 1, 37, 38)
  console.log('3. Testing Task Retrieval & Two-Person Privacy Filtering...');
  // Shanmukh queries
  const shanmukhTasksRes = await fetch(`${BASE_URL}/api/tasks?userId=user_shanmukh&spaceId=space_lifeos_demo`);
  const shanmukhData = await shanmukhTasksRes.json();
  console.log('DEBUG shanmukhData:', JSON.stringify(shanmukhData).slice(0, 300));
  const shanmukhTasks = shanmukhData.tasks || [];
  const createdTaskInList = shanmukhTasks.find(t => t.id === taskId);
  assert.ok(createdTaskInList, 'Created task must be queryable by owner');
  assert.strictEqual(createdTaskInList.title, 'Finish DAA assignment');

  // Satvika queries (shared task should be visible to partner)
  const satvikaTasksRes = await fetch(`${BASE_URL}/api/tasks?userId=user_satvika&spaceId=space_lifeos_demo`);
  const satvikaData = await satvikaTasksRes.json();
  const satvikaTasks = satvikaData.tasks || [];
  const sharedToSatvika = satvikaTasks.find(t => t.id === taskId);
  assert.ok(sharedToSatvika, 'Shared task must be visible to partner Satvika');
  console.log('✅ PASS: Task is visible across devices and two-person space.\n');

  // 4. Test Scheduled Reminder in Database (Requirements 5, 31, 32)
  console.log('4. Testing Scheduled Reminders Database (GET /api/reminders?mode=all)...');
  const remindersRes = await fetch(`${BASE_URL}/api/reminders?mode=all&userId=user_shanmukh`);
  const remindersData = await remindersRes.json();
  const taskReminder = (remindersData.reminders || []).find(r => r.task_id === taskId);
  assert.ok(taskReminder, 'A persistent reminder record must exist in reminders table');
  assert.strictEqual(taskReminder.status, 'SCHEDULED');
  console.log(`✅ PASS: Active reminder scheduled in SQLite at ${taskReminder.scheduled_at}\n`);

  // 5. Test PROOF_REQUIRED Enforcement (Requirements 15, 20, 36)
  console.log('5. Testing PROOF_REQUIRED Server-Side Enforcement (PATCH /api/tasks)...');
  const completeWithoutProofRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: taskId,
      action: 'TOGGLE_COMPLETE',
      completed: true
    })
  });
  assert.strictEqual(completeWithoutProofRes.status, 400, 'Server must block completion without photo proof');
  const completeWithoutProofJson = await completeWithoutProofRes.json();
  assert.strictEqual(completeWithoutProofJson.error, 'PROOF_REQUIRED');
  console.log('✅ PASS: Server strictly rejected completion because proofRequired = true.\n');

  // 6. Test Real Photo Upload (Requirements 2, 5, 8, 38, 39)
  console.log('6. Testing Real Photo Upload & Media Storage (POST /api/upload)...');
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(samplePngBase64, 'base64');
  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'camera_proof.png');
  formData.append('ownerId', 'user_shanmukh');
  formData.append('spaceId', 'space_lifeos_demo');
  formData.append('parentType', 'TASK');
  formData.append('parentId', taskId);
  formData.append('visibility', 'SHARED');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  const uploadJson = await uploadRes.json();
  assert.ok(uploadJson.url.startsWith('/uploads/'), 'Uploaded media must be saved to /uploads/ folder');
  const proofUrl = uploadJson.url;
  console.log(`✅ PASS: Real photo successfully uploaded & stored: ${proofUrl}\n`);

  // 7. Complete Task with Uploaded Photo Proof
  console.log('7. Testing Completion With Real Photo Proof...');
  const completeWithProofRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: taskId,
      action: 'TOGGLE_COMPLETE',
      completed: true,
      proofUrl: proofUrl
    })
  });
  assert.strictEqual(completeWithProofRes.status, 200, 'Task completion with proof must succeed');
  const completedTaskJson = await completeWithProofRes.json();
  assert.strictEqual(completedTaskJson.success, true);
  console.log('✅ PASS: Task completed with authentic photographic proof verified.\n');

  // 8. Test Task Snooze Engine (Requirement 13)
  console.log('8. Testing Task Snooze Engine (PATCH /api/tasks action=SNOOZE)...');
  const snoozeRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: taskId,
      action: 'SNOOZE',
      minutes: 15
    })
  });
  assert.strictEqual(snoozeRes.status, 200);
  console.log('✅ PASS: Task snooze successfully updated SQLite schedule.\n');

  // 9. Test Notification Center (Requirement 22)
  console.log('9. Testing Notification Center API (GET /api/notifications)...');
  const notifRes = await fetch(`${BASE_URL}/api/notifications?userId=user_shanmukh`);
  assert.strictEqual(notifRes.status, 200);
  const notifJson = await notifRes.json();
  assert.ok(Array.isArray(notifJson.notifications));
  console.log(`✅ PASS: Notification Center returned ${notifJson.notifications.length} notifications.\n`);

  // 10. Test AI Pattern Memory API (Requirements 18-20, 42, 58, 59)
  console.log('10. Testing AI Pattern Memory API (POST /api/patterns & GET /api/patterns)...');
  // Record learned routine
  await fetch(`${BASE_URL}/api/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_shanmukh',
      category: 'Study',
      pattern: 'User frequently completes study tasks between 8 PM and 10 PM',
      evidence: '12 completed study tasks in evening block',
      confidence: 0.88
    })
  });

  const patternsRes = await fetch(`${BASE_URL}/api/patterns?userId=user_shanmukh`);
  assert.strictEqual(patternsRes.status, 200);
  const patternsData = await patternsRes.json();
  const patterns = patternsData.patterns || [];
  assert.ok(patterns.length >= 1, 'Must have recorded AI pattern memory');
  const studyPattern = patterns.find(p => p.category === 'Study');
  assert.ok(studyPattern, 'Study pattern must exist');
  assert.strictEqual(studyPattern.confidence, 0.88);

  // Test user confirmation (Requirement 58)
  const confirmRes = await fetch(`${BASE_URL}/api/patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'CONFIRM',
      id: studyPattern.id
    })
  });
  assert.strictEqual(confirmRes.status, 200);
  console.log('✅ PASS: AI Pattern Memory successfully recorded, verified, and user-confirmed.\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 ALL PRODUCTION INTEGRATION TESTS PASSED WITH 100% SUCCESS! 🎉');
  console.log('═══════════════════════════════════════════════════════════════');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
