// src/services/api.ts
// API client for KnowFlow backend at http://localhost:8000

// Use relative path - handling is done by Vite Proxy (Dev) or Nginx (Prod)
const API_BASE = '/api/v1';

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export async function request<T>(
    method: string,
    endpoint: string,
    body?: any
): Promise<ApiResponse<T>> {
    try {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { data: null, error: errorData.detail || `Error: ${response.status}` };
        }
        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err.message : 'Network error' };
    }
}

// ==================== PROCESSES ====================

export interface Process {
    id: string;
    name: string;
    description: string;
    department: string;
    status: string;
    current_graph_version: number;
    created_at: string;
    updated_at: string;
}

export interface CreateProcessRequest {
    name: string;
    description?: string;
    department?: string;
}

export const processesApi = {
    list: () => request<Process[]>('GET', '/processes'),
    get: (id: string) => request<Process>('GET', `/processes/${id}`),
    create: (data: CreateProcessRequest) => request<Process>('POST', '/processes', data),
    update: (id: string, data: Partial<CreateProcessRequest>) =>
        request<Process>('PATCH', `/processes/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/processes/${id}`),
};

// ==================== SESSIONS ====================

export interface Session {
    id: string;
    process_id: string;
    phase: string;
    questions_asked: number;
    responses_received: number;
    entities_extracted: number;
    status: string;
    started_at: string;
}

export interface Question {
    id: string;
    text: string;
    question_type: string;
    target_entity_type: string | null;
    context: string | null;
    options: string[] | null;
}

export interface KnowledgeState {
    total_entities: number;
    entities_by_type: Record<string, number>;
    knowledge_gaps: string[];
    confidence_distribution: {
        high: number;
        medium: number;
        low: number;
        unverified: number;
    };
    recent_extractions: any[];
}

export interface ExtractionResult {
    entities_extracted: number;
    relations_extracted: number;
    entities: any[];
    relations: any[];
}

export const sessionsApi = {
    start: (processId: string) =>
        request<Session>('POST', `/sessions/${processId}/sessions`, {}),
    get: (sessionId: string) =>
        request<Session>('GET', `/sessions/${sessionId}`),
    getNextQuestion: (sessionId: string) =>
        request<Question>('GET', `/sessions/${sessionId}/next-question`),
    submitResponse: (sessionId: string, questionId: string, responseText: string) =>
        request<ExtractionResult>('POST', `/sessions/${sessionId}/responses`, {
            response_text: responseText,
        }),
    getKnowledgeState: (sessionId: string) =>
        request<KnowledgeState>('GET', `/sessions/${sessionId}/knowledge-state`),
    end: (sessionId: string) =>
        request<{ message: string; graph_version: number }>('POST', `/sessions/${sessionId}/end`),
};

// ==================== GRAPH ====================

export interface GraphNode {
    id: string;
    type: string;
    label: string;
    data: {
        description: string;
        confidence: number;
        attributes: Record<string, any>;
    };
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    label: string;
    data: {
        conditions: string[];
    };
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    meta: {
        version: number;
        nodeCount: number;
        edgeCount: number;
    };
}

export interface GraphVersion {
    version: number;
    created_at: string;
    description: string;
}

export interface GraphAnalysis {
    roots: string[];
    leaves: string[];
    total_nodes: number;
    total_edges: number;
    centrality: Record<string, number>;
}

export interface GraphDiff {
    version_from: number;
    version_to: number;
    nodes_added: string[];
    nodes_removed: string[];
    edges_added: string[];
    edges_removed: string[];
}

export const graphApi = {
    get: (processId: string) =>
        request<GraphData>('GET', `/processes/${processId}/graph`),
    getVersions: (processId: string) =>
        request<GraphVersion[]>('GET', `/processes/${processId}/graph/versions`),
    createSnapshot: (processId: string, description: string) =>
        request<{ version: number }>('POST', `/processes/${processId}/graph/snapshot`, { description }),
    getDiff: (processId: string, versionFrom: number, versionTo: number) =>
        request<GraphDiff>('GET', `/processes/${processId}/graph/diff?version_from=${versionFrom}&version_to=${versionTo}`),
    getAnalysis: (processId: string) =>
        request<GraphAnalysis>('GET', `/processes/${processId}/graph/analysis`),
};

// ==================== SOP ====================

export interface SOPStep {
    step_number: number;
    title: string;
    description: string;
    responsible_role: string | null;
    is_decision_point: boolean;
    branches: Record<string, number> | null;
    notes: string[];
    source_node_ids: string[];
}

export interface SOPVersion {
    id: string;
    process_id: string;
    version: number;
    title: string;
    purpose: string;
    scope: string;
    steps: SOPStep[];
    roles_involved: string[];
    coverage_score: number;
    confidence_score: number;
    generated_at: string;
    markdown?: string;
}

export const sopApi = {
    generate: (processId: string, options?: { include_exceptions?: boolean; detail_level?: string }) =>
        request<SOPVersion>('POST', `/processes/${processId}/sop/generate`, options || {}),
    getLatest: (processId: string) =>
        request<SOPVersion & { markdown: string }>('GET', `/processes/${processId}/sop/latest`),
    getVersions: (processId: string) =>
        request<SOPVersion[]>('GET', `/processes/${processId}/sop/versions`),
};

// ==================== RISKS ====================

export interface RiskFinding {
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    explanation: string;
    recommendation: string;
    affected_node_ids: string[];
    effort_estimate: string;
    is_acknowledged: boolean;
    is_resolved: boolean;
    created_at: string;
}

export interface RiskAnalysisResult {
    process_id: string;
    total_risks: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    findings: RiskFinding[];
}

export const risksApi = {
    analyze: (processId: string, options?: { categories?: string[]; min_severity?: string }) =>
        request<RiskAnalysisResult>('POST', `/processes/${processId}/risks/analyze`, options || {}),
    get: (processId: string) =>
        request<RiskFinding[]>('GET', `/processes/${processId}/risks`),
    acknowledge: (processId: string, riskId: string) =>
        request<RiskFinding>('PATCH', `/processes/${processId}/risks/${riskId}/acknowledge`),
    resolve: (processId: string, riskId: string, resolution_notes: string) =>
        request<RiskFinding>('PATCH', `/processes/${processId}/risks/${riskId}/resolve`, { resolution_notes }),
};

// ==================== HEALTH ====================

export const healthApi = {
    check: () => request<{ status: string }>('GET', '/../health'),
};
