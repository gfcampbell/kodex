/**
 * Component Extractor
 * 
 * Extracts React components from source files.
 */

import { SourceFile, SyntaxKind, FunctionDeclaration, VariableDeclaration, Node } from 'ts-morph';
import type { Component } from '@kodex/shared';

/**
 * Extract React components from a source file
 */
export function extractComponents(
  sourceFile: SourceFile,
  relativePath: string
): Component[] {
  const components: Component[] = [];

  // Function declarations (function MyComponent() {})
  const functionDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
  for (const func of functionDeclarations) {
    const component = extractFromFunction(func, relativePath);
    if (component) components.push(component);
  }

  // Variable declarations (const MyComponent = () => {})
  const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const varDecl of variableDeclarations) {
    const component = extractFromVariable(varDecl, relativePath);
    if (component) components.push(component);
  }

  // Add child component references
  for (const component of components) {
    component.children = findChildComponents(sourceFile, component.name, components);
  }

  return components;
}

/**
 * Extract component from function declaration
 */
function extractFromFunction(
  func: FunctionDeclaration,
  relativePath: string
): Component | null {
  const name = func.getName();
  if (!name) return null;

  // Check if it looks like a React component (PascalCase)
  if (!isPascalCase(name)) return null;

  // Check if it returns JSX
  if (!containsJsx(func)) return null;

  // Check if exported
  const exported = func.isExported() || func.isDefaultExport();

  // Try to find props type
  const params = func.getParameters();
  let propsType: string | undefined;
  if (params.length > 0) {
    const typeNode = params[0].getTypeNode();
    if (typeNode) {
      propsType = typeNode.getText();
    }
  }

  return {
    name,
    sourceFile: relativePath,
    line: func.getStartLineNumber(),
    exported,
    propsType,
  };
}

/**
 * Extract component from variable declaration
 */
function extractFromVariable(
  varDecl: VariableDeclaration,
  relativePath: string
): Component | null {
  const name = varDecl.getName();

  // Check if it looks like a React component (PascalCase)
  if (!isPascalCase(name)) return null;

  // Check initializer
  const initializer = varDecl.getInitializer();
  if (!initializer) return null;

  // Check if it's an arrow function or function expression that returns JSX
  const kind = initializer.getKind();
  if (
    kind !== SyntaxKind.ArrowFunction &&
    kind !== SyntaxKind.FunctionExpression
  ) {
    return null;
  }

  // Check if it contains JSX
  if (!containsJsx(initializer)) return null;

  // Check if exported
  const variableStatement = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
  const exported = variableStatement?.isExported() ?? false;

  // Try to find props type from arrow function parameters
  let propsType: string | undefined;
  const arrowFunc = initializer.asKind(SyntaxKind.ArrowFunction);
  if (arrowFunc) {
    const params = arrowFunc.getParameters();
    if (params.length > 0) {
      const typeNode = params[0].getTypeNode();
      if (typeNode) {
        propsType = typeNode.getText();
      }
    }
  }

  return {
    name,
    sourceFile: relativePath,
    line: varDecl.getStartLineNumber(),
    exported,
    propsType,
  };
}

/**
 * Check if a string is PascalCase (starts with uppercase)
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Check if a node contains JSX
 */
function containsJsx(node: Node): boolean {
  const jsxElements = node.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxSelfClosing = node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  const jsxFragment = node.getDescendantsOfKind(SyntaxKind.JsxFragment);

  return jsxElements.length > 0 || jsxSelfClosing.length > 0 || jsxFragment.length > 0;
}

/**
 * Find child components used within a component
 */
function findChildComponents(
  sourceFile: SourceFile,
  componentName: string,
  allComponents: Component[]
): string[] {
  const children: string[] = [];
  const componentNames = new Set(allComponents.map(c => c.name));

  // Find the component's function body
  const funcs = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
  ];
  const vars = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

  let componentNode: Node | undefined;

  for (const func of funcs) {
    if (func.getName() === componentName) {
      componentNode = func;
      break;
    }
  }

  if (!componentNode) {
    for (const varDecl of vars) {
      if (varDecl.getName() === componentName) {
        componentNode = varDecl.getInitializer();
        break;
      }
    }
  }

  if (!componentNode) return children;

  // Find JSX elements that reference other components
  const jsxOpeningElements = componentNode.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  const jsxSelfClosing = componentNode.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

  const allJsxElements = [...jsxOpeningElements, ...jsxSelfClosing];

  for (const element of allJsxElements) {
    const tagName = element.getTagNameNode().getText();
    
    // Check if it's a component (PascalCase and in our list)
    if (isPascalCase(tagName) && componentNames.has(tagName)) {
      if (!children.includes(tagName)) {
        children.push(tagName);
      }
    }
  }

  return children;
}
