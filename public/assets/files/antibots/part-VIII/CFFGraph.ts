import * as t from "npm:@babel/types";

export class CFFGraph {
  public start: number;
  public end: number;
  private _vertices: Map<number, CFFNode>;
  private _edges: Map<number, Set<number>>;
  public jmp_var_name: string;

  get edges() {
    return this._edges;
  }

  addEdge(v1: number, v2: number) {
    if (!this._edges.has(v1)) this._edges.set(v1, new Set());
    // @ts-expect-error: edges.get(v1) should exist as previously set
    this._edges.get(v1).add(v2);
  }

  get vertices() {
    return this._vertices;
  }

  getVertex(vertex: number) {
    return this._vertices.get(vertex);
  }

  addVertex(vertex: CFFNode) {
    this._vertices.set(vertex.value, vertex);
    this.addEdge(vertex.value, vertex.consequent);
    if (!Number.isNaN(vertex.alternate)) {
      this.addEdge(vertex.value, vertex.alternate);
    }
  }

  constructor() {
    this.start = NaN;
    this.end = NaN;
    this._vertices = new Map();
    this._edges = new Map();
    this.jmp_var_name = "";
  }

  populate(node: t.ForStatement, prev: t.Statement) {
    this.jmp_var_name = (
      (node.test as t.BinaryExpression).left as t.Identifier
    ).name;

    this.start = (
      (prev as t.VariableDeclaration).declarations[0].init as t.NumericLiteral
    ).value;
    this.end = (
      (node.test as t.BinaryExpression).right as t.NumericLiteral
    ).value;

    // transform the array of switch cases to a map
    // this indirectly helps us to trace just nodes that might be executed
    // all other nodes (that are not connected) will be removed from the graph
    const switch_statement = (node.body as t.BlockStatement)
      .body[0] as t.SwitchStatement;

    const switch_case_map: Map<number, t.Statement[]> = new Map();

    for (const switch_case of switch_statement.cases) {
      switch_case_map.set(
        (switch_case.test as t.NumericLiteral).value,
        switch_case.consequent.map((node) => t.cloneDeepWithoutLoc(node))
      );
    }

    // trace from start node
    const already_visited: Set<number> = new Set();
    const queue: number[] = [this.start];
    while (queue.length !== 0) {
      const curr = queue.shift();
      if (curr === undefined) break;
      if (already_visited.has(curr)) continue;
      already_visited.add(curr);
      const curr_switch_case = switch_case_map.get(curr);
      if (curr_switch_case === undefined) break;

      // remove unneeded break statements
      // for this example we will not get in-depth
      // we'll just check the last statement to make sure it is a break and remove it
      {
        const last_statement = curr_switch_case.at(-1);
        if (t.isBreakStatement(last_statement)) curr_switch_case.pop();
      }

      // find jmp_var assignment
      let test_expression: t.BooleanLiteral | t.BinaryExpression =
        t.booleanLiteral(true);
      let if_true = NaN;
      let if_false = NaN;

      for (let i = 0; i < curr_switch_case.length; i++) {
        const body_node = curr_switch_case.at(i);
        if (!t.isExpressionStatement(body_node)) continue;
        const expr = body_node.expression;
        if (!t.isAssignmentExpression(expr)) continue;

        if (expr.operator !== "=") continue;
        if (!t.isIdentifier(expr.left)) continue;
        if (expr.left.name !== this.jmp_var_name) continue;

        const right = expr.right;

        // remove this assignment expr
        curr_switch_case.splice(i, 1);

        switch (right.type) {
          case "NumericLiteral":
            if_true = right.value;
            break;
          case "ConditionalExpression":
            {
              if (!t.isBinaryExpression(right.test)) {
                throw new Error(
                  "ConditionalExpression test is not BinaryExpression!"
                );
              }
              test_expression = t.cloneDeepWithoutLoc(right.test);
              if (!t.isNumericLiteral(right.consequent)) {
                throw new Error(
                  "Consequent of ConditionalExpression is not a NumericLiteral, but " +
                    right.consequent.type
                );
              }
              if (!t.isNumericLiteral(right.alternate)) {
                throw new Error(
                  "Alternate of ConditionalExpression is not a NumericLiteral, but " +
                    right.alternate.type
                );
              }

              if_true = right.consequent.value;
              if_false = right.alternate.value;
            }
            break;
          default:
            throw new Error("Unknown node type: " + right.type);
        }
      }

      // add the node to the graph
      this.addVertex(
        new CFFNode(
          curr,
          if_true,
          if_false,
          test_expression,
          switch_case_map.get(curr)
        )
      );

      // add children to queue to be visited
      if (!Number.isNaN(if_true)) queue.push(if_true);
      if (!Number.isNaN(if_false)) queue.push(if_false);
    }
  }

