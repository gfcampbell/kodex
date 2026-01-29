/**
 * String Extractor
 * 
 * Extracts user-facing strings from source files.
 */

import { SourceFile, SyntaxKind, Node, JsxAttribute } from 'ts-morph';
import type { ExtractedString } from '@kodex/shared';

/**
 * Extract user-facing strings from a source file
 */
export function extractStrings(
  sourceFile: SourceFile,
  relativePath: string
): ExtractedString[] {
  const strings: ExtractedString[] = [];

  // Get all JSX elements
  const jsxOpeningElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  const jsxSelfClosing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);

  // Process opening elements (look at children for text)
  for (const element of jsxOpeningElements) {
    const tagName = element.getTagNameNode().getText().toLowerCase();
    const type = getStringTypeFromTag(tagName);
    
    // Get attributes (labels, placeholders, etc.)
    const attrStrings = extractAttributeStrings(element, relativePath, type);
    strings.push(...attrStrings);

    // Get text content between tags
    const parent = element.getParent();
    if (parent && parent.getKind() === SyntaxKind.JsxElement) {
      const jsxElement = parent.asKind(SyntaxKind.JsxElement);
      if (jsxElement) {
        const textContent = extractJsxTextContent(jsxElement);
        if (textContent) {
          strings.push({
            value: textContent,
            sourceFile: relativePath,
            line: element.getStartLineNumber(),
            type,
          });
        }
      }
    }
  }

  // Process self-closing elements (just attributes)
  for (const element of jsxSelfClosing) {
    const tagName = element.getTagNameNode().getText().toLowerCase();
    const type = getStringTypeFromTag(tagName);
    
    const attrStrings = extractAttributeStrings(element, relativePath, type);
    strings.push(...attrStrings);
  }

  // Filter out likely non-user-facing strings
  return strings.filter(s => isUserFacing(s.value));
}

/**
 * Determine the type of string based on the JSX tag
 */
function getStringTypeFromTag(tagName: string): ExtractedString['type'] {
  // Heading tags
  if (/^h[1-6]$/.test(tagName)) return 'heading';
  
  // Button elements
  if (tagName === 'button') return 'button';
  
  // Label elements
  if (tagName === 'label') return 'label';
  
  // Input elements (for placeholders)
  if (tagName === 'input' || tagName === 'textarea') return 'placeholder';

  // Error-related components (common naming patterns)
  if (tagName.includes('error') || tagName.includes('alert')) return 'error';

  return 'other';
}

/**
 * Extract strings from JSX attributes
 */
function extractAttributeStrings(
  element: Node,
  relativePath: string,
  defaultType: ExtractedString['type']
): ExtractedString[] {
  const strings: ExtractedString[] = [];
  const attributes = element.getDescendantsOfKind(SyntaxKind.JsxAttribute);

  for (const attr of attributes) {
    const name = attr.getNameNode().getText();
    const initializer = attr.getInitializer();
    if (!initializer) continue;

    // Only process certain attributes
    const relevantAttrs = [
      'placeholder', 'title', 'alt', 'aria-label', 'label',
      'children', 'text', 'message', 'description', 'content'
    ];
    
    if (!relevantAttrs.includes(name)) continue;

    // Extract string value
    const value = extractStringValue(initializer);
    if (value) {
      strings.push({
        value,
        sourceFile: relativePath,
        line: attr.getStartLineNumber(),
        type: name === 'placeholder' ? 'placeholder' : defaultType,
      });
    }
  }

  return strings;
}

/**
 * Extract string value from a JSX attribute initializer
 */
function extractStringValue(node: Node): string | null {
  const kind = node.getKind();

  // String literal: "text"
  if (kind === SyntaxKind.StringLiteral) {
    return node.asKind(SyntaxKind.StringLiteral)?.getLiteralValue() ?? null;
  }

  // JSX expression: {"text"}
  if (kind === SyntaxKind.JsxExpression) {
    const expr = node.asKind(SyntaxKind.JsxExpression);
    const innerExpr = expr?.getExpression();
    if (innerExpr?.getKind() === SyntaxKind.StringLiteral) {
      return innerExpr.asKind(SyntaxKind.StringLiteral)?.getLiteralValue() ?? null;
    }
  }

  return null;
}

/**
 * Extract text content from JSX element children
 */
function extractJsxTextContent(element: Node): string | null {
  const texts: string[] = [];

  // Get JSX text nodes
  const textNodes = element.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const textNode of textNodes) {
    const text = textNode.getText().trim();
    if (text) texts.push(text);
  }

  // Also check string literals in expressions
  const expressions = element.getDescendantsOfKind(SyntaxKind.JsxExpression);
  for (const expr of expressions) {
    const innerExpr = expr.getExpression();
    if (innerExpr?.getKind() === SyntaxKind.StringLiteral) {
      const text = innerExpr.asKind(SyntaxKind.StringLiteral)?.getLiteralValue();
      if (text) texts.push(text);
    }
  }

  return texts.length > 0 ? texts.join(' ') : null;
}

/**
 * Filter out likely non-user-facing strings
 */
function isUserFacing(str: string): boolean {
  // Too short
  if (str.length < 2) return false;

  // Looks like a variable or technical string
  if (/^[a-z_][a-z0-9_]*$/i.test(str)) return false;

  // Looks like a URL or path
  if (str.startsWith('/') || str.startsWith('http')) return false;

  // Looks like code
  if (str.includes('=>') || str.includes('()')) return false;

  // All uppercase (likely a constant)
  if (str === str.toUpperCase() && str.length > 3) return false;

  return true;
}
