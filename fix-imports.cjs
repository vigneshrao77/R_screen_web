const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let d = c.replace(/from\s+(['"])(.*?)\.js\1/g, 'from $1$2$1');
      if (c !== d) {
        fs.writeFileSync(p, d);
        console.log('Updated ' + p);
      }
    }
  });
}

walk('src');
