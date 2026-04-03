const fs = require('fs');

function fix(file) {
    let p = 'src/pages/auth/' + file;
    let code = fs.readFileSync(p, 'utf8');
    
    code = code.replace(/function AuthBackground\(\) \{[\s\S]*?\}\n/, '');
    code = code.replace(/<AuthBackground \/>\s*/g, '');
    code = code.replace(/const DOT_GRID_STYLE = \{[\s\S]*?\};\n/g, '');
    
    if (!code.includes('AuthLayout')) {
        code = `import { AuthLayout } from '@/layouts/AuthLayout';\n` + code;
    }
    
    code = code.replace(/<div className="relative min-h-screen overflow-hidden bg-\[\#0a0a0a\] text-white(?: sm:p-6)?">\s*/, '<AuthLayout>\n');
    
    code = code.replace(/(}<\/div>\s*)<\/div>\s*\);\s*\}\s*$/, '$1</AuthLayout>\n  );\n}');

    fs.writeFileSync(p, code);
}

fix('Login.jsx');
fix('Signup.jsx');
