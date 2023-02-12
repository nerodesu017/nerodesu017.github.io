---
layout: post
title: Babel Traverse - Part 1 - Taking a look at how @babel/traverse works
author: Nero
date: 2023-02-07 9:31:00 +0300
categories: [AST, programming]
tags: [programming, ast, manipulation]
---

## Today we will take a look at how @babel/traverse (or babel-traverse, we'll use them interchangebly) plugin works. In part 1, we'll take a look at the helper functions from the entrypoint file. After this, we shall get into the actual traversal, Scopes, NodePaths, how renaming works and more

### For those of you that don't yet know what the babel suite is: `Babel is a toolchain that is mainly used to convert ECMAScript 2015+ code into a backwards compatible version of JavaScript in current and older browsers or environments.` Of course, we used it on this blog to reverse engineer a good part of Incapsula in the past, so it can be used for anything that involves playing with how a js file looks (also ts file)

#### Now, a big picture of how babel works looks like this

- Parse a javascript file into an AST (Abstract Syntax TREE) using the @babel/parser package
- Traverse this AST using @babel/traverse and do the wanted transformations
- Generate the code from this AST using @babel/generator

#### Most of the magic happens at the @babel/traverse level, so that's what is of most use for us at the the moment

### Babel-traverse Structure

{% highlight js %}
.
└── babel-traverse/
    ├── cache.ts
    ├── context.ts
    ├── hub.ts
    ├── index.ts
    ├── traverse-node.ts
    ├── types.ts
    ├── path/
    │   └── ...
    └── scope/
        ├── binding.ts
        ├── index.ts
        └── lib/
            └── renamer.ts
{% endhighlight %}

### index.ts - entry point

#### Taking a look at `index.ts` we have the next functions(methods) and properties related to the exported `traverse`

{% highlight none %}
└── traverse/
    ├── visitors/
    │   ├── explode()
    │   ├── verify()
    │   └── merge()
    ├── verify()
    ├── explode()
    ├── cheap()
    ├── node()
    ├── clearNode()
    ├── removeProperties()
    ├── hasType()
    └── cache/
        ├── path
        ├── scope
        ├── clear()
        ├── clearPath()
        └── clearScope()
{% endhighlight %}

## 1. cache  

  - Cache tracks 2 main things the `path` and the `scope`, each one of them being a WeakMap;
    - We'll understand more about these later, when we'll get to the actual traversal and modification of the AST, because we'll see that babel doesn't actually deal just with the AST's nodes, but also, creates it's own AST-wrapper (to say so) that is a Path-Tree. - It is also taking in account the scopes (so it can say where variables are referenced and such)
    Useful for when you want to recompute the whole Path-Tree/Scopes without generating and reparsing the whole script
      - example:
      {% highlight js %}
traverse.cache.clear();
      {% endhighlight %}

## 2. hasType()  

  - useful just to see if a tree (or subtree) has a specific NodeType
  - we can also specify the `denylistTypes: Array<string>`, which doesn't search in blacklisted nodes (blacklisted by their NodeType)
  - example:

     {% highlight js %}
Program: {
  Body: [
    ExpressionStatement {
      expression: CallExpression {
        callee: MemberExpression {
          object: Identifier {
            name: "console"
          },
          computed: false,
          property: Identifier {
            name: "log"
          }
        }
        arguments: [
          StringLiteral {
            value: "Hello World"
          }
        ]
      }
    }
  ]
}

// This Program AST has the next NodeTypes: ["Program", "ExpressionStatement", "CallExpression", "MemberExpression", "Identifier", "StringLiteral"]
       {% endhighlight %}

## 3. removeProperties()

   - It passes each subnode (and itself) to `clearNode()`

## 4. clearNode()

   - removes all properties from the PASSED node that start with "\_" along with additional metadata properties like location data and raw token data, while also deleting the associated node from the `traverse.cache.path` WeakMap from earlier

## 5. node()

   - TO BE DOCUMENTED IN FUTURE PARTS - actual traversal

## 6. cheap()

   - TO BE DOCUMENTED IN FUTURE PARTS - actual traversal

## 7. explode()

   - As per the actual documentation, explode does the next thing:

     {% highlight none %}
explode() will take a visitor object with all of the various shorthands
that we support, and validates & normalizes it into a common format, ready
to be used in traversal

