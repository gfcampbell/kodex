/**
 * Code Scanner
 * 
 * Parses the codebase and builds a CodeMap.
 */

import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import { glob } from 'glob';
import { join, relative } from 'path';
import type {
  CodeMap,
  Route,
  Component,
  Page,
  ExtractedString,
  ApiEndpoint,
  DetectedFeature,
  ScanConfig,
} from '@kodex/shared';
import { extractRoutes } from './routes.js';
import { extractComponents } from './components.js';
import { extractStrings } from './strings.js';
import { detectFeatures } from './features.js';

/**
 * Scan a codebase and return a CodeMap
 */
export async function scanCodebase(
  rootDir: string,
  config: ScanConfig
): Promise<CodeMap> {
  const startTime = Date.now();

  // Find all matching files
  const files = await glob(config.include, {
    cwd: rootDir,
    ignore: config.exclude,
    absolute: true,
  });

  // Create ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      jsx: 2, // React
    },
  });

  // Add files to project
  for (const file of files) {
    project.addSourceFileAtPath(file);
  }

  // Detect framework
  const framework = config.framework === 'auto' 
    ? detectFramework(project, rootDir)
    : config.framework;

  // Extract data from each file
  const routes: Route[] = [];
  const components: Component[] = [];
  const strings: ExtractedString[] = [];
  const apiEndpoints: ApiEndpoint[] = [];
  const allFeatures: DetectedFeature[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const relativePath = relative(rootDir, sourceFile.getFilePath());

    // Extract routes
    const fileRoutes = extractRoutes(sourceFile, relativePath, framework);
    routes.push(...fileRoutes);

    // Extract components
    const fileComponents = extractComponents(sourceFile, relativePath);
    components.push(...fileComponents);

    // Extract strings
    const fileStrings = extractStrings(sourceFile, relativePath);
    strings.push(...fileStrings);

    // Detect features
    const fileFeatures = detectFeatures(sourceFile, relativePath);
    allFeatures.push(...fileFeatures);
  }

  // Build pages (combine routes with their components and strings)
  const pages = buildPages(routes, components, strings);

  // Deduplicate features by ID
  const featuresMap = new Map<string, DetectedFeature>();
  for (const feature of allFeatures) {
    const existing = featuresMap.get(feature.id);
    if (existing) {
      // Merge evidence
      existing.evidence.push(...feature.evidence);
      existing.confidence = Math.max(existing.confidence, feature.confidence);
    } else {
      featuresMap.set(feature.id, feature);
    }
  }
  const features = Array.from(featuresMap.values());

  const endTime = Date.now();

  return {
    routes,
    components,
    pages,
    strings,
    apiEndpoints,
    features,
    meta: {
      scannedAt: new Date().toISOString(),
      filesScanned: files.length,
      scanDurationMs: endTime - startTime,
      framework: framework || undefined,
    },
  };
}

/**
 * Detect the framework used in the project
 */
function detectFramework(
  project: Project,
  rootDir: string
): 'react' | 'nextjs' | 'express' | undefined {
  // Check for Next.js
  const hasNextConfig = project.getSourceFiles().some(
    sf => sf.getFilePath().includes('next.config')
  );
  const hasPagesDir = project.getSourceFiles().some(
    sf => sf.getFilePath().includes('/pages/') || sf.getFilePath().includes('/app/')
  );
  
  if (hasNextConfig || hasPagesDir) {
    return 'nextjs';
  }

  // Check for React Router
  const hasReactRouter = project.getSourceFiles().some(sf => {
    const imports = sf.getImportDeclarations();
    return imports.some(i => 
      i.getModuleSpecifierValue().includes('react-router')
    );
  });

  if (hasReactRouter) {
    return 'react';
  }

  // Check for Express
  const hasExpress = project.getSourceFiles().some(sf => {
    const imports = sf.getImportDeclarations();
    return imports.some(i => 
      i.getModuleSpecifierValue() === 'express'
    );
  });

  if (hasExpress) {
    return 'express';
  }

  return undefined;
}

/**
 * Build Page objects by combining routes with their components
 */
function buildPages(
  routes: Route[],
  components: Component[],
  strings: ExtractedString[]
): Page[] {
  const pages: Page[] = [];

  for (const route of routes) {
    // Find components associated with this route
    const pageComponents = components
      .filter(c => {
        // Component is in the same file as the route
        if (c.sourceFile === route.sourceFile) return true;
        // Component name matches the route's component
        if (route.component && c.name === route.component) return true;
        return false;
      })
      .map(c => c.name);

    // Find strings in files associated with this page
    const sourceFiles = new Set([route.sourceFile]);
    pageComponents.forEach(compName => {
      const comp = components.find(c => c.name === compName);
      if (comp) sourceFiles.add(comp.sourceFile);
    });

    const pageStrings = strings.filter(s => sourceFiles.has(s.sourceFile));

    // Detect features for this page
    const features: string[] = []; // TODO: map features to pages

    pages.push({
      path: route.path,
      components: pageComponents,
      sourceFiles: Array.from(sourceFiles),
      strings: pageStrings,
      features,
    });
  }

  return pages;
}
