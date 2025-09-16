// Reset DB using your Django test endpoint
export const resetDB = async (request) => {
    const response = await request.post('http://localhost:8000/api/tests/reset-db-DANGER/');
    if (!response.ok()) {
        throw new Error(`DB reset failed: ${response.status()} ${await response.text()}`);
    }
    console.log('✅ test database reset');
};