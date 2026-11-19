// Creates only synthetic accounts on a loopback-only disposable test service.
// Run with DISPOSABLE_TEST_DATABASE=yes and BASE_URL=http://127.0.0.1:<port>.
const assert = require('node:assert/strict');
const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:18080');
if (process.env.DISPOSABLE_TEST_DATABASE !== 'yes' || base.hostname !== '127.0.0.1' || base.protocol !== 'http:') {
  throw new Error('This test requires explicit disposable-database opt-in and a loopback HTTP service');
}
let passed = 0;
const created = [];
async function call(method, route, token, body) {
  const response = await fetch(new URL(route, base), {
    method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { status:response.status, data };
}
async function expect(label, method, route, status, token, body, verify) {
  const result = await call(method, route, token, body);
  assert.equal(result.status, status, `${label}: unexpected HTTP status`);
  if (verify) assert.ok(verify(result.data), `${label}: response assertion failed`);
  console.log(`PASS ${label}`); passed++;
  return result.data;
}
(async () => {
  const suffix = `${Date.now()}${Math.floor(Math.random()*10000)}`;
  const phone = `9${suffix.slice(-9)}`;
  await expect('health', 'GET', '/actuator/health', 200, null, undefined, d=>d.status==='UP');
  await expect('authentication required', 'GET', '/users/me', 401);
  await expect('contractor OTP', 'POST', '/auth/send-otp', 200, null, {phone});
  const contractor = await expect('contractor signup', 'POST', '/auth/verify-otp', 200, null,
    {phone,otp:'123456',name:'Release Test Contractor',role:'CONTRACTOR',city:'Test City'}, d=>!!d.token);
  created.push(contractor.token);
  const ct = contractor.token;
  const worker = await expect('worker signup', 'POST', '/auth/dev-worker', 200, null,
    {email:`release-${suffix}@example.invalid`,name:'Release Test Worker'},d=>!!d.token);
  created.push(worker.token);
  const wt = worker.token;
  await expect('contractor profile', 'PUT', '/contractors/profile', 200, ct,
    {companyName:'Release Test Company',workType:'Mason',experienceYears:3});
  await expect('worker cannot create jobs', 'POST', '/jobs', 403, wt,
    {title:'Test',location:'Test City',salary:700,workersNeeded:1});
  await expect('worker profile', 'PUT', '/workers/me/profile', 200, wt,
    {name:'Release Test Worker',city:'Test City',phone:'',skills:'Mason',experienceYears:2,about:''});
  await expect('follow contractor', 'POST', `/follow/${contractor.userId}`, 200, wt, {});
  const job = await expect('create job', 'POST', '/jobs', 201, ct,
    {title:`Release test ${suffix}`,location:'Test City',salary:700,workersNeeded:1},d=>Number.isInteger(d.id));
  await expect('followed jobs feed', 'GET', '/jobs/feed', 200, wt, undefined, d=>d.content.some(j=>j.id===job.id));
  await expect('apply', 'POST', `/jobs/${job.id}/apply`, 201, wt, {});
  await expect('duplicate apply rejected', 'POST', `/jobs/${job.id}/apply`, 409, wt, {});
  const applicants = await expect('applicant visible to owner', 'GET', `/jobs/${job.id}/applicants`, 200, ct,
    undefined,d=>(Array.isArray(d)?d:d.content).some(a=>a.userId===worker.userId));
  const applicant=(Array.isArray(applicants)?applicants:applicants.content).find(a=>a.userId===worker.userId);
  await expect('accept application','PUT',`/applications/${applicant.applicationId}/status`,200,ct,{status:'ACCEPTED'});
  await expect('worker cannot view applicants','GET',`/jobs/${job.id}/applicants`,403,wt);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}), month=today.slice(0,7);
  await expect('wage settings','PUT','/attendance/settings',200,wt,{dailyWage:700,overtimeRate:100});
  await expect('attendance','PUT',`/attendance/${today}`,200,wt,{status:'PRESENT',overtimeHours:2,note:'Synthetic test'});
  await expect('payment','POST','/attendance/payments',201,wt,{date:today,amount:500,note:'Synthetic test'});
  await expect('balance calculation','GET',`/attendance/summary?month=${month}`,200,wt,undefined,d=>d.totalAmount===900&&d.balance===400);
  await expect('private diary rejects contractor','GET',`/attendance?month=${month}`,403,ct);
  await expect('register device','PUT','/users/me/fcm-token',200,wt,{token:`synthetic-${suffix}`});
  await expect('clear device on logout','DELETE','/users/me/fcm-token',204,wt);
  await expect('delete synthetic worker','DELETE','/users/me',204,wt);
  created.splice(created.indexOf(wt),1);
  await expect('deleted account token rejected','GET','/jobs',401,wt);
  await expect('delete synthetic contractor','DELETE','/users/me',204,ct);
  created.splice(created.indexOf(ct),1);
  console.log(`RESULT ${passed} integration checks passed`);
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{
  // Only accounts created by this process are eligible for cleanup.
  for(const token of created) await call('DELETE','/users/me',token).catch(()=>undefined);
});
