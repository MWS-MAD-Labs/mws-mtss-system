const fs = require('fs');
const path = require('path');

// MTSS makes no roles or access of its own: a person may do what Central gave them (permissions) and nothing else.
// `user.role` is only a wording label (utils/actorKind.js) for the assistant and for logs. These are the only files
// that read it, none of them to decide who may do something. A new file reading it fails this test.
const WORDING_ONLY = new Set([
    'controllers/aiChatController.js',
    'controllers/devTopologyController.js',
    'controllers/mtssPilotFeedbackController.js',
    'middleware/auth.js',
    'modules/ai-assistant/application/twinWorkspace.service.js',
    'modules/ai-assistant/infrastructure/repositories/readModel.repository.js',
    'services/aiChatService.js',
    'services/devTopologyTelemetryService.js',
]);

const SRC = path.join(__dirname, '../../src');
const READS_ROLE = /\b(user|viewer|actor|currentUser|req\.user)\??\.role\b/;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
});

describe('Central is the only source of access', () => {
    test('only wording code reads the role label', () => {
        const readers = walk(SRC)
            .filter((file) => READS_ROLE.test(fs.readFileSync(file, 'utf8')))
            .map((file) => path.relative(SRC, file).split(path.sep).join('/'))
            .filter((file) => !WORDING_ONLY.has(file));
        expect(readers).toEqual([]);
    });

    test('the assistant decides what a person may do from permissions, not from the label', () => {
        const source = fs.readFileSync(path.join(SRC, 'services/aiChatService.js'), 'utf8');
        expect(source).not.toMatch(/isMtssAdminRole|isMtssAutomationRole|mtssAutomationRoleSet/);
    });

    test('no stored role or access is kept on the person besides what Central sent', () => {
        const person = fs.readFileSync(path.join(SRC, 'models/Person.js'), 'utf8');
        // Top-level fields only: classes[].role is the class role Central sent (Homeroom Teacher and so on).
        expect(person).not.toMatch(/^ {4}(role|permissions|isAdmin|accessLevel)\s*:/m);
    });
});
