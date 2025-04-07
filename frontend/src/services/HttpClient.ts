export const sendEchoRequest = async () => {
  try {
    const payload = { message: "Hello from HTTP Control Panel", timestamp: new Date().toISOString() };
    const res = await fetch('http://127.0.0.1:8000/frontend/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error sending echo request from HttpClient:', err);
    // Re-throw the error to be caught by the component
    throw new Error(err.message || 'Failed to send request from HttpClient. Is the backend server running?');
  }
}; 