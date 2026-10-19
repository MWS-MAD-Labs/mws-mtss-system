// The headers of a call to Central. The Organization ID from the .env goes with the token, so Central can show whether
// it is the one it made for this application.
function centralHeaders(token) {
    const organization = (process.env.CENTRAL_ORGANIZATION_ID || '').trim();
    return {
        Authorization: `Bearer ${token}`,
        ...(organization ? { 'X-Central-Organization-Id': organization } : {}),
    };
}

module.exports = { centralHeaders };
