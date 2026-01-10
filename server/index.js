const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_init',
});

// --- IN-MEMORY DATABASE (Volatile for Prototype Validation) ---
// In a real production system, these would be PostgreSQL/Redis tables.
const db = {
    sessions: new Map(),           // sessionId -> { id, status, created_at, context_buffer }
    stakeholders: [],              // Global list of available stakeholders
    sessionStakeholders: new Map(), // sessionId -> [Stakeholder Objects]
    extractionResults: new Map(),   // sessionId -> { decisions, workflows, risks }
    processGraphs: new Map(),       // sessionId -> { nodes: [], edges: [] }
    riskAssessments: new Map(),     // sessionId -> [RiskItem]
    artifacts: new Map()           // sessionId -> { type, url, created_at }
};

// Seed some initial data for 'resume' testing
const DEMO_SESSION_ID = 'sess_demo_123';
db.sessions.set(DEMO_SESSION_ID, {
    id: DEMO_SESSION_ID,
    status: 'active',
    created_at: new Date().toISOString(),
    start_user: 'User_Admin'
});
db.stakeholders.push(
    { id: 'sh_1', name: 'Robert Chen', role: 'Compliance Officer', department: 'Legal' },
    { id: 'sh_2', name: 'Sarah Jones', role: 'Loan Approver', department: 'Finance' }
);
db.sessionStakeholders.set(DEMO_SESSION_ID, [db.stakeholders[0], db.stakeholders[1]]);

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'KnowFlow Backend is running', timestamp: new Date() });
});

