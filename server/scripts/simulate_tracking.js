const axios = require('axios');
const { io } = require('socket.io-client');

const PORT = process.env.PORT || 5001;
const API = `http://localhost:${PORT}`;
const SOCKET = `http://localhost:${PORT}`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const randomEmail = (name) => `${name}.${Date.now()}@example.com`;

async function main() {
  try {
    console.log('Registering users...');
    const reqUser = { name: 'requester_test', email: randomEmail('requester'), password: 'Password123' };
    const donorUser = { name: 'donor_test', email: randomEmail('donor'), password: 'Password123' };

    const r1 = await axios.post(`${API}/api/auth/register`, reqUser).catch(e => e.response);
    const r2 = await axios.post(`${API}/api/auth/register`, donorUser).catch(e => e.response);

    console.log('register responses:', { r1_status: r1 && r1.status, r2_status: r2 && r2.status });

    if (!r1 || !r1.data || !r2 || !r2.data) {
      console.error('Registration failed, responses:', r1 && r1.data, r2 && r2.data);
      process.exit(1);
    }

    const requesterToken = r1.data.token;
    const donorToken = r2.data.token;
    const requesterId = r1.data.user.id;
    const donorId = r2.data.user.id;

    console.log('Requester id:', requesterId);
    console.log('Donor id:', donorId);

    console.log('Creating blood request (requester -> donor)...');
    const br = await axios.post(`${API}/api/blood-requests`, {
      donorId,
      bloodGroup: 'A+',
      hospital: 'Test Hospital',
      contactNumber: '9999999999',
    }, { headers: { Authorization: `Bearer ${requesterToken}` } });

    const requestId = br.data.bloodRequest._id;
    console.log('Created blood request:', requestId);

    console.log('Donor accepting request (this should start tracking)...');
    const acceptRes = await axios.put(`${API}/api/blood-requests/${requestId}/accept`, {}, { headers: { Authorization: `Bearer ${donorToken}` } }).catch(e => e.response);
    console.log('Accept response status:', acceptRes.status);

    await wait(500);

    console.log('Checking debug tracking sessions...');
    const sessions = await axios.get(`${API}/api/debug/tracking-sessions`).then(r => r.data).catch(e => e.response && e.response.data);
    console.log('Sessions:', JSON.stringify(sessions, null, 2));

    console.log('Connecting requester socket...');
    const requesterSocket = io(SOCKET, { auth: { token: requesterToken }, transports: ['websocket', 'polling'] });
    requesterSocket.on('connect', () => {
      console.log('[requesterSocket] connected', requesterSocket.id);
      requesterSocket.emit('join_tracking', { requestId });
    });
    requesterSocket.on('donor_location_update', (data) => {
      console.log('[requesterSocket] received donor_location_update', data);
    });
    requesterSocket.on('user_presence', (d) => console.log('[requesterSocket] user_presence', d));

    console.log('Connecting donor socket...');
    const donorSocket = io(SOCKET, { auth: { token: donorToken }, transports: ['websocket', 'polling'] });
    donorSocket.on('connect', () => {
      console.log('[donorSocket] connected', donorSocket.id);
      donorSocket.emit('join_tracking', { requestId });
    });
    donorSocket.on('connect_error', (err) => console.log('[donorSocket] connect_error', err.message || err));

    // send periodic location updates from donor
    let count = 0;
    const interval = setInterval(() => {
      const lat = 28.6139 + (Math.random() - 0.5) * 0.01; // around Delhi
      const lng = 77.2090 + (Math.random() - 0.5) * 0.01;
      donorSocket.emit('donor_location_update', { requestId, latitude: lat, longitude: lng, accuracy: 5 });
      console.log('[donorSocket] emitted location', { lat, lng });
      count += 1;
      if (count > 6) {
        clearInterval(interval);
        // close sockets
        setTimeout(() => {
          donorSocket.disconnect();
          requesterSocket.disconnect();
          console.log('Finished simulation. Exiting.');
          process.exit(0);
        }, 1000);
      }
    }, 2000);

  } catch (err) {
    console.error('Simulation error', err.message || err);
    process.exit(1);
  }
}

main();
