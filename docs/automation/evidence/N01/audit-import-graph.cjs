// Read-only source audit; generated evidence is written only beside this script.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = 'K:\\ANTIGRAVITY\\HABILIDADES\\TEXT ANIMATION AUTOMATION';
if (process.cwd() !== root) throw new Error('Unexpected cwd');
const rel = p => path.relative(root, p).replaceAll('\\', '/');
function resolve(from, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null;
  const base = spec.startsWith('@/') ? path.join(root, 'src', spec.slice(2)) : path.resolve(path.dirname(from), spec);
  return [base, ...['.ts','.tsx','.js','.jsx','.css','/index.ts','/index.tsx'].map(x => base+x)].find(x => fs.existsSync(x) && fs.statSync(x).isFile()) || null;
}
function graph(entry) {
  const seen = new Set(), edges = [], findings = [], unresolved = [];
  function visit(file) {
    if (seen.has(file)) return;
    if (!file.startsWith(root+path.sep)) throw new Error('External source escape');
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    source.split(/\r?\n/).forEach((line, i) => {
      if (/https?:\/\/|fontFamily|font-family|@font-face|FontFace|loadFont|\.css['"]|Environment|useTexture|useLoader|staticFile/.test(line)) findings.push({file:rel(file),line:i+1,text:line.trim()});
    });
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function walk(node) {
      let spec;
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && !node.isTypeOnly && !node.importClause?.isTypeOnly) spec = node.moduleSpecifier;
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(ast) === 'require')) spec = node.arguments[0];
      if (spec && ts.isStringLiteral(spec)) {
        const target = resolve(file, spec.text);
        edges.push({from:rel(file),specifier:spec.text,to:target ? rel(target) : null});
        if (target) visit(target);
        else if (spec.text.startsWith('.') || spec.text.startsWith('@/')) unresolved.push({from:rel(file),specifier:spec.text});
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);
  }
  visit(path.join(root, entry));
  return {entry,files:[...seen].map(rel).sort(),edges,findings,unresolved};
}
const report = {generatedAtUtc:new Date().toISOString(),scope:'Static literal imports/re-exports/require/dynamic-import; local project closure only. Package internals audited separately. No render, font resolution or network access.',graphs:[graph('src/remotion/MainComposition.tsx'),graph('src/remotion/index.ts')]};
fs.writeFileSync(path.join(__dirname,'import-graph-remediation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.graphs.map(g=>({entry:g.entry,files:g.files.length,css:g.files.filter(f=>f.endsWith('.css')),unresolved:g.unresolved})),null,2));
