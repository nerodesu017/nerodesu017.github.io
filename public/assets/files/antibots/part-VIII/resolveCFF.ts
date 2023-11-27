// @deno-types="npm:@types/babel__traverse"
import { NodePath } from "npm:@types/babel__traverse";
import * as t from "npm:@babel/types";
// @deno-types="npm:@types/babel__traverse";
import traverse_all from "npm:@babel/traverse";
const traverse = traverse_all.default;

import { isCFFLoop } from "./isCFFLoop.ts";

import {CFFGraph} from "./CFFGraph.ts";

export function resolveCFF(AST: t.Program | t.File) {
  traverse(AST, {
    Loop: {
      exit(path: NodePath<t.Loop>) {
        // get previous node
        const prev_path = path.getPrevSibling();
        if(prev_path.node === undefined)return;

        // make sure we are at the right spot
        if(!isCFFLoop(path.node, prev_path.node))return;

        if(!path.isForStatement())return;
        if(!prev_path.isVariableDeclaration())return;

        const cff_graph = new CFFGraph();
        cff_graph.populate(path.node, prev_path.node);

        CFFGraph.traverseAndMergeUselessNodes(cff_graph);
        CFFGraph.traverseAndMergeConditionalNodes(cff_graph);
        CFFGraph.traverseAndMergeUselessNodes(cff_graph);
        CFFGraph.traverseAndLoopNodes(cff_graph);

        const statements = CFFGraph.trace(cff_graph);

        prev_path.remove();
        path.replaceWithMultiple(statements);

        console.log(statements.length);
      },
    },
  });
}