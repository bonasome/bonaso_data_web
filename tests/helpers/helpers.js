// Reset DB using your Django test endpoint
export const resetDB = async (request) => {
    //pass request from test
    const response = await request.post('http://localhost:8000/api/tests/reset-db-DANGER/'); //call endpoint that handles the backend
    if (!response.ok()) {
        throw new Error(`DB reset failed: ${response.status()} ${await response.text()}`);
    }
    console.log('✅ test database reset');
};