  prettyPrint() {
    console.log("\n--\tPretty print graph\t--");
    Array.from(this.vertices.values()).forEach((vertex) => {
      console.log(
        `${vertex.value} => [${
          vertex.consequent +
          (!Number.isNaN(vertex.alternate) ? ", " + vertex.alternate : "")
        }]`
      );
    });
    console.log("--\tPretty print graph\t--\n");
  }

  getParents(node_val: number) {
    return Array.from(this.vertices.entries())
      .map(([_node_val, nodes_it_points_to]) => {
        if (_node_val === node_val) return undefined;
        if (
          ![
            nodes_it_points_to.consequent,
            nodes_it_points_to.alternate,
          ].includes(node_val)
        ) {
          return undefined;
        }
        return _node_val;
      })
      .filter((node_val) => node_val !== undefined);
  }

  getChildren(node_val: number) {
    const node = this.getVertex(node_val);
    if (!node) return [];

    const children = [node.consequent];
    !Number.isNaN(node.alternate) && children.push(node.alternate);

    return children;
  }

  // inspired by https://github.com/babel/babel/blob/main/packages/babel-types/src/traverse/traverseFast.ts
  // 1.
  static traverse({
    current,
    cff_graph,
    enter,
    exit,
    state,
    visited,
  }: {
    current: number;
    cff_graph: CFFGraph;
    enter?: (
      node: CFFNode,
      graph_ref: CFFGraph,
      state: object,
      visited: Set<number>
    ) => void;
    exit?: (
      node: CFFNode,
      graph_ref: CFFGraph,
      state: object,
      visited: Set<number>
    ) => void;
    state?: object;
    visited?: Set<number>;
  }) {
    if (!enter && !exit) return;

    const node = cff_graph.getVertex(current);
    if (node === undefined) return;

    if (!state) state = {};
    if (!visited) visited = new Set();

    if (visited.has(current)) return;

    visited.add(current);

    enter && enter(node, cff_graph, state, visited);

    for (const child of cff_graph.getChildren(current)) {
      CFFGraph.traverse({
        cff_graph: cff_graph,
        current: child,
        enter: enter,
        exit: exit,
        state: state,
        visited: visited,
      });
    }

    exit && exit(node, cff_graph, state, visited);

    visited.delete(current);
  }

  // 2.
  canMergeNodeWithChildNode(node_val: number): boolean {
    const children = this.getChildren(node_val);
    if (children.length > 1) return false;
    const childs_parents = this.getParents(children[0]);
    if (childs_parents.length > 1) return false;
    return true;
  }

  // 3.
  /**
   * @param parent_val
   * @param child_val
   *
   * Merging is done in the parent regardless
   */
  mergeNodes(parent_val: number, child_val: number) {
    const parent_node = this.getVertex(parent_val);
    if (!parent_node) return;
    const child_node = this.getVertex(child_val);
    if (!child_node) return;

    if (!this.canMergeNodeWithChildNode(parent_val)) return false;

    parent_node.inside.push(...child_node.inside);

    parent_node.setConsequent(child_node.consequent);
    parent_node.setAlternate(child_node.alternate);

    parent_node.test_expression = child_node.test_expression;

    this.vertices.delete(child_val);
    this.edges.delete(child_val);

    // @ts-expect-error: the parent exists
    this.edges.get(parent_val).delete(child_val);
  }

  // 4.
  static traverseAndMergeUselessNodes(cff_graph: CFFGraph) {
    CFFGraph.traverse({
      cff_graph: cff_graph,
      current: cff_graph.start,
      enter: (node, cff_graph) => {
        if (!cff_graph.canMergeNodeWithChildNode(node.value)) return;
        cff_graph.mergeNodes(node.value, cff_graph.getChildren(node.value)[0]);
        return;
      },
    });
  }

