/**
 * Route Extractor
 * 
 * Extracts routes from various frameworks.
 */

import { SourceFile, SyntaxKind, Node, JsxOpeningElement, JsxSelfClosingElement } from 'ts-morph';
import type { Route } from '@kodex/shared';

/**
 * Extract routes from a source file
 */
export function extractRoutes(
  sourceFile: SourceFile,
  relativePath: string,
  framework?: 'react' | 'nextjs' | 'express'
): Route[] {
  const routes: Route[] = [];

  // Next.js App Router (app/page.tsx files)
  if (framework === 'nextjs' && relativePath.includes('/app/')) {
    const route = extractNextAppRoute(relativePath);
    if (route) {
      routes.push({ ...route, sourceFile: relativePath });
    }
  }

  // Next.js Pages Router (pages/*.tsx files)
  if (framework === 'nextjs' && relativePath.includes('/pages/')) {
    const route = extractNextPagesRoute(relativePath);
    if (route) {
      routes.push({ ...route, sourceFile: relativePath });
    }
  }

  // React Router <Route> components
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  jsxElements.forEach(element => {
    const tagName = element.getTagNameNode().getText();
    
    if (tagName === 'Route') {
      const route = extractReactRouterRoute(element, relativePath);
      if (route) routes.push(route);
    }
  });

  // Also check self-closing Route elements
  const selfClosingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  selfClosingElements.forEach(element => {
    const tagName = element.getTagNameNode().getText();
    
    if (tagName === 'Route') {
      const route = extractReactRouterRoute(element, relativePath);
      if (route) routes.push(route);
    }
  });

  // Express routes (app.get, router.post, etc.)
  if (framework === 'express') {
    const expressRoutes = extractExpressRoutes(sourceFile, relativePath);
    routes.push(...expressRoutes);
  }

  return routes;
}

/**
 * Extract route from Next.js App Router file path
 */
function extractNextAppRoute(filePath: string): Partial<Route> | null {
  // Only page.tsx/page.js files define routes
  if (!filePath.match(/page\.(tsx?|jsx?)$/)) {
    return null;
  }

  // Extract path from directory structure
  // app/settings/page.tsx -> /settings
  // app/users/[id]/page.tsx -> /users/[id]
  const match = filePath.match(/app(\/.*?)\/page\./);
  if (!match) return null;

  let path = match[1] || '/';
  
  // Handle route groups (parentheses)
  path = path.replace(/\/\([^)]+\)/g, '');
  
  // Handle catch-all routes
  path = path.replace(/\[\.\.\.([\w]+)\]/g, ':$1*');
  
  // Handle dynamic segments
  path = path.replace(/\[([\w]+)\]/g, ':$1');

  return {
    path: path || '/',
    params: extractDynamicParams(path),
  };
}

/**
 * Extract route from Next.js Pages Router file path
 */
function extractNextPagesRoute(filePath: string): Partial<Route> | null {
  // Skip API routes and special files
  if (filePath.includes('/api/') || filePath.includes('_app') || filePath.includes('_document')) {
    return null;
  }

  // Extract path from directory structure
  // pages/settings.tsx -> /settings
  // pages/users/[id].tsx -> /users/:id
  const match = filePath.match(/pages(\/.*?)\.(tsx?|jsx?)$/);
  if (!match) return null;

  let path = match[1];
  
  // Handle index files
  path = path.replace(/\/index$/, '') || '/';
  
  // Handle dynamic segments
  path = path.replace(/\[([\w]+)\]/g, ':$1');

  return {
    path,
    params: extractDynamicParams(path),
  };
}

/**
 * Extract route from React Router <Route> element
 */
function extractReactRouterRoute(
  element: JsxOpeningElement | JsxSelfClosingElement,
  relativePath: string
): Route | null {
  const attributes = element.getAttributes();
  
  let path: string | undefined;
  let component: string | undefined;

  for (const attr of attributes) {
    if (attr.getKind() === SyntaxKind.JsxAttribute) {
      const jsxAttr = attr.asKind(SyntaxKind.JsxAttribute);
      if (!jsxAttr) continue;
      
      const name = jsxAttr.getNameNode().getText();
      const initializer = jsxAttr.getInitializer();
      
      if (name === 'path' && initializer) {
        // Extract string value
        const text = initializer.getText();
        path = text.replace(/^["'{]|["'}]$/g, '');
      }
      
      if ((name === 'component' || name === 'element') && initializer) {
        const text = initializer.getText();
        // Try to extract component name
        const match = text.match(/<(\w+)/);
        if (match) {
          component = match[1];
        } else {
          component = text.replace(/^[{"]|[}"]$/g, '');
        }
      }
    }
  }

  if (!path) return null;

  return {
    path,
    sourceFile: relativePath,
    component,
    line: element.getStartLineNumber(),
    params: extractDynamicParams(path),
  };
}

/**
 * Extract Express routes from source file
 */
function extractExpressRoutes(sourceFile: SourceFile, relativePath: string): Route[] {
  const routes: Route[] = [];
  
  // Find app.get(), router.post(), etc.
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of callExpressions) {
    const expression = call.getExpression();
    const text = expression.getText();
    
    // Match app.get, router.post, etc.
    const methodMatch = text.match(/^(app|router)\.(get|post|put|patch|delete)$/);
    if (!methodMatch) continue;
    
    const args = call.getArguments();
    if (args.length < 1) continue;
    
    // First argument should be the path
    const pathArg = args[0].getText();
    const path = pathArg.replace(/^['"]|['"]$/g, '');
    
    if (path.startsWith('/')) {
      routes.push({
        path,
        sourceFile: relativePath,
        line: call.getStartLineNumber(),
        params: extractDynamicParams(path),
      });
    }
  }
  
  return routes;
}

/**
 * Extract dynamic parameter names from a path
 */
function extractDynamicParams(path: string): string[] {
  const params: string[] = [];
  
  // Match :param, [param], [param]
  const matches = path.matchAll(/[:[\]]([\w]+)/g);
  for (const match of matches) {
    if (match[1]) params.push(match[1]);
  }
  
  return params;
}
