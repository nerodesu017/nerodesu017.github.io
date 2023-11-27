// @deno-types="npm:@types/babel__traverse"
import {NodePath} from "npm:@types/babel__traverse";
import {parse} from "npm:@babel/parser";
import * as t from "npm:@babel/types";
// @deno-types="npm:@types/babel__generator"
import generate_all from "npm:@babel/generator";
const generate = generate_all.default;
// @deno-types="npm:@types/babel__traverse";
import traverse_all from "npm:@babel/traverse";
const traverse = traverse_all.default;
import * as fs from "node:fs";
import {resolveCFF} from "./resolveCFF.ts";

let AST = parse(fs.readFileSync("obf.js").toString("utf-8"), {sourceType: "unambiguous"});

// Our logic here
resolveCFF(AST);
// Our logic here

fs.writeFileSync("deobbed.js", generate(AST, {retainFunctionParens: true, jsonCompatibleStrings: true}).code);