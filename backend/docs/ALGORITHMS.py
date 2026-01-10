"""
KnowFlow Core Algorithms - Pseudocode Documentation

This module documents the core algorithms in pseudocode format for
architectural review and design validation.
"""

# =============================================================================
# ADAPTIVE QUESTIONING ALGORITHM
# =============================================================================

ADAPTIVE_QUESTIONING_PSEUDOCODE = """
ALGORITHM: AdaptiveQuestionGeneration

INPUT:
  - session_state: Current session with extracted entities, questions asked, responses
  - process_context: Name and description of process being documented

OUTPUT:
  - next_question: Targeted question with intent and priority

PROCEDURE:

1. EVALUATE_PHASE_TRANSITION(session_state)
   IF phase == ONBOARDING AND entities_count >= 3 AND questions_asked >= 4:
       transition to DEEP_DIVE
   ELSE IF phase == DEEP_DIVE AND low_confidence_count >= 3:
       transition to CLARIFICATION
   ELSE IF phase == DEEP_DIVE AND entities_count >= 10 AND questions_asked >= 15:
       transition to VALIDATION
   ELSE IF phase == CLARIFICATION AND low_confidence_count < 2:
       transition to VALIDATION

2. IDENTIFY_KNOWLEDGE_GAPS(session_state)
   gaps = []
   IF has_tasks AND NOT has_roles:
       gaps.append("No task owners defined")
   FOR each decision in entities:
       IF decision.conditions is empty:
           gaps.append(f"Decision '{decision.name}' needs conditions")
   IF has_tasks AND NOT has_triggers:
       gaps.append("No process entry point defined")
   IF has_tasks AND NOT has_artifacts:
       gaps.append("No outputs defined")
   FOR each entity where confidence < 0.6:
       gaps.append(f"Clarify: {entity.name}")
   RETURN gaps

3. GENERATE_QUESTION(phase, gaps, context)
   IF phase == ONBOARDING:
       USE template questions for overview, actors, triggers
   ELSE IF phase == DEEP_DIVE:
       CALL AI with:
         - Current knowledge summary
         - Identified gaps
         - Previous questions (to avoid repetition)
         - Last response (for context)
       VALIDATE AI output against QuestionSchema
   ELSE IF phase == CLARIFICATION:
       TARGET specific low-confidence entity
       ASK for explicit confirmation or details
   ELSE IF phase == VALIDATION:
       SUMMARIZE extracted knowledge
       ASK for confirmation or missing items

4. ASSIGN_PRIORITY(question, gaps)
   base_priority = 0.5
   IF question.addresses_critical_gap:
       priority += 0.3
   IF question.is_followup:
       priority += 0.1  # Maintain conversation flow
   IF phase == CLARIFICATION:
       priority += 0.2  # Urgent to resolve ambiguity
   RETURN clamp(priority, 0, 1)

5. RETURN Question(
     text=generated_text,
     intent=identified_intent,
     target_entity_type=inferred_type,
     priority=calculated_priority,
     is_followup=context_based_flag
   )
"""


# =============================================================================
# KNOWLEDGE EXTRACTION PIPELINE
# =============================================================================

