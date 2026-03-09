const test = async () => {
  console.log('--- Testing Account Verification API ---');
  
  const verifyData = {
    role: 'ADMIN',
    identifier: ' 1 ', // testing with spaces
    contactNumber: '03000000000'
  };

  try {
    const res = await fetch('http://localhost:3000/api/auth/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyData)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok && data.userId === 1) {
      console.log('SUCCESS: Admin verification works with trimmed ID!');
    } else {
      console.log('FAILURE: Verification failed.');
    }

    console.log('\n--- Testing Identification by Name ---');
    const nameMatchData = {
      role: 'ADMIN',
      identifier: 'System Admin',
      contactNumber: '03000000000'
    };

    const resName = await fetch('http://localhost:3000/api/auth/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nameMatchData)
    });

    const dataName = await resName.json();
    console.log('Status:', resName.status);
    console.log('Response:', JSON.stringify(dataName, null, 2));

    if (resName.ok && dataName.userId === 1) {
      console.log('SUCCESS: Admin verification works with Name match!');
    } else {
      console.log('FAILURE: Name verification failed.');
    }

  } catch (err) {
    console.error('Test error:', err.message);
  }
};

test();
