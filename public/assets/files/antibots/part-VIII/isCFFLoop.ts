import * as t from "npm:@babel/types";

export function isCFFLoop(node: t.Node, prev: t.Node) {
    return true &&

    /**
     * Make sure the previous statement looks roughly like this:
     * 
     * var $JMP_VAR$ = 2;
     */
    t.isVariableDeclaration(prev) &&
    prev.declarations.length === 1 &&
    t.isNumericLiteral(prev.declarations[0].init) &&
    prev.declarations[0].init.value === 2 &&
    t.isIdentifier(prev.declarations[0].id) &&

    /**
     * Make sure the current node is the ForStatement that we are searching for
     * 
     * for(; $JMP_VAR$ <<OPERATOR>> NUMERIC_LITERAL;){
     *  // ...
     * }
     */
    t.isForStatement(node) &&
    node.init === null &&
    node.update === null &&
    t.isBinaryExpression(node.test) &&
    node.test.operator === "!==" &&
    t.isIdentifier(node.test.left) &&
    node.test.left.name === prev.declarations[0].id.name &&

    /**
     * Make sure the ForStatement's body is a CFF one
     * 
     * switch($JMP_VAR$){
     *  // ...
     * }
     */
    t.isBlockStatement(node.body) &&
    node.body.body.length === 1 &&
    t.isSwitchStatement(node.body.body[0]) &&
    t.isIdentifier(node.body.body[0].discriminant) &&
    node.body.body[0].discriminant.name === prev.declarations[0].id.name
}