EXTRACTION_PIPELINE_PSEUDOCODE = """
ALGORITHM: KnowledgeExtractionPipeline

INPUT:
  - response: User's raw text response
  - process_id: UUID of the process
  - context: Summary of what's been extracted so far

OUTPUT:
  - entities: List of validated KnowledgeEntity objects
  - edges: List of validated GraphEdge objects

PROCEDURE:

1. CALL_AI_EXTRACTION(response.text, context)
   prompt = BUILD_EXTRACTION_PROMPT(
     system_rules=EXTRACTION_RULES,
     context=context,
     response=response.text
   )
   
   raw_output = gemini.generate(prompt, output_format=JSON)
   
   TRY:
       parsed = json.parse(raw_output)
       result = ExtractionResult.validate(parsed)
   CATCH JSONError OR ValidationError:
       RETURN empty_result with error logged

2. PROCESS_ENTITIES(result.entities, process_id)
   validated_entities = []
   entity_lookup = {}  # name -> id for deduplication
   
   FOR each extracted in result.entities:
       // Validate entity type
       IF extracted.entity_type NOT IN valid_types:
           CONTINUE
       
       // Normalize name
       normalized_name = normalize(extracted.name)
       
       // Check for duplicates
       IF normalized_name.lower() IN entity_lookup:
           // Merge: keep higher confidence version
           existing_id = entity_lookup[normalized_name.lower()]
           IF extracted.confidence > existing.confidence:
               UPDATE existing entity
           CONTINUE
       
       // Create new entity
       entity = KnowledgeEntity(
           id=new_uuid(),
           process_id=process_id,
           entity_type=parsed_type,
           name=normalized_name,
           confidence=score_to_level(extracted.confidence),
           confidence_score=extracted.confidence,
           source_response_ids=[response.id],
           attributes=extracted.attributes
       )
       
       validated_entities.append(entity)
       entity_lookup[normalized_name.lower()] = entity.id
   
   RETURN validated_entities, entity_lookup

3. RESOLVE_RELATIONS(result.relations, entity_lookup)
   validated_edges = []
   
   FOR each relation in result.relations:
       source_key = relation.source_entity.lower()
       target_key = relation.target_entity.lower()
       
       IF source_key NOT IN entity_lookup:
           CONTINUE  // Can't create edge without source
       IF target_key NOT IN entity_lookup:
           CONTINUE  // Can't create edge without target
       
       // Validate relation type
       IF relation.relation_type NOT IN valid_relation_types:
           CONTINUE
       
       edge = GraphEdge(
           id=new_uuid(),
           source_node_id=entity_lookup[source_key],
           target_node_id=entity_lookup[target_key],
           relation_type=parsed_type,
           label=relation.label,
           conditions=relation.conditions,
           confidence=score_to_level(relation.confidence)
       )
       
       validated_edges.append(edge)
   
   RETURN validated_edges

4. UPDATE_GRAPH(process_id, entities, edges)
   graph = graph_store.get(process_id)
   
   FOR entity in entities:
       graph.add_entity(entity)
   
   FOR edge in edges:
       graph.add_edge(edge)

5. ASSESS_RESPONSE_QUALITY(entities, result.ambiguities)
   clarity = len(entities) / 3  // Expect ~3 entities per response
   completeness = avg(e.confidence_score for e in entities)
   needs_clarification = len(result.ambiguities) > 0
   
   RETURN QualityMetrics(clarity, completeness, needs_clarification)
"""


# =============================================================================
# RISK DETECTION ALGORITHMS
# =============================================================================