The various shorthands are:
`Identifier() { ... }` -> `Identifier: { enter() { ... } }`
`"Identifier|NumericLiteral": { ... }` -> `Identifier: { ... }, NumericLiteral: { ... }`
Aliases in `@babel/types`: e.g. `Property: { ... }` -> `ObjectProperty: { ... }, ClassProperty: { ... }`

Other normalizations are:
Visitors of virtual types are wrapped, so that they are only visited when
their dynamic check passes
`enter` and `exit` functions are wrapped in arrays, to ease merging of
visitors
     {% endhighlight %}

   -  in short, `explode()` normalizes the visitors you pass to the `traverse()` function, a middleman that makes your work easier

## 8. verify ()

   - again, middleman function, gets called by `explode()`, so we don't regard this function (at least for the moment, if it is actually of interest, let me know and I could dive deeper in the next posts!)

## 9. visitors.merge()  

- This function, as the name implies, is used for merging visitors. It is not documented or anything, but let's take a look at how it is used in some plugins:

&nbsp;1. babel-helper-module-transforms/src/rewirte-this.ts > rewriteThisVisitor()

{% highlight js %}
let environmentVisitor = {
  [skipKey]: path => path.skip(),

  "Method|ClassProperty"(path: NodePath<t.Method | t.ClassProperty>) {
    skipAllButComputedKey(path);
  },
}
const rewriteThisVisitor: Visitor = traverse.visitors.merge([
    environmentVisitor,
    {
      ThisExpression(path: NodePath<t.ThisExpression>) {
        path.replaceWith(unaryExpression("void", numericLiteral(0), true));
      },
    },
  ]);
{% endhighlight %}

&nbsp;2. babel-helper-create-class-features-plugin/src/misc.ts > findBareSupers()

{% highlight js %}
const findBareSupers = traverse.visitors.merge<NodePath<t.CallExpression>[]>([
  {
    Super(path: NodePath<t.Super>) {
      const { node, parentPath } = path;
      if (parentPath.isCallExpression({ callee: node })) {
        this.push(parentPath);
      }
    },
  },
  environmentVisitor,
]);

{% endhighlight %}

- From what we can see, this is actually just for merging visitors, as in, you can have a base one that you can expand one without actually modifying it. But, what exactly is it different from just doing it like this:

      {% highlight js %}
const visitor1 = {
  // ...
};
const visitor2 = {
  // ...
}
const finalVisitor = {
  ...visitor1,
  ...visitor2
}
      {% endhighlight %}

- well, let's look at a basic example (I'm not sure it covers all the cases, but it will show you that `visitors.merge()` is, indeed, a little better than just the Spread Syntax):

      {% highlight js %}
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generate = require("@babel/generator");

const file = `function a() {
  let x = 33;
}`

const AST1 = parser.parse(file);
const AST2 = parser.parse(file);

let visitor1 = {
  NumericLiteral(){
    console.log("Inside visitor1");
  }
}
let visitor2 = {
  NumericLiteral(){
    console.log("Inside visitor2");
  }
}
traverse.default(AST1, {
  ...visitor1,
  ...visitor2
});

console.log();

traverse.default(AST2, {
  ...traverse.visitors.merge([visitor1, visitor2])
})
      {% endhighlight %}

- This here, will output:

      {% highlight js %}
Inside visitor2

Inside visitor1
Inside visitor2
      {% endhighlight %}

- So we can see that we can multiple visitors for a specified NodeType, and `visitor.merge()` keeps all these visitors, and it keeps them in the order you feed them to it. All in all, isn't that bad to use over the Spread Syntax.

### As a quick recap, here's what we need to know

  1. cache - to be used for when we want to recompute the Program's NodePaths and Scopes
  2. hasType() - if we want to see if the node contains a specific NodeType inside itself, while also being able to blacklist certain subnodes (with a specific NodeType) from being traversed
  3. removeProperties() - clears the node and its subnodes making use of `clearNode()`, doesn't seem to recompute Scopes, and we are not sure if it is okay to delete location data if we in the future will want to access that and get raw strings from the main file. We haven't yet went into how @babel/traverse computes NodePaths, Scopes and such, so we don't know if it will recompute location data
  4. clearNode() - should use `removeProperties()` to clear the node recursively
  5. node() - about traversal, not yet researched
  6. cheap() - about traversal, not yet researched
  7. explode() - normalizes visitor
  8. verify() - called by `explode()`, checks specific visitor by their own standards/rules
  9. visitors.merge() - merges multiple objects containing visitors, better than [Spread Syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
