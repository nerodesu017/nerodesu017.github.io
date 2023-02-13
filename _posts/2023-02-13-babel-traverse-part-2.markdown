---
layout: post
title: Babel Traverse - Part 2 - @babel/traverse's traverseFast
author: Nero
date: 2023-02-13 00:03:00 +0300
categories: [AST, programming]
tags: [programming, ast, manipulation]
---

## Last time we left off at how traversal actually works for babel, today we'll do just that. We'll analyze the `traverseFast` function.

### Let's check its implementation

{% highlight js %}
export default function traverseFast(
  node: t.Node | null | undefined,
  enter: (node: t.Node, opts?: any) => void,
  opts?: any,
): void {
  if (!node) return;

  const keys = VISITOR_KEYS[node.type];
  if (!keys) return;

  opts = opts || {};
  enter(node, opts);

  for (const key of keys) {
    const subNode = node[key];

    if (Array.isArray(subNode)) {
      for (const node of subNode) {
        traverseFast(node, enter, opts);
      }
    } else {
      traverseFast(subNode, enter, opts);
    }
  }
}
{% endhighlight %}

### As we can see, the `traverseFast` function takes 3 arguments:
  1. Node - which is the main node to be traversed and modified
  2. Enter - a function we pass that shows how the nodes are going to be modified
  3. Opts - an object containing anything we'd pass it, and that gets passed down recursively. For example, we could keep states here.


#### Enter function
  - this is what we are most interested in, this function shows how the nodes are going to be modified
  - this function, in turn, gets passed 2 arguments: 
    1. `node`, which is the current node we are at
    2. `opts`, which is our opts that we passed (or an empty object if we didn't pass any)

### Going back to the `traverseFast` function, let's quickly summarize what is happening:
  1. if the passed node isn't there, we'll just return (e.g. the function was called with no arguments)
  2. get the subnodes' keys that need to be checked (`VISITOR_KEYS[node.type]`)
  3. in case the `node.type` is not valid, return
  4. modify the current node using the passed `enter` function
  5. traverse subNodes recursively and go to step 1.

### Remarks
  1. There's no way of removing safely a said node, only by detaching it while we are still at its parent; (we could still replace its type to the noop type)
  2. There's no way of going to the parent node from a said node, we can only go one way, and that is down the tree
  3. There's only one time transformations are applied: when we enter the node. This is mostly the case, but sometimes you'd want to do transformations when exiting the node. Let's see where:

{% highlight js %}
"abc" + "def" + "ghi" + "jkl"
{% endhighlight%}
  
#### This code, when parsed, gives us the next tree view:

{% highlight js %}
ExpressionStatement {
  expression: BinaryExpression {
    left: BinaryExpression {
      left: BinaryExpression {
        left: StringLiteral {
          value: "abc"
        }
        operator: "+"
        right: StringLiteral {
          value: "def"
        }
      }
      operator: "+"
      right: StringLiteral {
        value: "ghi"
      }
    }
    operator: "+"
    right: StringLiteral {
      value: "jkl"
    }
  }
}
{% endhighlight %}

#### As we can see, we got nested BinaryExpressions that, in the end, mean concatenation of strings
#### Doing transformations when we enter a BinaryExpression node would look something like:

{% highlight js %}
// visitor

traverseFast(node, node => {
  if(node.type !== "BinaryExpression")return;
  const left = node.left;
  const right = node.right;
  if(left.type !== "StringLiteral" || right.type !== "StringLiteral")return;
  node.type = "StringLiteral"
  node.value = left.value + right.value;
  delete node.left;
  delete node.right;
  delete node.operator;
})

// result

"abcdef" + "ghi" + "jkl"
{% endhighlight %}

#### Of course, we could rewrite or enter-transform visitor to make it work, but the easiest way is to do the transformation before exiting the node. Example:

{% highlight js %}
// visitor
// I'll put just the before-exit visitor when using the normal `traverse` function here

BinaryExpression: {
  exit(path) {
    const {node} = path;
    const left = node.left;
    const right = node.right;
    if(left.type !== "StringLiteral" || right.type !== "StringLiteral")return;
    path.replaceWith(t.StringLiteral(left.value + right.value));
  }
}

// result

"abcdefghijkl"
{% endhighlight %}

### In the next parts we'll take a look at what a NodePath is and also the normal `traverse` function.