RISK_DETECTION_PSEUDOCODE = """
ALGORITHM: ProcessRiskDetection

INPUT:
  - entities: Dictionary of UUID -> KnowledgeEntity
  - edges: List of GraphEdge objects
  - options: Filter by category, minimum severity

OUTPUT:
  - findings: List of RiskFinding with explanations

PROCEDURE:

1. DETECT_SINGLE_POINT_OF_FAILURE(entities, edges)
   role_to_tasks = {}
   
   // Build role -> task mapping from OWNED_BY edges
   FOR edge in edges WHERE edge.type == OWNED_BY:
       role = entities[edge.target_node_id]
       task = entities[edge.source_node_id]
       role_to_tasks[role.name].append(task.name)
   
   // Also check entity attributes
   FOR entity in entities WHERE entity.type == TASK:
       IF entity.attributes.owner:
           role_to_tasks[entity.attributes.owner].append(entity.name)
   
   // Flag roles with too many unique responsibilities
   FOR role, tasks in role_to_tasks:
       IF len(tasks) >= 3:
           YIELD RiskFinding(
               category=SINGLE_POINT_OF_FAILURE,
               severity=HIGH,
               title=f"SPOF: {role}",
               description=f"{role} owns {len(tasks)} tasks: {tasks[:3]}...",
               explanation="If this person is unavailable, these tasks stop.",
               recommendation="Cross-train backup personnel.",
               affected_nodes=[find_node_ids(tasks)]
           )

2. DETECT_UNDOCUMENTED_DECISIONS(entities, edges)
   FOR entity in entities WHERE entity.type == DECISION:
       conditions = entity.attributes.get("conditions", [])
       
       // Check if decision has labeled edges
       decision_edges = [e for e in edges WHERE e.source == entity.id AND e.type == DECIDES]
       edges_with_labels = [e for e in decision_edges WHERE e.label OR e.conditions]
       
       IF NOT conditions AND len(edges_with_labels) < 2:
           YIELD RiskFinding(
               category=UNDOCUMENTED_DECISION,
               severity=MEDIUM,
               title=f"Unclear Decision: {entity.name}",
               description="No explicit branching conditions defined.",
               explanation="Without clear criteria, different people make inconsistent choices.",
               recommendation="Define explicit conditions (IF amount > $X THEN path A)."
           )

3. DETECT_ORPHANED_TASKS(entities, edges)
   owned_tasks = {e.source for e in edges WHERE e.type == OWNED_BY}
   triggered_tasks = {e.target for e in edges WHERE e.type == TRIGGERS}
   dependent_tasks = {e.target for e in edges WHERE e.type == DEPENDS_ON}
   
   FOR entity in entities WHERE entity.type == TASK:
       issues = []
       
       has_owner = entity.id IN owned_tasks OR entity.attributes.get("owner")
       IF NOT has_owner:
           issues.append("no owner")
       
       has_trigger = entity.id IN triggered_tasks OR entity.id IN dependent_tasks
       IF NOT has_trigger:
           issues.append("no trigger")
       
       IF issues:
           YIELD RiskFinding(
               category=ORPHANED_TASK,
               severity=HIGH if len(issues) == 2 else MEDIUM,
               title=f"Orphaned: {entity.name}",
               description=f"Task has {join(issues)}.",
               explanation="Tasks without owners may never complete. Tasks without triggers may never start.",
               recommendation="Assign ownership and clarify trigger."
           )

4. DETECT_BRITTLE_CHAINS(nodes, edges)
   adj = build_adjacency_list(edges)
   start_nodes = find_nodes_with_no_incoming_edges(nodes, edges)
   
   longest_chain = 0
   FOR start in start_nodes:
       chain_length = compute_longest_path_dfs(start, adj)
       longest_chain = max(longest_chain, chain_length)
   
   THRESHOLD = 5
   IF longest_chain >= THRESHOLD:
       YIELD RiskFinding(
           category=BRITTLE_CHAIN,
           severity=MEDIUM,
           title=f"Long Chain: {longest_chain} steps",
           description="Sequential dependency chain is very long.",
           explanation="Any failure upstream blocks all downstream tasks. Total cycle time is sum of all steps.",
           recommendation="Parallelize independent steps. Add fallback paths."
       )

5. DETECT_CIRCULAR_DEPENDENCIES(edges)
   adj = build_adjacency_list(edges)
   cycles = find_all_cycles_dfs(adj)
   
   FOR cycle in cycles:
       cycle_names = [entities[node_id].name for node_id in cycle]
       
       YIELD RiskFinding(
           category=CIRCULAR_DEPENDENCY,
           severity=CRITICAL,
           title="Circular Dependency Found",
           description=f"Cycle: {' → '.join(cycle_names)} → {cycle_names[0]}",
           explanation="Each task waits for another. Process will deadlock.",
           recommendation="Break the cycle by removing one dependency.",
           affected_nodes=cycle
       )

6. DETECT_BOTTLENECKS(nodes, edges)
   in_degree = {}
   FOR edge in edges:
       in_degree[edge.target] = in_degree.get(edge.target, 0) + 1
   
   THRESHOLD = 4
   FOR node_id, count in in_degree:
       IF count >= THRESHOLD:
           entity = entities[node_id]
           YIELD RiskFinding(
               category=BOTTLENECK,
               severity=MEDIUM,
               title=f"Bottleneck: {entity.name}",
               description=f"Has {count} incoming dependencies.",
               explanation="Must wait for many upstream tasks. Delays cascade here.",
               recommendation="Split into parallel sub-tasks if possible."
           )

7. AGGREGATE_AND_SORT(all_findings, options)
   filtered = [f for f in all_findings 
               WHERE f.severity >= options.min_severity
               AND (options.categories IS NULL OR f.category IN options.categories)]
   
   sorted_findings = sorted(filtered, key=lambda f: severity_order[f.severity], reverse=True)
   
   RETURN sorted_findings
"""


# =============================================================================
# SOP GENERATION ALGORITHM
# =============================================================================