  static traverseAndMergeConditionalNodes(cff_graph: CFFGraph) {
    CFFGraph.traverse({
      cff_graph: cff_graph,
      current: cff_graph.start,
      enter: (node, cff_graph) => {
        // 1. first we check to see that we are at the right node. in our case it will be node `4`
        const children = cff_graph.getChildren(node.value);
        if (children.length !== 2) return;

        const [fcParents, scParents] = children.map((child) => {
          return cff_graph.getParents(child);
        });

        if (
          !(
            (fcParents.length === 1 && scParents.length === 2) ||
            (fcParents.length === 2 && scParents.length === 1)
          )
        ) {
          return;
        }

        const [childWithTwoParents, childWithOneParent, parentsOfChild] =
          fcParents.length === 2
            ? [children[0], children[1], fcParents]
            : [children[1], children[0], scParents];

        if (!parentsOfChild.includes(childWithOneParent)) return;

        // 2. next we attempt to merge the Conditional Node
        const conditional_expr = t.cloneDeepWithoutLoc(
          node.consequent === childWithOneParent
            ? node.test_expression
            : t.unaryExpression("!", node.test_expression)
        );

        const to_be_appended = t.ifStatement(
          conditional_expr,
          t.blockStatement(
            // @ts-expect-error: childWithOneParent exists as a vertex
            cff_graph
              .getVertex(childWithOneParent)
              .inside.map((statement) => t.cloneDeepWithoutLoc(statement))
          )
        );

        node.inside.push(to_be_appended);

        // 3. now we make sure to get rid of the Conditional Vertex
        cff_graph.vertices.delete(childWithOneParent);
        cff_graph.edges.delete(childWithOneParent);

        // @ts-expect-error: node.value has 2 edges
        cff_graph.edges.get(node.value).delete(childWithOneParent);

        node.test_expression = t.booleanLiteral(true);
        node.setConsequent(childWithTwoParents);
        node.setAlternate(NaN);
      },
    });
  }

  // we do this transformation at the child level
  // easier for me this way
  static traverseAndLoopNodes(cff_graph: CFFGraph) {
    CFFGraph.traverse({
      cff_graph: cff_graph,
      current: cff_graph.start,
      enter: (node, cff_graph, _, visited) => {
        // 1. we check to make sure we are at the end of a loop
        const children = cff_graph.getChildren(node.value);
        // we assume that any final loop node points only to the beginning of the loop
        // TODO: in the future, if there's 2 children, make it so the second one is treated
        //       as a Conditional Node and merged
        if (children.length !== 1) return;
        const child = children[0];
        if (!visited.has(child)) return;

        const parents = cff_graph.getParents(node.value);
        if (parents.length !== 1) return;
        const parent = parents[0];

        if (child !== parent) return;

        // 2. Merge Loop Node
        const parentsChildren = cff_graph.getChildren(parent);
        // @ts-expect-error: parent vertex exists
        const parentNode: CFFNode = cff_graph.getVertex(parent);
        const loop_expr = t.cloneDeepWithoutLoc(
          parentsChildren[0] === node.value
            ? parentNode.test_expression
            : t.unaryExpression("!", parentNode.test_expression)
        );

        const to_be_appended = t.whileStatement(
          loop_expr,
          t.blockStatement(
            node.inside.map((statement) => t.cloneDeepWithoutLoc(statement))
          )
        );

        parentNode.inside.push(to_be_appended);

        const isConsequent = parentsChildren[0] === node.value;

         // 3. now we make sure to get rid of the Conditional Vertex
         cff_graph.vertices.delete(node.value);
         cff_graph.edges.delete(node.value);
 
         // @ts-expect-error: node.value has 2 edges
         cff_graph.edges.get(parent).delete(node.value);
 
         parentNode.test_expression = t.booleanLiteral(true);
         if(isConsequent){
           parentNode.setConsequent(parentsChildren[1]);
           parentNode.setAlternate(NaN);
         }
      },
    });
  }

  static trace(cff_graph: CFFGraph): t.Statement[] {
    const statements: t.Statement[] = [];

    let curr = cff_graph.getVertex(cff_graph.start);
    while(curr !== undefined){
      statements.push(...curr.inside);

      const children = cff_graph.getChildren(curr.value);
      if(children.length === 2)throw new Error(`Node '${curr.value}' has 2 children`);

      const child = children[0];
      if(Number.isNaN(child))break;

      curr = cff_graph.getVertex(child);
    }
    return statements;
  }
}

export class CFFNode {
  public value: number;
  public inside: t.Statement[];
  public test_expression: t.BooleanLiteral | t.BinaryExpression;
  public if_true: number;
  public if_false: number;

  constructor(
    value: number,
    if_true?: number,
    if_false?: number,
    test_expression?: t.BooleanLiteral | t.BinaryExpression,
    inside?: t.Statement[]
  ) {
    this.value = value;
    this.test_expression = test_expression || t.booleanLiteral(true);
    this.if_true = if_true || NaN;
    this.if_false = if_false || NaN;
    this.inside = inside || [];
  }

  setConsequent(consequent: number) {
    this.if_true = consequent;
  }

  setAlternate(alternate: number) {
    this.if_false = alternate;
  }

  get consequent() {
    return this.if_true;
  }

  get alternate() {
    return this.if_false;
  }
}