// 1. BUTTON: Start Process Capture
// Intent: Initiate a new knowledge extraction session.
app.post('/api/sessions/start', (req, res) => {
    try {
        const sessionId = `sess_${crypto.randomUUID().split('-')[0]}`;
        const newSession = {
            id: sessionId,
            status: 'active',
            created_at: new Date().toISOString(),
            context_buffer: [] // Placeholder for vector store ref
        };

        db.sessions.set(sessionId, newSession);

        // Initialize empty containers for this session
        db.sessionStakeholders.set(sessionId, []);
        db.processGraphs.set(sessionId, { nodes: [], edges: [] });

        console.log(`[SessionManager] Started new session: ${sessionId}`);

        res.status(201).json({
            sessionId: sessionId,
            status: 'active',
            websocketUrl: `ws://localhost:${PORT}/ws/sessions/${sessionId}`, // Mock WS
            message: 'Session initialized. Ready for ingestion.'
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// 2. BUTTON: Resume Session
// Intent: Continue a previously paused workflow.
app.get('/api/sessions/:sessionId/resume', (req, res) => {
    const { sessionId } = req.params;
    const session = db.sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // Simulate context rehydration
    const lastSummary = "User was describing the initial intake phase of the loan application process.";
    const stakeholders = db.sessionStakeholders.get(sessionId) || [];

    console.log(`[StateManager] Resuming session: ${sessionId}`);

    res.json({
        session: session,
        contextSummary: lastSummary,
        activeStakeholders: stakeholders,
        lastCheckpoint: new Date().toISOString(),
        connectionToken: 'tok_resume_abc123'
    });
});

// 3. BUTTON: Add Role / Stakeholder
// Intent: Define who is involved in the process.
app.post('/api/sessions/:sessionId/stakeholders', (req, res) => {
    const { sessionId } = req.params;
    const { name, role_title, department } = req.body;

    if (!db.sessions.has(sessionId)) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // "Entity Resolution" Logic (Mock)
    const newStakeholder = {
        id: `sh_${Date.now()}`,
        name,
        role: role_title,
        department: department || 'Unassigned'
    };

    // Store in session context
    const currentList = db.sessionStakeholders.get(sessionId) || [];
    currentList.push(newStakeholder);
    db.sessionStakeholders.set(sessionId, currentList);

    console.log(`[EntityRegistry] Added stakeholder to ${sessionId}: ${name}`);

    res.status(201).json({
        message: 'Stakeholder added successfully',
        stakeholder: newStakeholder,
        totalStakeholders: currentList.length
    });
});

// 4. BUTTON: Review Extracted Knowledge
// Intent: Validate raw facts extracted from transcript.
app.get('/api/sessions/:sessionId/extraction-results', async (req, res) => {
    const { sessionId } = req.params;

    // Check if we have cached results
    if (db.extractionResults.has(sessionId)) {
        return res.json(db.extractionResults.get(sessionId));
    }

    // Mock Extraction Logic (or use OpenAI if text handled)
    // We'll return a structured "Draft" for the user to review.
    const mockExtraction = {
        decisions: [
            { id: 1, text: "Loans under $10k require auto-approval", confidence: 0.95 },
            { id: 2, text: "Escalate to Level 2 if credit score < 600", confidence: 0.82 }
        ],
        workflows: [
            { id: 1, step: "Receive Application", actor: "System" },
            { id: 2, step: "Verify Identity", actor: "Compliance Officer" }
        ],
        risks: [
            { id: 1, text: "Wait time > 24h causes fallback", confidence: 0.6 } // Low confidence, needs review
        ]
    };

    db.extractionResults.set(sessionId, mockExtraction);
    console.log(`[KnowledgeEngine] served extraction results for ${sessionId}`);

    res.json(mockExtraction);
});

// 5. BUTTON: View Process Graph
// Intent: Visualize workflow nodes and edges.
app.get('/api/sessions/:sessionId/graph', (req, res) => {
    const { sessionId } = req.params;

    // Simulate Graph Generation based on workflows
    // Logic Gap Detection: The AI would ensure "Yes/No" branches exist.
    const graphTopology = {
        nodes: [
            { id: 'n1', type: 'start', label: 'Start Application' },
            { id: 'n2', type: 'process', label: 'Identity Check', assignee: 'Compliance Officer' },
            { id: 'n3', type: 'decision', label: 'Score > 600?' },
            { id: 'n4', type: 'process', label: 'Auto-Approve', assignee: 'System' },
            { id: 'n5', type: 'process', label: 'Manual Review', assignee: 'Loan Officer' }
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
            { id: 'e3', source: 'n3', target: 'n4', label: 'Yes' },
            { id: 'e4', source: 'n3', target: 'n5', label: 'No' }
        ],
        meta: {
            cyclic: false,
            orphanNodes: 0
        }
    };

    db.processGraphs.set(sessionId, graphTopology);
    console.log(`[GraphBuilder] Generated graph for ${sessionId}`);

    res.json(graphTopology);
});

// 6. BUTTON: Generate SOP
// Intent: Create formal documentation.
app.post('/api/sessions/:sessionId/generate-sop', async (req, res) => {
    const { sessionId } = req.params;

    // Simulate Async Generation
    console.log(`[DocGenerator] Starting synthesis for ${sessionId}...`);

    // In a real app, we might use OpenAI to draft the text here.
    // const completion = await openai.chat.completions.create({...})

    const docUrl = `/artifacts/${sessionId}/SOP_v1.pdf`; // Mock path

    // Store artifact record
    db.artifacts.set(sessionId, {
        type: 'SOP',
        url: docUrl,
        generated_at: new Date().toISOString()
    });

    res.json({
        status: 'completed',
        documentUrl: docUrl,
        message: 'Standard Operating Procedure (SOP) generated successfully.'
    });
});

// 7. BUTTON: Run Risk Analysis
// Intent: Identify compliance gaps.
app.post('/api/sessions/:sessionId/risk-analysis', (req, res) => {
    const { sessionId } = req.params;

    // Run rule-based + AI analysis
    const risks = [
        {
            id: 'risk_01',
            severity: 'HIGH',
            title: 'Segregation of Duties Violation',
            description: 'The "Loan Officer" role can both Initiate and Approve the same loan (Node n5).',
            location: 'n5'
        },
        {
            id: 'risk_02',
            severity: 'MEDIUM',
            title: 'Data Privacy',
            description: 'SSN is passed in plain text during "Identity Check".',
            location: 'n2'
        }
    ];

    db.riskAssessments.set(sessionId, risks);
    console.log(`[ComplianceEngine] Found ${risks.length} risks for ${sessionId}`);

    res.json({
        riskCount: risks.length,
        assessments: risks
    });
});

// 8. BUTTON: Export (Audit / Compliance)
// Intent: Download audit package.
app.post('/api/sessions/:sessionId/export', (req, res) => {
    const { sessionId } = req.params;

    // Log the audit event
    console.log(`[Archiver] Export requested for ${sessionId} by ${req.ip}`);

    // Generate mock signed URL
    const signedUrl = `https://knowflow-exports.s3.amazonaws.com/${sessionId}/audit_pkg_2024.zip?signature=xyz`;

    res.json({
        exportUrl: signedUrl,
        expiresIn: '15m',
        contents: [
            'SOP.pdf',
            'ProcessGraph.json',
            'RiskReport.csv',
            'AuditLog.txt'
        ]
    });
});


// LEGACY / GENERIC ANALYZE (Kept for backward compatibility if needed)
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text input is required' });

        if (!process.env.OPENAI_API_KEY) {
            console.warn('No OpenAI API Key found. Returning mock data.');
            await new Promise(resolve => setTimeout(resolve, 1500));
            return res.json({
                decisions: ['Prioritize mobile-first approach (Mock)'],
                workflows: ['Update sprint planning (Mock)'],
                risks: ['Tight timeline (Mock)']
            });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Analyze the provided text and extract 'decisions', 'workflows', and 'risks' as JSON."
                },
                { role: "user", content: text }
            ],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
        });

        res.json(JSON.parse(completion.choices[0].message.content));

    } catch (error) {
        console.error('Error in /api/analyze:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[System] Initialized with 8 validation endpoints.`);
});