SOP_GENERATION_PSEUDOCODE = """
ALGORITHM: SOPGeneration

INPUT:
  - graph: ProcessGraph with entities and edges
  - options: include_exceptions, include_systems, detail_level

OUTPUT:
  - sop: SOPVersion with ordered steps and metadata

PROCEDURE:

1. ORDER_STEPS(graph)
   visited = set()
   ordered = []
   
   // Find root nodes (no incoming edges = process start)
   roots = find_nodes_with_no_incoming_edges(graph)
   queue = [(root, None) for root in roots]  // (node_id, branch_label)
   
   WHILE queue NOT EMPTY:
       current_id, branch = queue.pop_front()
       
       IF current_id IN visited:
           CONTINUE
       
       entity = graph.entities[current_id]
       visited.add(current_id)
       ordered.append((entity, branch))
       
       // Add children to queue
       outgoing_edges = get_edges_from(current_id)
       FOR edge in outgoing_edges:
           label = edge.label IF entity.type == DECISION ELSE None
           queue.append((edge.target, label))
   
   RETURN ordered

2. BUILD_ROLE_MAP(graph)
   role_map = {}  // task_id -> responsible_role_name
   
   FOR edge in graph.edges WHERE edge.type == OWNED_BY:
       owner = graph.entities[edge.target]
       role_map[edge.source] = owner.name
   
   // Also check entity attributes
   FOR entity in graph.entities WHERE entity.type == TASK:
       IF entity.id NOT IN role_map AND entity.attributes.owner:
           role_map[entity.id] = entity.attributes.owner
   
   RETURN role_map

3. GENERATE_STEPS(ordered, role_map, options)
   steps = []
   step_number = 0
   
   roles_involved = set()
   systems_referenced = set()
   artifacts_produced = set()
   
   FOR entity, branch_label in ordered:
       step_number += 1
       
       // Filter based on options
       IF entity.type == SYSTEM AND NOT options.include_systems:
           CONTINUE
       IF entity.attributes.is_exception AND NOT options.include_exceptions:
           CONTINUE
       
       // Track metadata
       IF role_map[entity.id]:
           roles_involved.add(role_map[entity.id])
       IF entity.type == SYSTEM:
           systems_referenced.add(entity.name)
       IF entity.type == ARTIFACT:
           artifacts_produced.add(entity.name)
       
       // Build description
       description = BUILD_DESCRIPTION(entity, options.detail_level)
       
       // Add confidence notes
       notes = []
       IF entity.confidence == UNVERIFIED:
           notes.append("⚠️ Needs confirmation")
       IF branch_label:
           notes.append(f"Follows when: {branch_label}")
       
       // Get branches for decision points
       branches = None
       IF entity.type == DECISION:
           branches = GET_DECISION_BRANCHES(graph, entity.id)
       
       step = SOPStep(
           step_number=step_number,
           title=entity.name,
           description=description,
           responsible_role=role_map.get(entity.id),
           source_node_ids=[entity.id],
           is_decision_point=(entity.type == DECISION),
           notes=notes,
           branches=branches
       )
       
       steps.append(step)
   
   RETURN steps, roles_involved, systems_referenced, artifacts_produced

4. CALCULATE_METRICS(graph, steps)
   total_entities = len(graph.entities)
   covered_entities = count(steps with source_node_ids)
   coverage = covered_entities / total_entities
   
   confidence_scores = [e.confidence_score for e in graph.entities.values()]
   avg_confidence = mean(confidence_scores)
   
   RETURN coverage, avg_confidence

5. ASSEMBLE_SOP(graph, steps, metadata, metrics)
   sop = SOPVersion(
       process_id=graph.process_id,
       title=GENERATE_TITLE(graph),
       purpose=GENERATE_PURPOSE(graph),
       scope=GENERATE_SCOPE(graph),
       steps=steps,
       roles_involved=list(roles_involved),
       systems_referenced=list(systems_referenced),
       artifacts_produced=list(artifacts_produced),
       coverage_score=metrics.coverage,
       confidence_score=metrics.confidence,
       source_graph_version=graph.current_version
   )
   
   RETURN sop
"""

if __name__ == "__main__":
    print("KnowFlow Core Algorithms - Pseudocode Documentation")
    print("=" * 60)
    print("\n1. ADAPTIVE QUESTIONING")
    print(ADAPTIVE_QUESTIONING_PSEUDOCODE)
    print("\n2. KNOWLEDGE EXTRACTION PIPELINE")
    print(EXTRACTION_PIPELINE_PSEUDOCODE)
    print("\n3. RISK DETECTION")
    print(RISK_DETECTION_PSEUDOCODE)
    print("\n4. SOP GENERATION")
    print(SOP_GENERATION_PSEUDOCODE)
